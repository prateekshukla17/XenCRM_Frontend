import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;
    const dashboardData = await prisma.customers_mv.findMany({
      select: {
        name: true,
        email: true,
        total_spend: true,
        total_orders: true,
        total_visits: true,
        status: true,
      },
      orderBy: {
        synced_at: 'desc',
      },
      take: limit,
      skip: skip,
    });

    const total_count = await prisma.customers_mv.count();

    return NextResponse.json(
      {
        success: true,
        data: dashboardData,
        pagination: {
          currentPage: page,
          limit: limit,
          totalRecords: total_count,
          totalPage: Math.ceil(total_count / limit),
          hasNext: skip + limit < total_count,
          hasPrevious: page > 1,
        },
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
