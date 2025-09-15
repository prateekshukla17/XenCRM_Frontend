'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Users, MessageSquare, Loader2 } from 'lucide-react';

interface Segment {
  segment_id: string;
  name: string;
  description: string;
  preview_count: number;
}

interface Campaign {
  name: string;
  segment_id: string;
  message_template: string;
  campaign_type: string;
}

function CampaignsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedSegmentId = searchParams.get('segment_id');

  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Campaign>({
    name: '',
    segment_id: preselectedSegmentId || '',
    message_template: '',
    campaign_type: 'PROMOTIONAL'
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSegments();
    }
  }, [status]);

  useEffect(() => {
    if (preselectedSegmentId && segments.length > 0) {
      const segment = segments.find(s => s.segment_id === preselectedSegmentId);
      if (segment) {
        setSelectedSegment(segment);
        setFormData(prev => ({ ...prev, segment_id: preselectedSegmentId }));
      }
    }
  }, [preselectedSegmentId, segments]);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/segments');
      const result = await response.json();

      if (result.success) {
        setSegments(result.data);
      } else {
        setError(result.error || 'Failed to fetch segments');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching segments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentSelect = (segmentId: string) => {
    const segment = segments.find(s => s.segment_id === segmentId);
    setSelectedSegment(segment || null);
    setFormData(prev => ({ ...prev, segment_id: segmentId }));
  };

  const createCampaign = async () => {
    if (!formData.name.trim()) {
      setError('Campaign name is required');
      return;
    }

    if (!formData.segment_id) {
      setError('Please select a segment');
      return;
    }

    if (!formData.message_template.trim()) {
      setError('Message template is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          created_by: session?.user?.email || 'unknown'
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`Campaign created successfully! ${result.data.total_customers} customers will receive the message.`);
        setFormData({
          name: '',
          segment_id: '',
          message_template: '',
          campaign_type: 'PROMOTIONAL'
        });
        setSelectedSegment(null);
        
        // Redirect after a delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        setError(result.error || 'Failed to create campaign');
      }
    } catch (err) {
      setError('Network error occurred while creating campaign');
      console.error('Error creating campaign:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') return <p>Loading...</p>;
  if (!session) return null;

  return (
    <>
      <Navbar />
      <div className='min-h-screen bg-gradient-background'>
        <div className='p-6 space-y-6'>
          {/* Header */}
          <div className='flex items-center space-x-4'>
            <Button
              onClick={() => router.back()}
              variant='outline'
              className='bg-white/10 border-white/20 text-white hover:bg-white/20'
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back
            </Button>
            <div>
              <h1 className='text-3xl font-bold text-white'>Create Campaign</h1>
              <p className='text-white/80 mt-1'>
                Launch targeted campaigns to your customer segments
              </p>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
              <div className='flex items-center'>
                <div className='h-5 w-5 text-green-500 mr-2'>
                  <svg fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                  </svg>
                </div>
                <span className='text-green-700'>{success}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <div className='flex items-center'>
                <div className='h-5 w-5 text-red-500 mr-2'>
                  <svg fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                  </svg>
                </div>
                <span className='text-red-700'>{error}</span>
              </div>
            </div>
          )}

          {/* Campaign Form */}
          <div className='bg-white rounded-xl shadow-lg p-6 border border-gray-100'>
            <h2 className='text-xl font-semibold text-gray-900 mb-6'>Campaign Details</h2>
            
            <div className='space-y-6'>
              {/* Campaign Name */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Campaign Name *
                </label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Black Friday Sale Campaign'
                  disabled={submitting}
                />
              </div>

              {/* Campaign Type */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Campaign Type
                </label>
                <select
                  value={formData.campaign_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, campaign_type: e.target.value }))}
                  className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  disabled={submitting}
                >
                  <option value='PROMOTIONAL'>Promotional</option>
                  <option value='TRANSACTIONAL'>Transactional</option>
                  <option value='NEWSLETTER'>Newsletter</option>
                  <option value='REMINDER'>Reminder</option>
                </select>
              </div>

              {/* Segment Selection */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Target Segment *
                </label>
                {loading ? (
                  <div className='p-3 border border-gray-300 rounded-lg bg-gray-50'>
                    Loading segments...
                  </div>
                ) : (
                  <select
                    value={formData.segment_id}
                    onChange={(e) => handleSegmentSelect(e.target.value)}
                    className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    disabled={submitting}
                  >
                    <option value=''>Select a segment</option>
                    {segments.map(segment => (
                      <option key={segment.segment_id} value={segment.segment_id}>
                        {segment.name} ({segment.preview_count?.toLocaleString() || 0} customers)
                      </option>
                    ))}
                  </select>
                )}
                
                {selectedSegment && (
                  <div className='mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <Users className='h-4 w-4 text-blue-600' />
                      <span className='text-sm font-medium text-blue-900'>
                        Selected: {selectedSegment.name}
                      </span>
                    </div>
                    {selectedSegment.description && (
                      <p className='text-sm text-blue-700 mb-2'>{selectedSegment.description}</p>
                    )}
                    <div className='text-sm text-blue-600'>
                      <strong>{selectedSegment.preview_count?.toLocaleString() || 0}</strong> customers will receive this campaign
                    </div>
                  </div>
                )}
              </div>

              {/* Message Template */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Message Template *
                </label>
                <div className='relative'>
                  <textarea
                    value={formData.message_template}
                    onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
                    rows={6}
                    className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='Hi {{name}}, we have an exclusive offer just for you! Get 20% off on your next purchase. Use code: SAVE20'
                    disabled={submitting}
                  />
                  <div className='absolute bottom-3 right-3 text-xs text-gray-500'>
                    {formData.message_template.length} characters
                  </div>
                </div>
                <p className='text-sm text-gray-500 mt-1'>
                  You can use placeholders like {'{{name}}'} and {'{{email}}'} which will be replaced with customer data.
                </p>
              </div>

              {/* Message Preview */}
              {formData.message_template && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Message Preview
                  </label>
                  <div className='p-4 bg-gray-50 rounded-lg border border-gray-200'>
                    <div className='flex items-center space-x-2 mb-2'>
                      <MessageSquare className='h-4 w-4 text-gray-500' />
                      <span className='text-sm font-medium text-gray-700'>Preview</span>
                    </div>
                    <div className='text-sm text-gray-800'>
                      {formData.message_template
                        .replace(/\{\{name\}\}/g, 'John Doe')
                        .replace(/\{\{email\}\}/g, 'john@example.com')
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className='flex justify-between items-center pt-6 mt-6 border-t border-gray-200'>
              <Button
                onClick={() => router.back()}
                variant='outline'
                disabled={submitting}
              >
                Cancel
              </Button>
              
              <Button
                onClick={createCampaign}
                disabled={submitting || !formData.name || !formData.segment_id || !formData.message_template}
                className='bg-blue-600 hover:bg-blue-700'
              >
                {submitting ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Creating Campaign...
                  </>
                ) : (
                  <>
                    <Send className='h-4 w-4 mr-2' />
                    Launch Campaign
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CampaignsContent />
    </Suspense>
  );
}