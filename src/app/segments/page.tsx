'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/navbar';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Trash2,
  Users,
  Eye,
  Save,
  Edit2,
  X,
  Check,
  Send,
} from 'lucide-react';

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

interface Segment {
  segment_id: string;
  name: string;
  description: string;
  rules: RuleGroup[];
  preview_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const FIELD_OPTIONS = [
  { value: 'total_spend', label: 'Total Spend', type: 'number' },
  { value: 'total_visits', label: 'Total Visits', type: 'number' },
  { value: 'total_orders', label: 'Total Orders', type: 'number' },
  {
    value: 'days_since_last_order',
    label: 'Days Since Last Order',
    type: 'number',
  },
  { value: 'status', label: 'Status', type: 'string' },
  { value: 'name', label: 'Customer Name', type: 'string' },
  { value: 'email', label: 'Email', type: 'string' },
];

const OPERATOR_OPTIONS = {
  number: [
    { value: '>', label: 'Greater than' },
    { value: '>=', label: 'Greater than or equal' },
    { value: '<', label: 'Less than' },
    { value: '<=', label: 'Less than or equal' },
    { value: '=', label: 'Equal to' },
    { value: '!=', label: 'Not equal to' },
  ],
  string: [
    { value: '=', label: 'Equal to' },
    { value: '!=', label: 'Not equal to' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
  ],
};

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'PENDING'];

export default function SegmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ruleGroups: [] as RuleGroup[],
  });
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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

  const generateRuleId = () =>
    `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const generateGroupId = () =>
    `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addRuleGroup = () => {
    const newGroup: RuleGroup = {
      id: generateGroupId(),
      operator: 'AND',
      rules: [
        {
          id: generateRuleId(),
          field: 'total_spend',
          operator: '>',
          value: 0,
        },
      ],
    };
    setFormData((prev) => ({
      ...prev,
      ruleGroups: [...prev.ruleGroups, newGroup],
    }));
  };

  const removeRuleGroup = (groupId: string) => {
    setFormData((prev) => ({
      ...prev,
      ruleGroups: prev.ruleGroups.filter((group) => group.id !== groupId),
    }));
  };

  const updateRuleGroup = (groupId: string, operator: 'AND' | 'OR') => {
    setFormData((prev) => ({
      ...prev,
      ruleGroups: prev.ruleGroups.map((group) =>
        group.id === groupId ? { ...group, operator } : group
      ),
    }));
  };

  const addRule = (groupId: string) => {
    const newRule: Rule = {
      id: generateRuleId(),
      field: 'total_spend',
      operator: '>',
      value: 0,
    };
    setFormData((prev) => ({
      ...prev,
      ruleGroups: prev.ruleGroups.map((group) =>
        group.id === groupId
          ? { ...group, rules: [...group.rules, newRule] }
          : group
      ),
    }));
  };

  const removeRule = (groupId: string, ruleId: string) => {
    setFormData((prev) => ({
      ...prev,
      ruleGroups: prev.ruleGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              rules: group.rules.filter((rule) => rule.id !== ruleId),
            }
          : group
      ),
    }));
  };

  const updateRule = (
    groupId: string,
    ruleId: string,
    updates: Partial<Rule>
  ) => {
    setFormData((prev) => ({
      ...prev,
      ruleGroups: prev.ruleGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              rules: group.rules.map((rule) =>
                rule.id === ruleId ? { ...rule, ...updates } : rule
              ),
            }
          : group
      ),
    }));
  };

  const previewAudience = async () => {
    if (formData.ruleGroups.length === 0) {
      setPreviewCount(0);
      return;
    }

    setPreviewLoading(true);
    try {
      const response = await fetch('/api/segments/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: formData.ruleGroups }),
      });
      const result = await response.json();

      if (result.success) {
        setPreviewCount(result.count);
      } else {
        setError(result.error || 'Failed to preview audience');
      }
    } catch (err) {
      setError('Network error occurred during preview');
      console.error('Error previewing audience:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const saveSegment = async () => {
    if (!formData.name.trim()) {
      setError('Segment name is required');
      return;
    }

    if (formData.ruleGroups.length === 0) {
      setError('At least one rule group is required');
      return;
    }

    try {
      const url = editingSegment
        ? `/api/segments/${editingSegment.segment_id}`
        : '/api/segments';
      const method = editingSegment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          rules: formData.ruleGroups,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchSegments();
        resetForm();
      } else {
        setError(result.error || 'Failed to save segment');
      }
    } catch (err) {
      setError('Network error occurred while saving');
      console.error('Error saving segment:', err);
    }
  };

  const deleteSegment = async (segmentId: string) => {
    if (!confirm('Are you sure you want to delete this segment?')) {
      return;
    }

    try {
      const response = await fetch(`/api/segments/${segmentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        await fetchSegments();
      } else {
        setError(result.error || 'Failed to delete segment');
      }
    } catch (err) {
      setError('Network error occurred while deleting');
      console.error('Error deleting segment:', err);
    }
  };

  const editSegment = (segment: Segment) => {
    setEditingSegment(segment);
    setFormData({
      name: segment.name,
      description: segment.description || '',
      ruleGroups: segment.rules,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', ruleGroups: [] });
    setEditingSegment(null);
    setShowForm(false);
    setPreviewCount(null);
    setError(null);
  };

  const getFieldType = (field: string) => {
    const fieldOption = FIELD_OPTIONS.find((f) => f.value === field);
    return fieldOption?.type || 'string';
  };

  const formatRuleText = (rule: Rule) => {
    const field =
      FIELD_OPTIONS.find((f) => f.value === rule.field)?.label || rule.field;
    const operator =
      [...OPERATOR_OPTIONS.number, ...OPERATOR_OPTIONS.string].find(
        (o) => o.value === rule.operator
      )?.label || rule.operator;

    let value = rule.value;
    if (rule.field === 'total_spend' && typeof value === 'number') {
      value = `₹${value.toLocaleString('en-IN')}`;
    }

    return `${field} ${operator} ${value}`;
  };

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
              <h1 className='text-3xl font-bold text-white'>
                Audience Segments
              </h1>
              <p className='text-white/80 mt-1'>
                Create and manage customer segments with flexible rules
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className='bg-blue-600 hover:bg-blue-700'
            >
              <Plus className='h-4 w-4 mr-2' />
              New Segment
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <div className='flex items-center'>
                <X className='h-5 w-5 text-red-500 mr-2' />
                <span className='text-red-700'>{error}</span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setError(null)}
                  className='ml-auto'
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            </div>
          )}

          {/* Segment Form */}
          {showForm && (
            <div className='bg-white rounded-xl shadow-lg p-6 border border-gray-100'>
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-xl font-semibold text-gray-900'>
                  {editingSegment ? 'Edit Segment' : 'Create New Segment'}
                </h2>
                <Button
                  variant='ghost'
                  onClick={resetForm}
                  className='text-gray-500 hover:text-gray-700'
                >
                  <X className='h-5 w-5' />
                </Button>
              </div>

              {/* Basic Info */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Segment Name *
                  </label>
                  <input
                    type='text'
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='High Value Customers'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Description
                  </label>
                  <input
                    type='text'
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className='w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    placeholder='Customers with high spending and engagement'
                  />
                </div>
              </div>

              {/* Rule Groups */}
              <div className='space-y-4 mb-6'>
                <div className='flex justify-between items-center'>
                  <h3 className='text-lg font-medium text-gray-900'>Rules</h3>
                  <Button onClick={addRuleGroup} variant='outline' size='sm'>
                    <Plus className='h-4 w-4 mr-2' />
                    Add Rule Group
                  </Button>
                </div>

                {formData.ruleGroups.map((group, groupIndex) => (
                  <div
                    key={group.id}
                    className='border border-gray-200 rounded-lg p-4'
                  >
                    {/* Group Header */}
                    <div className='flex justify-between items-center mb-4'>
                      <div className='flex items-center space-x-4'>
                        <span className='text-sm font-medium text-gray-700'>
                          Rule Group {groupIndex + 1}
                        </span>
                        <select
                          value={group.operator}
                          onChange={(e) =>
                            updateRuleGroup(
                              group.id,
                              e.target.value as 'AND' | 'OR'
                            )
                          }
                          className='px-3 py-1 border border-gray-300 rounded text-sm'
                        >
                          <option value='AND'>AND</option>
                          <option value='OR'>OR</option>
                        </select>
                      </div>
                      <Button
                        onClick={() => removeRuleGroup(group.id)}
                        variant='ghost'
                        size='sm'
                        className='text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>

                    {/* Rules */}
                    <div className='space-y-3'>
                      {group.rules.map((rule, ruleIndex) => (
                        <div
                          key={rule.id}
                          className='flex items-center space-x-3 bg-gray-50 p-3 rounded-lg'
                        >
                          {ruleIndex > 0 && (
                            <span className='text-xs font-medium text-gray-500 px-2 py-1 bg-gray-200 rounded'>
                              {group.operator}
                            </span>
                          )}

                          <select
                            value={rule.field}
                            onChange={(e) =>
                              updateRule(group.id, rule.id, {
                                field: e.target.value,
                              })
                            }
                            className='flex-1 p-2 border border-gray-300 rounded text-sm'
                          >
                            {FIELD_OPTIONS.map((field) => (
                              <option key={field.value} value={field.value}>
                                {field.label}
                              </option>
                            ))}
                          </select>

                          <select
                            value={rule.operator}
                            onChange={(e) =>
                              updateRule(group.id, rule.id, {
                                operator: e.target.value,
                              })
                            }
                            className='flex-1 p-2 border border-gray-300 rounded text-sm'
                          >
                            {OPERATOR_OPTIONS[
                              getFieldType(
                                rule.field
                              ) as keyof typeof OPERATOR_OPTIONS
                            ].map((op) => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))}
                          </select>

                          {rule.field === 'status' ? (
                            <select
                              value={rule.value as string}
                              onChange={(e) =>
                                updateRule(group.id, rule.id, {
                                  value: e.target.value,
                                })
                              }
                              className='flex-1 p-2 border border-gray-300 rounded text-sm'
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={
                                getFieldType(rule.field) === 'number'
                                  ? 'number'
                                  : 'text'
                              }
                              value={rule.value}
                              onChange={(e) => {
                                const value =
                                  getFieldType(rule.field) === 'number'
                                    ? parseFloat(e.target.value) || 0
                                    : e.target.value;
                                updateRule(group.id, rule.id, { value });
                              }}
                              className='flex-1 p-2 border border-gray-300 rounded text-sm'
                              placeholder={
                                getFieldType(rule.field) === 'number'
                                  ? '0'
                                  : 'Enter value'
                              }
                            />
                          )}

                          <Button
                            onClick={() => removeRule(group.id, rule.id)}
                            variant='ghost'
                            size='sm'
                            className='text-red-600 hover:text-red-700'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      ))}

                      <Button
                        onClick={() => addRule(group.id)}
                        variant='outline'
                        size='sm'
                        className='w-full'
                      >
                        <Plus className='h-4 w-4 mr-2' />
                        Add Rule
                      </Button>
                    </div>
                  </div>
                ))}

                {formData.ruleGroups.length === 0 && (
                  <div className='text-center py-8 text-gray-500'>
                    <Users className='h-12 w-12 mx-auto mb-4 text-gray-300' />
                    <p>
                      No rule groups defined. Add a rule group to get started.
                    </p>
                  </div>
                )}
              </div>

              {/* Preview & Actions */}
              <div className='flex justify-between items-center pt-6 border-t border-gray-200'>
                <div className='flex items-center space-x-4'>
                  <Button
                    onClick={previewAudience}
                    variant='outline'
                    disabled={
                      previewLoading || formData.ruleGroups.length === 0
                    }
                  >
                    <Eye className='h-4 w-4 mr-2' />
                    {previewLoading ? 'Loading...' : 'Preview Audience'}
                  </Button>
                  {previewCount !== null && (
                    <div className='flex items-center text-sm text-gray-600'>
                      <Users className='h-4 w-4 mr-1' />
                      <span className='font-medium'>
                        {previewCount.toLocaleString()}
                      </span>{' '}
                      customers match
                    </div>
                  )}
                </div>

                <div className='flex space-x-3'>
                  <Button onClick={resetForm} variant='outline'>
                    Cancel
                  </Button>
                  <Button
                    onClick={saveSegment}
                    className='bg-blue-600 hover:bg-blue-700'
                  >
                    <Save className='h-4 w-4 mr-2' />
                    {editingSegment ? 'Update Segment' : 'Save Segment'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Segments List */}
          <div className='bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100'>
            <div className='px-6 py-4 border-b border-gray-200 bg-gray-50'>
              <div className='flex justify-between items-center'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    Saved Segments
                  </h3>
                  <p className='text-sm text-gray-600 mt-1'>
                    Manage your customer segments
                  </p>
                </div>
                <div className='text-sm text-gray-500'>
                  {segments.length} segments
                </div>
              </div>
            </div>

            {loading ? (
              <div className='p-8 text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                <p className='mt-2 text-gray-600'>Loading segments...</p>
              </div>
            ) : segments.length === 0 ? (
              <div className='p-8 text-center'>
                <Users className='h-12 w-12 mx-auto mb-4 text-gray-300' />
                <p className='text-gray-600'>No segments created yet</p>
                <Button
                  onClick={() => setShowForm(true)}
                  className='mt-4 bg-blue-600 hover:bg-blue-700'
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Create Your First Segment
                </Button>
              </div>
            ) : (
              <div className='divide-y divide-gray-200'>
                {segments.map((segment) => (
                  <div
                    key={segment.segment_id}
                    className='p-6 hover:bg-gray-50 transition-colors'
                  >
                    <div className='flex justify-between items-start'>
                      <div className='flex-1'>
                        <div className='flex items-center space-x-3 mb-2'>
                          <h4 className='text-lg font-semibold text-gray-900'>
                            {segment.name}
                          </h4>
                          <div className='flex items-center text-sm text-gray-600'>
                            <Users className='h-4 w-4 mr-1' />
                            <span className='font-medium'>
                              {segment.preview_count?.toLocaleString() || 0}
                            </span>{' '}
                            customers
                          </div>
                        </div>

                        {segment.description && (
                          <p className='text-gray-600 mb-3'>
                            {segment.description}
                          </p>
                        )}

                        {/* Rule Summary */}
                        <div className='space-y-2'>
                          {segment.rules.map((group, index) => (
                            <div key={group.id} className='text-sm'>
                              {index > 0 && (
                                <span className='text-xs font-medium text-blue-600 px-2 py-1 bg-blue-50 rounded mr-2'>
                                  OR
                                </span>
                              )}
                              <div className='inline-flex flex-wrap gap-1'>
                                {group.rules.map((rule, ruleIndex) => (
                                  <span
                                    key={rule.id}
                                    className='inline-flex items-center'
                                  >
                                    {ruleIndex > 0 && (
                                      <span className='text-xs font-medium text-gray-500 px-1'>
                                        {group.operator}
                                      </span>
                                    )}
                                    <span className='px-2 py-1 bg-gray-100 rounded text-xs font-medium'>
                                      {formatRuleText(rule)}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className='mt-3 text-xs text-gray-500'>
                          Created by {segment.created_by} •{' '}
                          {new Date(segment.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div className='flex space-x-2 ml-6'>
                        <Button
                          onClick={() =>
                            router.push(
                              `/campaigns?segment_id=${segment.segment_id}`
                            )
                          }
                          variant='outline'
                          size='sm'
                          className='text-green-600 hover:text-green-700'
                        >
                          <Send className='h-4 w-4 mr-1' />
                          Launch Campaign
                        </Button>
                        <Button
                          onClick={() => editSegment(segment)}
                          variant='outline'
                          size='sm'
                        >
                          <Edit2 className='h-4 w-4' />
                        </Button>
                        <Button
                          onClick={() => deleteSegment(segment.segment_id)}
                          variant='outline'
                          size='sm'
                          className='text-red-600 hover:text-red-700'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
