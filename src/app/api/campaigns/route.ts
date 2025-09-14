import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

interface RuleGroup {
  id: string;
  operator: 'AND' | 'OR';
  rules: Rule[];
}

interface Rule {
  id: string;
  field: string;
  operator: string;
  value: string | number;
}

interface CampaignRequest {
  name: string;
  segment_id: string;
  message_template: string;
  campaign_type: string;
  created_by: string;
}

// Helper function to build Prisma where clause from segment rules
function buildWhereClause(ruleGroups: RuleGroup[]) {
  if (ruleGroups.length === 0) {
    return {};
  }

  // If multiple rule groups, they are combined with OR
  const orConditions = ruleGroups.map(group => {
    if (group.rules.length === 0) {
      return {};
    }

    // Within a group, rules are combined with AND or OR based on group operator
    const conditions = group.rules.map(rule => {
      const field = rule.field;
      const operator = rule.operator;
      const value = rule.value;

      switch (operator) {
        case '>':
          return { [field]: { gt: Number(value) } };
        case '>=':
          return { [field]: { gte: Number(value) } };
        case '<':
          return { [field]: { lt: Number(value) } };
        case '<=':
          return { [field]: { lte: Number(value) } };
        case '=':
          return { [field]: { equals: field === 'total_spend' ? Number(value) : value } };
        case '!=':
          return { [field]: { not: field === 'total_spend' ? Number(value) : value } };
        case 'contains':
          return { [field]: { contains: String(value), mode: 'insensitive' } };
        case 'not_contains':
          return { [field]: { not: { contains: String(value), mode: 'insensitive' } } };
        case 'starts_with':
          return { [field]: { startsWith: String(value), mode: 'insensitive' } };
        case 'ends_with':
          return { [field]: { endsWith: String(value), mode: 'insensitive' } };
        default:
          return { [field]: { equals: value } };
      }
    });

    // Combine conditions within group based on operator
    if (group.operator === 'OR') {
      return { OR: conditions };
    } else {
      return { AND: conditions };
    }
  });

  // If multiple rule groups, combine with OR
  if (ruleGroups.length === 1) {
    return orConditions[0];
  } else {
    return { OR: orConditions };
  }
}

// Helper function to replace placeholders in message template
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function replacePlaceholders(template: string, customer: any): string {
  return template
    .replace(/\{\{name\}\}/g, customer.name || 'Customer')
    .replace(/\{\{email\}\}/g, customer.email || '')
    .replace(/\{\{total_spend\}\}/g, customer.total_spend ? `₹${Number(customer.total_spend).toLocaleString('en-IN')}` : '₹0')
    .replace(/\{\{total_orders\}\}/g, String(customer.total_orders || 0))
    .replace(/\{\{total_visits\}\}/g, String(customer.total_visits || 0));
}

export async function POST(request: NextRequest) {
  try {
    const body: CampaignRequest = await request.json();
    
    // Validate required fields
    if (!body.name || !body.segment_id || !body.message_template) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, segment_id, message_template',
        },
        { status: 400 }
      );
    }

    // Step 1: Get segment information and rules
    const segment = await prisma.segments.findUnique({
      where: {
        segment_id: body.segment_id,
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

    // Step 2: Create campaign record
    const campaign = await prisma.campaigns.create({
      data: {
        name: body.name,
        segment_id: body.segment_id,
        message_template: body.message_template,
        campaign_type: body.campaign_type,
        created_by: body.created_by,
        status: 'ACTIVE',
      },
    });

    console.log('Campaign created:', campaign.campaign_id);

    // Step 3: Parse segment rules and build query
    const ruleGroups = segment.rules as unknown as RuleGroup[];
    const whereClause = buildWhereClause(ruleGroups);

    console.log('Where clause:', JSON.stringify(whereClause, null, 2));

    // Step 4: Query customers based on segment rules
    const matchingCustomers = await prisma.customers_mv.findMany({
      where: whereClause,
      select: {
        customer_id: true,
        name: true,
        email: true,
        total_spend: true,
        total_orders: true,
        total_visits: true,
      },
    });

    console.log(`Found ${matchingCustomers.length} matching customers`);

    // Step 5: Create communication log entries for each matching customer
    const communicationLogs = [];
    
    for (const customer of matchingCustomers) {
      // Replace placeholders in message template
      const personalizedMessage = replacePlaceholders(body.message_template, customer);
      
      const logEntry = {
        campaign_id: campaign.campaign_id,
        customer_id: customer.customer_id,
        customer_email: customer.email || '',
        customer_name: customer.name || 'Unknown',
        message_text: personalizedMessage,
        status: 'PENDING',
        attempts: 0,
        max_attempts: 3,
      };
      
      communicationLogs.push(logEntry);
    }

    // Batch insert communication logs
    if (communicationLogs.length > 0) {
      await prisma.communication_log.createMany({
        data: communicationLogs,
      });
    }

    // Step 6: Update campaign with target audience count
    await prisma.campaigns.update({
      where: {
        campaign_id: campaign.campaign_id,
      },
      data: {
        target_audience_count: matchingCustomers.length,
      },
    });

    console.log(`Created ${communicationLogs.length} communication log entries`);

    return NextResponse.json(
      {
        success: true,
        data: {
          campaign_id: campaign.campaign_id,
          campaign_name: campaign.name,
          total_customers: matchingCustomers.length,
          segment_name: segment.name,
        },
        message: `Campaign "${body.name}" created successfully with ${matchingCustomers.length} targeted customers`,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating campaign:', error);
    
    // Handle Prisma constraint errors
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid segment_id provided',
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create campaign',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET endpoint to fetch campaigns (optional, for future use)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;

    const campaigns = await prisma.campaigns.findMany({
      include: {
        segments: {
          select: {
            name: true,
          },
        },
        campaign_stats: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
      skip: skip,
    });

    const totalCount = await prisma.campaigns.count();

    return NextResponse.json(
      {
        success: true,
        data: campaigns,
        pagination: {
          currentPage: page,
          limit: limit,
          totalRecords: totalCount,
          totalPage: Math.ceil(totalCount / limit),
          hasNext: skip + limit < totalCount,
          hasPrevious: page > 1,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch campaigns',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}