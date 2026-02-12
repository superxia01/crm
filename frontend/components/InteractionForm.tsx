import React, { useState } from 'react';
import { X, Save, Phone, Mail, MessageSquare, FileText, Calendar } from 'lucide-react';
import { Card, Button, Input } from '../UI';
import { interactionService, CreateInteractionRequest, Interaction } from '../lib/services/interactionService';
import { useToast } from '../contexts';
import { handleApiError } from '../lib/apiClient';

interface InteractionFormProps {
  customerId: number;
  customerName: string;
  interaction?: Interaction;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const INTERACTION_TYPES = [
  { value: 'call', label: '电话', icon: Phone, color: 'text-blue-500' },
  { value: 'email', label: '邮件', icon: Mail, color: 'text-green-500' },
  { value: 'meeting', label: '会议', icon: MessageSquare, color: 'text-purple-500' },
  { value: 'note', label: '备注', icon: FileText, color: 'text-gray-500' },
];

const OUTCOMES = [
  { value: 'positive', label: '积极', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  { value: 'neutral', label: '中性', color: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20' },
  { value: 'negative', label: '消极', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
];

export const InteractionForm: React.FC<InteractionFormProps> = ({
  customerId,
  customerName,
  interaction,
  onSuccess,
  onCancel,
}) => {
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState(interaction?.type || 'note');
  const [content, setContent] = useState(interaction?.content || '');
  const [outcome, setOutcome] = useState(interaction?.outcome || '');
  const [nextAction, setNextAction] = useState(interaction?.next_action || '');
  const [nextDate, setNextDate] = useState(interaction?.next_date?.split('T')[0] || '');

  const handleSubmit = async () => {
    if (!content.trim()) {
      showError('请填写互动内容');
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateInteractionRequest = {
        customer_id: customerId,
        type,
        content: content.trim(),
        outcome: outcome || undefined,
        next_action: nextAction.trim() || undefined,
        next_date: nextDate ? new Date(nextDate).toISOString() : undefined,
      };

      if (interaction) {
        await interactionService.update(interaction.id, data);
        showSuccess('互动记录更新成功！');
      } else {
        await interactionService.create(data);
        showSuccess('互动记录添加成功！');
      }

      // Reset form
      setContent('');
      setOutcome('');
      setNextAction('');
      setNextDate('');

      onSuccess?.();
    } catch (err) {
      console.error('Failed to save interaction:', err);
      showError(handleApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {interaction ? '编辑' : '添加'}互动记录
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        )}
      </div>

      {/* 互动类型 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          互动类型
        </label>
        <div className="grid grid-cols-4 gap-2">
          {INTERACTION_TYPES.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setType(item.value)}
                className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                  type === item.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                }`}
              >
                <Icon size={20} className={type === item.value ? 'text-primary' : item.color} />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 互动内容 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          互动内容 *
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`记录与 ${customerName} 的沟通内容...`}
          rows={4}
          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
        />
      </div>

      {/* 互动结果 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          互动结果
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOutcome('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !outcome
                ? 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                : 'border-2 border-transparent'
            }`}
          >
            不设置
          </button>
          {OUTCOMES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setOutcome(item.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                outcome === item.value
                  ? item.color
                  : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 下一步行动 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          下一步行动
        </label>
        <input
          type="text"
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          placeholder="例如：下周二再电话跟进"
          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
        />
      </div>

      {/* 下次跟进日期 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          下次跟进日期
        </label>
        <input
          type="date"
          value={nextDate}
          onChange={(e) => setNextDate(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-slate-700">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            取消
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              保存中...
            </>
          ) : (
            <>
              <Save size={18} className="mr-2" />
              {interaction ? '更新' : '保存'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
