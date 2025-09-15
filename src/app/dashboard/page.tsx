'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/navbar';
import { Users, IndianRupeeIcon, ShoppingCart, Eye } from 'lucide-react';

interface DashboardData {
  name: string;
  email: string;
  total_spend: string;
  total_orders: number;
  total_visits: string;
  status: string;
}

interface ApiResponse {
  success: boolean;
  data: DashboardData[];
  error?: string;
  pagination?: {
    currentPage: number;
    limit: number;
    totalRecords: number;
    totalPage: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

interface AnalyticsData {
  totalUsers: number;
  totalRevenue: number;
  totalOrders: number;
  totalVisits: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<DashboardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalVisits: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCustomers();
    }
  }, [status]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashapi');
      const result: ApiResponse = await response.json();

      if (result.success) {
        setCustomers(result.data);

        // Calculate analytics
        const totalUsers = result.data.length;
        const totalRevenue = result.data.reduce(
          (sum, customer) => sum + parseFloat(customer.total_spend || '0'),
          0
        );
        const totalOrders = result.data.reduce(
          (sum, customer) => sum + (customer.total_orders || 0),
          0
        );
        const totalVisits = result.data.reduce(
          (sum, customer) => sum + parseInt(customer.total_visits || '0'),
          0
        );

        setAnalytics({
          totalUsers,
          totalRevenue,
          totalOrders,
          totalVisits,
        });
      } else {
        setError(result.error || 'Failed to fetch customer data');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
    switch (status.toLowerCase()) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'inactive':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num)
      ? '₹0'
      : `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  const AnalyticsCard = ({
    title,
    value,
    icon: Icon,
    color,
    formatter,
  }: {
    title: string;
    value: number;
    icon: any;
    color: string;
    formatter?: (val: number) => string;
  }) => (
    <div className='bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-gray-600 mb-1'>{title}</p>
          <p className='text-2xl font-bold text-gray-900'>
            {formatter ? formatter(value) : formatNumber(value)}
          </p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className='h-6 w-6 text-white' />
        </div>
      </div>
    </div>
  );

  if (status === 'loading')
    return (
      <div className='bg-gradient-background'>
        <p>Loading...</p>
      </div>
    );

  if (!session) return null;

  return (
    <>
      <Navbar />
      <div className='min-h-screen bg-gradient-background'>
        <div className='p-6 space-y-6'>
          {/* Header */}
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-3xl font-bold text-white'>Dashboard</h1>
            </div>
            <button
              onClick={fetchCustomers}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2'
            >
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                />
              </svg>
              <span>Refresh</span>
            </button>
          </div>

          {/* Analytics Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <AnalyticsCard
              title='Total Users'
              value={analytics.totalUsers}
              icon={Users}
              color='bg-blue-500'
            />
            <AnalyticsCard
              title='Total Revenue'
              value={analytics.totalRevenue}
              icon={IndianRupeeIcon}
              color='bg-green-500'
              formatter={(val) => formatCurrency(val)}
            />
            <AnalyticsCard
              title='Total Orders'
              value={analytics.totalOrders}
              icon={ShoppingCart}
              color='bg-purple-500'
            />
            <AnalyticsCard
              title='Total Visits'
              value={analytics.totalVisits}
              icon={Eye}
              color='bg-orange-500'
            />
          </div>

          {/* Customer Data Table */}
          <div className='bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100'>
            <div className='px-6 py-4 border-b border-gray-200 bg-gray-50'>
              <div className='flex justify-between items-center'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Customer Overview
                  </h3>
                  <p className='text-sm text-gray-600 mt-1'>
                    Manage and view all your customers in one place
                  </p>
                </div>
                <div className='text-sm text-gray-500'>
                  {customers.length} customers
                </div>
              </div>
            </div>

            {loading ? (
              <div className='p-8 text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                <p className='mt-2 text-gray-600'>Loading customer data...</p>
              </div>
            ) : error ? (
              <div className='p-8 text-center'>
                <div className='text-red-600 mb-4'>
                  <svg
                    className='mx-auto h-12 w-12'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z'
                    />
                  </svg>
                </div>
                <p className='text-red-600 font-medium'>{error}</p>
                <button
                  onClick={fetchCustomers}
                  className='mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors'
                >
                  Try Again
                </button>
              </div>
            ) : customers.length === 0 ? (
              <div className='p-8 text-center'>
                <p className='text-gray-600'>No customer data available</p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Customer
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Email
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Total Spend
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Orders
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Visits
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {customers.map((customer, index) => (
                      <tr
                        key={index}
                        className='hover:bg-gray-50 transition-colors'
                      >
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='flex items-center'>
                            <div className='flex-shrink-0 h-10 w-10'>
                              <div className='h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center'>
                                <span className='text-blue-600 font-medium text-sm'>
                                  {customer.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className='ml-4'>
                              <div className='text-sm font-medium text-gray-900'>
                                {customer.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {customer.email}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium'>
                          {formatCurrency(customer.total_spend)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium'>
                          <div className='flex items-center'>
                            <ShoppingCart className='h-4 w-4 text-purple-500 mr-2' />
                            {formatNumber(customer.total_orders)}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          <div className='flex items-center'>
                            <Eye className='h-4 w-4 text-orange-500 mr-2' />
                            {formatNumber(parseInt(customer.total_visits))}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span className={getStatusBadge(customer.status)}>
                            {customer.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
