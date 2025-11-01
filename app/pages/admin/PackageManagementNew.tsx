/**
 * Admin Package Management - Real-time sync with user packages
 * Changes here immediately reflect in user's package page
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  DollarSign,
  Clock,
  Award,
} from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui/DesignSystem';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../services/supabase.client';

// Package interface
interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  min_investment: number;
  max_investment: number;
  daily_return_percentage: number;
  max_return_percentage: number;
  duration_days: number;
  level_depth: number;
  binary_bonus_percentage: number;
  features: string[];
  status: 'active' | 'inactive';
  is_popular: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Form schema
const packageSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(100, 'Minimum price is $100'),
  min_investment: z.number().min(100, 'Minimum investment is $100'),
  max_investment: z.number().min(100, 'Maximum investment is $100'),
  daily_return_percentage: z.number().min(0.1).max(100, 'Must be between 0.1% and 100%'),
  max_return_percentage: z.number().min(0.1),
  duration_days: z.number().min(1, 'Minimum 1 day'),
  level_depth: z.number().min(1).max(30, 'Level depth must be 1-30'),
  binary_bonus_percentage: z.number().min(0).max(100, 'Must be between 0% and 100%'),
  features: z.string(),
  is_popular: z.boolean(),
});

type PackageFormData = z.infer<typeof packageSchema>;

export const PackageManagementNew: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      is_popular: false,
    },
  });

  // Watch for validation
  const watchMinInvestment = watch('min_investment');
  const watchMaxInvestment = watch('max_investment');

  // Load packages
  useEffect(() => {
    loadPackages();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('admin-packages-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'packages',
        },
        (payload) => {
          console.log('Package change detected:', payload);
          loadPackages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setPackages(data || []);
    } catch (error: any) {
      console.error('Failed to load packages:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPackage(null);
    reset({
      name: '',
      description: '',
      price: 1000,
      min_investment: 1000,
      max_investment: 5000,
      daily_return_percentage: 5.0,
      max_return_percentage: 600,
      duration_days: 365,
      level_depth: 10,
      binary_bonus_percentage: 10,
      features: '',
      is_popular: false,
    });
    setShowModal(true);
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    reset({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      min_investment: pkg.min_investment,
      max_investment: pkg.max_investment,
      daily_return_percentage: pkg.daily_return_percentage,
      max_return_percentage: pkg.max_return_percentage,
      duration_days: pkg.duration_days,
      level_depth: pkg.level_depth,
      binary_bonus_percentage: pkg.binary_bonus_percentage,
      features: pkg.features?.join('\n') || '',
      is_popular: pkg.is_popular,
    });
    setShowModal(true);
  };

  const onSubmit = async (data: PackageFormData) => {
    setIsSubmitting(true);

    try {
      // Parse features (one per line)
      const features = data.features
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const packageData = {
        name: data.name,
        description: data.description,
        price: data.price,
        min_investment: data.min_investment,
        max_investment: data.max_investment,
        daily_return_percentage: data.daily_return_percentage,
        max_return_percentage: data.max_return_percentage,
        duration_days: data.duration_days,
        level_depth: data.level_depth,
        binary_bonus_percentage: data.binary_bonus_percentage,
        features,
        is_popular: data.is_popular,
        status: 'active' as const,
        updated_at: new Date().toISOString(),
      };

      if (editingPackage) {
        // Update existing package
        const { error } = await supabase
          .from('packages')
          .update(packageData)
          .eq('id', editingPackage.id);

        if (error) throw error;

        toast.success('Package updated successfully! Changes are now live for users.');
      } else {
        // Create new package
        const { error } = await supabase.from('packages').insert({
          ...packageData,
          sort_order: packages.length,
        });

        if (error) throw error;

        toast.success('Package created successfully! Now visible to users.');
      }

      setShowModal(false);
      reset();
      await loadPackages();
    } catch (error: any) {
      console.error('Failed to save package:', error);
      toast.error(error.message || 'Failed to save package');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (pkg: Package) => {
    try {
      const newStatus = pkg.status === 'active' ? 'inactive' : 'active';

      const { error } = await supabase
        .from('packages')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pkg.id);

      if (error) throw error;

      toast.success(
        `Package ${newStatus === 'active' ? 'activated' : 'deactivated'}! ${
          newStatus === 'active' ? 'Now visible' : 'Hidden'
        } for users.`
      );

      await loadPackages();
    } catch (error: any) {
      console.error('Failed to toggle status:', error);
      toast.error('Failed to toggle status');
    }
  };

  const handleDelete = async (pkg: Package) => {
    if (!confirm(`Are you sure you want to delete "${pkg.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase.from('packages').delete().eq('id', pkg.id);

      if (error) throw error;

      toast.success('Package deleted successfully!');
      await loadPackages();
    } catch (error: any) {
      console.error('Failed to delete package:', error);
      toast.error(error.message || 'Failed to delete package');
    }
  };

  const handleReorder = async (pkg: Package, direction: 'up' | 'down') => {
    try {
      const currentIndex = packages.findIndex((p) => p.id === pkg.id);
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= packages.length) return;

      const targetPackage = packages[targetIndex];

      // Swap sort_order
      await supabase.from('packages').update({ sort_order: targetPackage.sort_order }).eq('id', pkg.id);

      await supabase.from('packages').update({ sort_order: pkg.sort_order }).eq('id', targetPackage.id);

      toast.success('Package reordered!');
      await loadPackages();
    } catch (error: any) {
      console.error('Failed to reorder:', error);
      toast.error('Failed to reorder package');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00C7D1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#cbd5e1]">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Package Management</h1>
          <p className="text-[#cbd5e1]">
            Manage investment packages. Changes sync instantly to user's package page.
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Package
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#94a3b8] text-sm">Total Packages</span>
              <DollarSign className="w-5 h-5 text-[#00C7D1]" />
            </div>
            <p className="text-3xl font-bold text-[#f8fafc]">{packages.length}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#94a3b8] text-sm">Active</span>
              <Eye className="w-5 h-5 text-[#10b981]" />
            </div>
            <p className="text-3xl font-bold text-[#10b981]">
              {packages.filter((p) => p.status === 'active').length}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#94a3b8] text-sm">Inactive</span>
              <EyeOff className="w-5 h-5 text-[#64748b]" />
            </div>
            <p className="text-3xl font-bold text-[#64748b]">
              {packages.filter((p) => p.status === 'inactive').length}
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#94a3b8] text-sm">Popular</span>
              <Award className="w-5 h-5 text-[#f59e0b]" />
            </div>
            <p className="text-3xl font-bold text-[#f59e0b]">
              {packages.filter((p) => p.is_popular).length}
            </p>
          </div>
        </Card>
      </div>

      {/* Package List */}
      {packages.length === 0 ? (
        <Card className="text-center py-16">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-2xl font-bold text-[#f8fafc] mb-2">No Packages Yet</h3>
          <p className="text-[#cbd5e1] mb-6">Create your first investment package to get started</p>
          <Button onClick={handleCreate}>Create Package</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {packages.map((pkg, index) => (
            <Card key={pkg.id} className={pkg.status === 'inactive' ? 'opacity-60' : ''}>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  {/* Package Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-[#f8fafc]">{pkg.name}</h3>
                      <Badge variant={pkg.status === 'active' ? 'success' : 'default'}>
                        {pkg.status}
                      </Badge>
                      {pkg.is_popular && (
                        <Badge variant="warning" className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-[#cbd5e1] mb-4">{pkg.description}</p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-[#1e293b] p-3 rounded-lg">
                        <p className="text-[#94a3b8] text-xs mb-1">Price Range</p>
                        <p className="text-[#00C7D1] font-bold">
                          ${pkg.min_investment.toLocaleString()} - ${pkg.max_investment.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-[#1e293b] p-3 rounded-lg">
                        <p className="text-[#94a3b8] text-xs mb-1">Daily ROI</p>
                        <p className="text-[#10b981] font-bold">{pkg.daily_return_percentage}%</p>
                      </div>
                      <div className="bg-[#1e293b] p-3 rounded-lg">
                        <p className="text-[#94a3b8] text-xs mb-1">Duration</p>
                        <p className="text-[#f8fafc] font-bold">{pkg.duration_days} days</p>
                      </div>
                      <div className="bg-[#1e293b] p-3 rounded-lg">
                        <p className="text-[#94a3b8] text-xs mb-1">Levels</p>
                        <p className="text-[#f8fafc] font-bold">{pkg.level_depth}</p>
                      </div>
                      <div className="bg-[#1e293b] p-3 rounded-lg">
                        <p className="text-[#94a3b8] text-xs mb-1">Binary</p>
                        <p className="text-[#f8fafc] font-bold">{pkg.binary_bonus_percentage}%</p>
                      </div>
                    </div>

                    {/* Features */}
                    {pkg.features && pkg.features.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {pkg.features.map((feature, idx) => (
                          <Badge key={idx} variant="default" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-6">
                    {/* Reorder buttons */}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleReorder(pkg, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleReorder(pkg, 'down')}
                        disabled={index === packages.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    </div>

                    <Button size="sm" variant="secondary" onClick={() => handleEdit(pkg)}>
                      <Edit className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant={pkg.status === 'active' ? 'warning' : 'success'}
                      onClick={() => handleToggleStatus(pkg)}
                    >
                      {pkg.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>

                    <Button size="sm" variant="danger" onClick={() => handleDelete(pkg)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPackage ? 'Edit Package' : 'Create Package'}
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[#f8fafc] mb-2 font-semibold">
                Package Name <span className="text-[#ef4444]">*</span>
              </label>
              <input
                {...register('name')}
                className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc]"
                placeholder="e.g., Starter Package"
              />
              {errors.name && <p className="text-[#ef4444] text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-[#f8fafc] mb-2 font-semibold flex items-center gap-2">
                <Award className="w-4 h-4" />
                Mark as Popular
              </label>
              <label className="flex items-center gap-3 p-4 bg-[#1e293b] rounded-lg cursor-pointer">
                <input type="checkbox" {...register('is_popular')} className="w-5 h-5" />
                <span className="text-[#cbd5e1]">Show "Most Popular" badge</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[#f8fafc] mb-2 font-semibold">
              Description <span className="text-[#ef4444]">*</span>
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc]"
              placeholder="Describe the package benefits..."
            />
            {errors.description && <p className="text-[#ef4444] text-sm mt-1">{errors.description.message}</p>}
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[#f8fafc] mb-2 font-semibold">
                Base Price <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="number"
                {...register('price', { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc]"
                placeholder="1000"
              />
              {errors.price && <p className="text-[#ef4444] text-sm mt-1">{errors.price.message}</p>}
            </div>

            <div>
              <label className="block text-[#f8fafc] mb-2 font-semibold">
                Min Investment <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="number"
                {...register('min_investment', { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc]"
                placeholder="1000"
              />
              {errors.min_investment && (
                <p className="text-[#ef4444] text-sm mt-1">{errors.min_investment.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[#f8fafc] mb-2 font-semibold">
                Max Investment <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="number"
                {...register('max_investment', { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc]"
                placeholder="5000"
              />
              {errors.max_investment && (
                <p className="text-[#ef4444] text-sm mt-1">{errors.max_investment.message}</p>
              )}
              {watchMinInvestment && watchMaxInvestment && watchMaxInvestment < watchMinInvestment && (
                <p className="text-[#ef4444] text-sm mt-1">Max must be greater than min</p>
              )}
            </div>
          </div>

          {/* Returns & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-[#f8fafc] mb-2 font-semibold">
                Daily ROI % <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                {...register('daily_return_percentage', { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc]"
                placeholder="5.0"
              />
              {errors.daily_return_percentage && (
                <p className="text-[#ef4444] text-sm mt-1">{errors.daily_return_percentage.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[#f8fafc] mb-2 font-semibold">
                Max Return % <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                {...register('max_return_percentage', { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc]"
                placeholder="600"
              />
              {errors.max_return_percentage && (
                <p className="text-[#ef4444] text-sm mt-1">{errors.max_return_percentage.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[#f8fafc] mb-2 font-semibold">
                Duration (Days) <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="number"
                {...register('duration_days', { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc]"
                placeholder="365"
              />
              {errors.duration_days && <p className="text-[#ef4444] text-sm mt-1">{errors.duration_days.message}</p>}
            </div>

            <div>
              <label className="block text-[#f8fafc] mb-2 font-semibold">
                Level Depth <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="number"
                {...register('level_depth', { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc]"
                placeholder="10"
              />
              {errors.level_depth && <p className="text-[#ef4444] text-sm mt-1">{errors.level_depth.message}</p>}
            </div>
          </div>

          {/* Binary Bonus */}
          <div>
            <label className="block text-[#f8fafc] mb-2 font-semibold">
              Binary Bonus % <span className="text-[#ef4444]">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              {...register('binary_bonus_percentage', { valueAsNumber: true })}
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc]"
              placeholder="10"
            />
            {errors.binary_bonus_percentage && (
              <p className="text-[#ef4444] text-sm mt-1">{errors.binary_bonus_percentage.message}</p>
            )}
          </div>

          {/* Features */}
          <div>
            <label className="block text-[#f8fafc] mb-2 font-semibold">Features (one per line)</label>
            <textarea
              {...register('features')}
              rows={5}
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] font-mono text-sm"
              placeholder={`Daily ROI payments\nLevel income distribution\nBinary matching bonus\nRank achievement rewards`}
            />
            <p className="text-[#94a3b8] text-xs mt-1">Enter one feature per line. These will appear as bullet points.</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-[#475569]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowModal(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 bg-gradient-to-r from-[#00C7D1] to-[#00e5f0]"
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving...' : editingPackage ? 'Update Package' : 'Create Package'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PackageManagementNew;
