import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const result = await prisma.campaigns.findMany({
      select: {
        name: true,
        campaign_type: true,
        target_audience_count: true,
        status: true,
        created_at: true,
        campaign_stats: {
          select: {
            total_delivered: true,
            total_failed: true,
            last_updated: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error Fething Campaign data', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch',
      },
      {
        status: 500,
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}
