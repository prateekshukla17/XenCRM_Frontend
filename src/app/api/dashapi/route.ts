import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const dashboardData = await prisma.customers_mv.findMany({
      select: {
        name: true,
        email: true,
        total_spend: true,
        total_visits: true,
        status: true,
      },
      orderBy: {
        synced_at: 'desc',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: dashboardData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error Fetching access Logs', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch logs',
      },
      {
        status: 500,
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}
