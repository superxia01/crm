import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { customerService } from '../lib/services/customerService';
import { useToast } from '../contexts';
import { handleApiError } from '../lib/apiClient';

interface BatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerIds: number[];
  onSuccess: () => void;
}

const STAGES = ['Leads', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won'];
const INTENT_LEVELS = ['High', 'Medium', 'Low'];
const SOURCES = ['Website', 'Referral', 'Cold Call', 'Trade Show', 'Social Media', 'Other'];
const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Other'];

export const BatchEditModal: React.FC<BatchEditModalProps> = ({
  isOpen,
  onClose,
  customerIds,
  onSuccess,
}) => {
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state - only include fields we want to batch edit
  const [stage, setStage] = useState('');
  const [intentLevel, setIntentLevel] = useState('');
  const [source, setSource] = useState('');
  const [industry, setIndustry] = useState('');
  const [ownerId, setOwnerId] = useState('');

  const handleSubmit = async () => {
    if (!stage && !intentLevel && !source && !industry && !ownerId) {
      showError('请至少选择一个要修改的字段');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build update object with only non-empty fields
      const updates: any = {};
      if (stage) updates.stage = stage;
      if (intentLevel) updates.intent_level = intentLevel;
      if (source) updates.source = source;
      if (industry) updates.industry = industry;
      if (ownerId) updates.owner_id = parseInt(ownerId);

      // Batch update all selected customers
      await Promise.all(
        customerIds.map(id => customerService.updateCustomer(id, updates))
      );

      showSuccess(`已更新 ${customerIds.length} 个客户`);
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Batch update error:', err);
      showError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setStage('');
      setIntentLevel('');
      setSource('');
      setIndustry('');
      setOwnerId('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            批量编辑 ({customerIds.length} 个客户)
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            只修改选择的字段，未选择的字段将保持不变
          </p>

          {/* Stage */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              阶段
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="">不修改</option>
              {STAGES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Intent Level */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              意向等级
            </label>
            <select
              value={intentLevel}
              onChange={(e) => setIntentLevel(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="">不修改</option>
              {INTENT_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              客户来源
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="">不修改</option>
              {SOURCES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              行业
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="">不修改</option>
              {INDUSTRIES.map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          {/* Owner ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              负责人 ID
            </label>
            <input
              type="number"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              placeholder="输入负责人用户ID"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};
