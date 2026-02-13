import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, Bot, Loader2, Filter, RefreshCw } from 'lucide-react';
import { activityService, Activity } from '../lib/services/activityService';
import { Card } from '../components/UI';
import { useToast, useLanguage } from '../contexts';

export const Activities: React.FC = () => {
  const { showError } = useToast();
  const { t } = useLanguage();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'user' | 'ai'>('all');
  const [meta, setMeta] = useState({
    page: 1,
    per_page: 50,
    total: 0,
    total_pages: 0,
  });

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const response = await activityService.getActivities(meta.page, meta.per_page);
      setActivities(response.activities);
      setMeta({
        page: response.page,
        per_page: response.per_page,
        total: response.total,
        total_pages: response.total_pages,
      });
    } catch (err) {
      console.error('Failed to load activities:', err);
      showError('加载活动记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [meta.page]);

  const filteredActivities = activities.filter(a => {
    if (filter === 'all') return true;
    return a.type === filter;
  });

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;

    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (type: 'user' | 'ai') => {
    return type === 'ai' ? Bot : User;
  };

  const getActionColor = (type: 'user' | 'ai') => {
    return type === 'ai'
      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
      : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('activities')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('activitiesSubtitle')}</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {t('filterAll')}
              </button>
              <button
                onClick={() => setFilter('user')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {t('userActions')}
              </button>
              <button
                onClick={() => setFilter('ai')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'ai'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {t('aiEvents')}
              </button>
            </div>
          </div>
          <button
            onClick={loadActivities}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            {t('refresh')}
          </button>
        </div>
      </Card>

      {/* Activity List */}
      {isLoading ? (
        <Card className="p-12 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </Card>
      ) : filteredActivities.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            {filter === 'all' ? t('noActivitiesYet') : filter === 'user' ? t('noUserActivities') : t('noAiActivities')}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => {
            const ActionIcon = getActionIcon(activity.type);
            return (
              <Card key={activity.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getActionColor(activity.type)}`}>
                    <ActionIcon size={18} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {activity.user}
                        </span>
                        {activity.customer_name && (
                          <>
                            <span className="text-slate-400">•</span>
                            <Link
                              to={`/customers/${activity.customer_id}`}
                              className="text-primary hover:underline text-sm"
                            >
                              {activity.customer_name}
                            </Link>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 shrink-0">
                        <Clock size={12} />
                        {formatTime(activity.time)}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {activity.text}
                    </p>
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(activity.metadata).slice(0, 3).map(([key, value]) => (
                          <span
                            key={key}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded"
                          >
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.total_pages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              {t('totalRecords', { total: meta.total })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMeta(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={meta.page === 1 || isLoading}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              >
                {t('prevPage')}
              </button>
              <span className="flex items-center text-sm text-slate-600 dark:text-slate-400 px-4">
                {t('pageXofY', { page: meta.page, total: meta.total_pages })}
              </span>
              <button
                onClick={() => setMeta(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={meta.page === meta.total_pages || isLoading}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              >
                {t('nextPage')}
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
