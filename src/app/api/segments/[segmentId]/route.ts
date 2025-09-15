import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '../../../../generated/prisma';

const prisma = new PrismaClient();

interface Rule {
  id: string;
  field: string;
  operator: string;
  value: string | number;
}

interface RuleGroup {
  id: string;
  operator: 'AND' | 'OR';
  rules: Rule[];
}

// Helper function to build SQL query from rules
function buildSqlQuery(rules: RuleGroup[]): string {
  if (rules.length === 0) return '';

  const groupClauses = rules.map(group => {
    if (group.rules.length === 0) return '1=0'; // No rules in group
    
    const ruleClauses = group.rules.map(rule => {
      const { field, operator, value } = rule;
      
      switch (operator) {
        case '>':
          return `${field} > ${typeof value === 'string' ? `'${value}'` : value}`;
        case '>=':
          return `${field} >= ${typeof value === 'string' ? `'${value}'` : value}`;
        case '<':
          return `${field} < ${typeof value === 'string' ? `'${value}'` : value}`;
        case '<=':
          return `${field} <= ${typeof value === 'string' ? `'${value}'` : value}`;
        case '=':
          return `${field} = ${typeof value === 'string' ? `'${value}'` : value}`;
        case '!=':
          return `${field} != ${typeof value === 'string' ? `'${value}'` : value}`;
        case 'contains':
          return `${field} ILIKE '%${value}%'`;
        case 'not_contains':
          return `${field} NOT ILIKE '%${value}%'`;
        case 'starts_with':
          return `${field} ILIKE '${value}%'`;
        case 'ends_with':
          return `${field} ILIKE '%${value}'`;
        default:
          return `${field} = ${typeof value === 'string' ? `'${value}'` : value}`;
      }
    });

    return `(${ruleClauses.join(` ${group.operator} `)})`;
  });

  return groupClauses.join(' OR ');
}

// GET - Fetch single segment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ segmentId: string }> }
) {
  try {
    const { segmentId } = await params;

    const segment = await prisma.segments.findUnique({
      where: {
        segment_id: segmentId,
      },
    });

    if (!segment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Segment not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: segment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching segment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch segment',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update segment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ segmentId: string }> }
) {
  try {
    const { segmentId } = await params;
    const body = await request.json();
    
    const { name, description, rules } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Segment name is required',
        },
        { status: 400 }
      );
    }

    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one rule group is required',
        },
        { status: 400 }
      );
    }

    // Check if segment exists
    const existingSegment = await prisma.segments.findUnique({
      where: { segment_id: segmentId },
    });

    if (!existingSegment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Segment not found',
        },
        { status: 404 }
      );
    }

    // Calculate preview count
    let previewCount = 0;
    try {
      const whereClause = buildSqlQuery(rules);
      if (whereClause) {
        const countResult = await prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM customers_mv 
          WHERE ${Prisma.raw(whereClause)}
        ` as Array<{ count: string }>;
        previewCount = parseInt(countResult[0]?.count || '0');
      }
    } catch (countError) {
      console.warn('Error calculating preview count:', countError);
      // Continue with segment update even if count fails
    }

    const segment = await prisma.segments.update({
      where: {
        segment_id: segmentId,
      },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        rules: rules,
        preview_count: previewCount,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: segment,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating segment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update segment',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete segment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ segmentId: string }> }
) {
  try {
    const { segmentId } = await params;

    // Check if segment exists
    const existingSegment = await prisma.segments.findUnique({
      where: { segment_id: segmentId },
    });

    if (!existingSegment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Segment not found',
        },
        { status: 404 }
      );
    }

    // Check if segment is used in any campaigns
    const campaignsUsingSegment = await prisma.campaigns.findMany({
      where: {
        segment_id: segmentId,
      },
      select: {
        campaign_id: true,
        name: true,
      },
    });

    if (campaignsUsingSegment.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete segment. It is being used by ${campaignsUsingSegment.length} campaign(s)`,
          campaigns: campaignsUsingSegment,
        },
        { status: 400 }
      );
    }

    await prisma.segments.delete({
      where: {
        segment_id: segmentId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Segment deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting segment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete segment',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}