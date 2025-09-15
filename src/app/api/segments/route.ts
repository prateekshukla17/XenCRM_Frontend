import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '../../../generated/prisma';
import { getServerSession } from 'next-auth';

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

// GET - Fetch all segments
export async function GET() {
  try {
    const segments = await prisma.segments.findMany({
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: segments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching segments:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch segments',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create new segment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
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
      // Continue with segment creation even if count fails
    }

    const segment = await prisma.segments.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        rules: rules,
        preview_count: previewCount,
        created_by: session?.user?.email || 'anonymous',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: segment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating segment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create segment',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}