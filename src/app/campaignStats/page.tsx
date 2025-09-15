'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import Navbar from '@/components/navbar';
interface CampaignStats {
  total_delivered: number | null;
  total_failed: number | null;
  last_updated: string | null;
}

interface Campaign {
  name: string;
  campaign_type: string;
  target_audience_count: number;
  status: string;
  created_at: string;
  campaign_stats: CampaignStats | null;
}

interface CampaignsResponse {
  success: boolean;
  data: Campaign[];
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return <CheckCircle className='h-4 w-4 text-green-500' />;
    case 'pending':
      return <Clock className='h-4 w-4 text-yellow-500' />;
    case 'completed':
      return <CheckCircle className='h-4 w-4 text-blue-500' />;
    case 'failed':
      return <XCircle className='h-4 w-4 text-red-500' />;
    default:
      return <AlertCircle className='h-4 w-4 text-gray-500' />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/campaignstats');
      const data: CampaignsResponse = await response.json();

      if (data.success) {
        setCampaigns(data.data);
      } else {
        setError('Failed to fetch campaigns');
      }
    } catch (err) {
      setError('Error loading campaigns');
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-background p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-200 rounded w-1/4 mb-2'></div>
            <div className='h-4 bg-gray-200 rounded w-1/2 mb-8'></div>
            <div className='space-y-4'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='bg-white rounded-lg p-6 shadow-sm'>
                  <div className='h-6 bg-gray-200 rounded w-1/3 mb-4'></div>
                  <div className='h-4 bg-gray-200 rounded w-1/2'></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 p-6'>
        <div className='max-w-7xl mx-auto'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
            <div className='flex items-center'>
              <AlertCircle className='h-5 w-5 text-red-500 mr-2' />
              <span className='text-red-700'>{error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className='min-h-screen bg-gradient-background p-6'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-2xl font-bold text-white mb-2'>Campaigns</h1>
            <div className='mt-4 text-sm text-white'>
              {campaigns.length}{' '}
              {campaigns.length === 1 ? 'campaign' : 'campaigns'}
            </div>
          </div>

          {/* Campaigns List */}
          <div className='space-y-4'>
            {campaigns.length === 0 ? (
              <div className='bg-white rounded-lg p-12 text-center shadow-sm'>
                <TrendingUp className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  No campaigns found
                </h3>
                <p className='text-gray-500'>
                  Create your first campaign to get started.
                </p>
              </div>
            ) : (
              campaigns.map((campaign, index) => (
                <div
                  key={index}
                  className='bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow'
                >
                  <div className='flex items-center justify-between'>
                    {/* Left Section - Campaign Info */}
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <h3 className='text-lg font-semibold text-gray-900'>
                          {campaign.name}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                            campaign.status
                          )}`}
                        >
                          {getStatusIcon(campaign.status)}
                          {campaign.status}
                        </span>
                      </div>

                      <div className='flex items-center gap-6 text-sm text-gray-600'>
                        <div className='flex items-center gap-1'>
                          <span className='font-medium'>Type:</span>
                          <span className='capitalize'>
                            {campaign.campaign_type}
                          </span>
                        </div>

                        <div className='flex items-center gap-1'>
                          <Users className='h-4 w-4' />
                          <span>
                            {campaign.target_audience_count.toLocaleString()}{' '}
                            targets
                          </span>
                        </div>

                        <div className='flex items-center gap-1'>
                          <Calendar className='h-4 w-4' />
                          <span>Created {formatDate(campaign.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Campaign Stats */}
                    <div className='flex items-center gap-8 ml-8'>
                      {campaign.campaign_stats ? (
                        <>
                          <div className='text-center'>
                            <div className='text-2xl font-bold text-green-600'>
                              {campaign.campaign_stats.total_delivered?.toLocaleString() ||
                                '0'}
                            </div>
                            <div className='text-xs text-gray-500 uppercase tracking-wide'>
                              Delivered
                            </div>
                          </div>

                          <div className='text-center'>
                            <div className='text-2xl font-bold text-red-600'>
                              {campaign.campaign_stats.total_failed?.toLocaleString() ||
                                '0'}
                            </div>
                            <div className='text-xs text-gray-500 uppercase tracking-wide'>
                              Failed
                            </div>
                          </div>

                          {campaign.campaign_stats.last_updated && (
                            <div className='text-center'>
                              <div className='text-sm text-gray-600'>
                                Last updated
                              </div>
                              <div className='text-xs text-gray-500'>
                                {formatDate(
                                  campaign.campaign_stats.last_updated
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className='text-center'>
                          <div className='text-sm text-gray-500'>
                            No stats available
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar (if stats available) */}
                  {campaign.campaign_stats && (
                    <div className='mt-4 pt-4 border-t border-gray-100'>
                      <div className='flex justify-between text-xs text-gray-500 mb-1'>
                        <span>Delivery Progress</span>
                        <span>
                          {campaign.campaign_stats.total_delivered || 0} of{' '}
                          {campaign.target_audience_count}
                        </span>
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-2'>
                        <div
                          className='bg-green-500 h-2 rounded-full transition-all duration-300'
                          style={{
                            width: `${Math.min(
                              ((campaign.campaign_stats.total_delivered || 0) /
                                campaign.target_audience_count) *
                                100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
