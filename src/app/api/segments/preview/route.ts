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

// Helper function to build SQL query from rules with proper sanitization
function buildSqlQuery(rules: RuleGroup[]): string {
  if (rules.length === 0) return '';

  const groupClauses = rules.map(group => {
    if (group.rules.length === 0) return '1=0'; // No rules in group
    
    const ruleClauses = group.rules.map(rule => {
      const { field, operator, value } = rule;
      
      // Sanitize field name (only allow known columns)
      const allowedFields = [
        'total_spend',
        'total_visits', 
        'total_orders',
        'days_since_last_order',
        'status',
        'name',
        'email'
      ];
      
      if (!allowedFields.includes(field)) {
        throw new Error(`Invalid field: ${field}`);
      }
      
      switch (operator) {
        case '>':
          return `${field} > ${typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value}`;
        case '>=':
          return `${field} >= ${typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value}`;
        case '<':
          return `${field} < ${typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value}`;
        case '<=':
          return `${field} <= ${typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value}`;
        case '=':
          return `${field} = ${typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value}`;
        case '!=':
          return `${field} != ${typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value}`;
        case 'contains':
          return `${field} ILIKE '%${String(value).replace(/'/g, "''")}%'`;
        case 'not_contains':
          return `${field} NOT ILIKE '%${String(value).replace(/'/g, "''")}%'`;
        case 'starts_with':
          return `${field} ILIKE '${String(value).replace(/'/g, "''")}%'`;
        case 'ends_with':
          return `${field} ILIKE '%${String(value).replace(/'/g, "''")}'`;
        default:
          return `${field} = ${typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value}`;
      }
    });

    return `(${ruleClauses.join(` ${group.operator} `)})`;
  });

  return groupClauses.join(' OR ');
}

// POST - Preview audience size for given rules
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rules } = body;

    if (!rules || !Array.isArray(rules)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rules array is required',
        },
        { status: 400 }
      );
    }

    if (rules.length === 0) {
      return NextResponse.json(
        {
          success: true,
          count: 0,
        },
        { status: 200 }
      );
    }

    // Build the SQL query
    let whereClause: string;
    try {
      whereClause = buildSqlQuery(rules);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid rule configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        { status: 400 }
      );
    }

    if (!whereClause) {
      return NextResponse.json(
        {
          success: true,
          count: 0,
        },
        { status: 200 }
      );
    }

    // Execute the count query
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM customers_mv 
      WHERE ${Prisma.raw(whereClause)}
    ` as any[];
    
    const count = parseInt(countResult[0]?.count || '0');

    return NextResponse.json(
      {
        success: true,
        count: count,
        query: whereClause, // For debugging purposes (remove in production)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error previewing audience:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to preview audience size',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET - Get sample customers matching the rules (optional for testing)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rulesParam = searchParams.get('rules');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100); // Max 100 for safety

    if (!rulesParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rules parameter is required',
        },
        { status: 400 }
      );
    }

    let rules;
    try {
      rules = JSON.parse(decodeURIComponent(rulesParam));
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid rules format',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(rules) || rules.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          count: 0,
        },
        { status: 200 }
      );
    }

    // Build the SQL query
    let whereClause: string;
    try {
      whereClause = buildSqlQuery(rules);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid rule configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        { status: 400 }
      );
    }

    if (!whereClause) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          count: 0,
        },
        { status: 200 }
      );
    }

    // Get sample customers
    const customers = await prisma.$queryRaw`
      SELECT 
        customer_id,
        name,
        email,
        total_spend,
        total_visits,
        total_orders,
        status,
        days_since_last_order
      FROM customers_mv 
      WHERE ${Prisma.raw(whereClause)}
      ORDER BY total_spend DESC
      LIMIT ${limit}
    ` as any[];

    return NextResponse.json(
      {
        success: true,
        data: customers,
        count: customers.length,
        limit: limit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting sample customers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get sample customers',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}