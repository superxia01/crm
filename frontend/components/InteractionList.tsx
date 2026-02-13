import React, { useState, useEffect } from 'react';
import { Phone, Mail, MessageSquare, FileText, Calendar, Clock, Edit2, Trash2, Loader2 } from 'lucide-react';
import { interactionService, Interaction } from '../lib/services/interactionService';
import { InteractionForm } from './InteractionForm';
import { useToast } from '../contexts';

interface InteractionListProps {
  customerId: number;
  customerName: string;
  refreshTrigger?: number;
}

const INTERACTION_TYPE_CONFIG = {
  call: { icon: Phone, label: '电话', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  email: { icon: Mail, label: '邮件', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  meeting: { icon: MessageSquare, label: '会议', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  note: { icon: FileText, label: '备注', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
};

const OUTCOME_CONFIG = {
  positive: { label: '积极', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  neutral: { label: '中性', color: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20' },
  negative: { label: '消极', color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
};

export const InteractionList: React.FC<InteractionListProps> = ({
  customerId,
  customerName,
  refreshTrigger,
}) => {
  const { showSuccess, showError } = useToast();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const loadInteractions = async () => {
    try {
      setIsLoading(true);
      const data = await interactionService.getByCustomerId(customerId);
      setInteractions(data);
    } catch (err) {
      console.error('Failed to load interactions:', err);
      showError('加载互动记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInteractions();
  }, [customerId, refreshTrigger]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条互动记录吗？')) return;

    try {
      await interactionService.delete(id);
      showSuccess('互动记录已删除');
      loadInteractions();
    } catch (err) {
      console.error('Failed to delete interaction:', err);
      showError('删除失败');
    }
  };

  const handleEdit = (interaction: Interaction) => {
    setEditingInteraction(interaction);
    setIsFormVisible(true);
  };

  const handleFormSuccess = () => {
    setIsFormVisible(false);
    setEditingInteraction(null);
    loadInteractions();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 表单 */}
      {isFormVisible && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
          <InteractionForm
            customerId={customerId}
            customerName={customerName}
            interaction={editingInteraction || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setIsFormVisible(false);
              setEditingInteraction(null);
            }}
          />
        </div>
      )}

      {/* 添加按钮 */}
      {!isFormVisible && (
        <button
          onClick={() => setIsFormVisible(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:border-primary hover:text-primary transition-colors"
        >
          + 添加互动记录
        </button>
      )}

      {/* 列表 */}
      {interactions.length === 0 && !isLoading && (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
          暂无互动记录
        </div>
      )}

      <div className="space-y-3">
        {interactions.map((interaction) => {
          const typeConfig = INTERACTION_TYPE_CONFIG[interaction.type as keyof typeof INTERACTION_TYPE_CONFIG] || INTERACTION_TYPE_CONFIG.note;
          const TypeIcon = typeConfig.icon;
          const outcomeConfig = interaction.outcome ? OUTCOME_CONFIG[interaction.outcome as keyof typeof OUTCOME_CONFIG] : null;

          return (
            <div
              key={interaction.id}
              className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3">
                {/* 类型图标 */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${typeConfig.color}`}>
                  <TypeIcon size={18} />
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className={`px-2 py-0.5 rounded text-xs font-medium ${typeConfig.color}`}>
                      {typeConfig.label}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(interaction)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                        title="编辑"
                      >
                        <Edit2 size={14} className="text-slate-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(interaction.id)}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="删除"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {interaction.content}
                  </p>

                  {/* 元数据 */}
                  <div className="mt-3 space-y-2">
                    {outcomeConfig && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">结果：</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${outcomeConfig.color}`}>
                          {outcomeConfig.label}
                        </span>
                      </div>
                    )}

                    {interaction.next_action && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-slate-400 shrink-0">下一步：</span>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {interaction.next_action}
                        </span>
                      </div>
                    )}

                    {interaction.next_date && (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {formatDate(interaction.next_date)}
                        </span>
                      </div>
                  )}

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock size={14} />
                      {formatDate(interaction.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
