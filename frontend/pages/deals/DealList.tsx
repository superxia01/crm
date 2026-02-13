import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2, Edit, Trash2, MoreHorizontal, DollarSign } from 'lucide-react';
import { Card, Button, Badge } from '../../components/UI';
import { dealService, Deal } from '../../lib/services/dealService';
import { handleApiError } from '../../lib/apiClient';
import { useLanguage } from '../../contexts';

export const DealList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const customerIdParam = searchParams.get('customer_id');

  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({ page: 1, per_page: 20, total: 0, total_pages: 0 });
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const loadDeals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: any = { page: meta.page, per_page: meta.per_page };
      if (customerIdParam) params.customer_id = parseInt(customerIdParam, 10);
      const res = await dealService.listDeals(params);
      setDeals(res.deals);
      setMeta(res.meta);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, [meta.page, customerIdParam]);

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDeleteDeal'))) return;
    try {
      await dealService.deleteDeal(id);
      loadDeals();
      setOpenMenuId(null);
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const getPaymentStatusColor = (s: string) => {
    switch (s) {
      case 'paid': return 'green';
      case 'partial': return 'blue';
      default: return 'yellow';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {customerIdParam && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">业绩管理</h1>
        </div>
        <Button onClick={() => navigate(customerIdParam ? `/deals/new?customer_id=${customerIdParam}` : '/deals/new')}>
          <Plus size={18} className="mr-2" />
          新增业绩
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {isLoading ? (
        <Card className="p-12 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-gray-50/50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('dealNo')}</th>
                  {!customerIdParam && <th className="px-4 py-3 font-medium">{t('customers')}</th>}
                  <th className="px-4 py-3 font-medium">{t('productService')}</th>
                  <th className="px-4 py-3 font-medium">{t('amount')}</th>
                  <th className="px-4 py-3 font-medium">{t('dealDate')}</th>
                  <th className="px-4 py-3 font-medium">{t('paymentStatus')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {deals.length === 0 ? (
                  <tr>
                    <td colSpan={customerIdParam ? 6 : 7} className="px-4 py-12 text-center text-slate-500">
                      {t('noDealsYet')}
                    </td>
                  </tr>
                ) : (
                  deals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 group">
                      <td className="px-4 py-4 font-mono text-xs text-slate-500">{deal.record_no}</td>
                      {!customerIdParam && (
                        <td className="px-4 py-4">
                          <Link
                            to={`/customers/${deal.customer_id}`}
                            className="text-primary hover:underline"
                          >
                            {deal.customer_name || `客户 #${deal.customer_id}`}
                          </Link>
                        </td>
                      )}
                      <td className="px-4 py-4 text-slate-800 dark:text-slate-200">{deal.product_or_service}</td>
                      <td className="px-4 py-4 font-medium text-slate-800 dark:text-slate-200">
                        {deal.currency} {deal.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400">
                        {deal.deal_at ? new Date(deal.deal_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-4">
                        <Badge color={getPaymentStatusColor(deal.payment_status)}>
                          {deal.payment_status === 'paid' ? t('paymentStatusPaid') : deal.payment_status === 'partial' ? t('paymentStatusPartial') : t('paymentStatusPending')}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right relative">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/deals/${deal.id}/edit`)}
                          >
                            <Edit size={14} className="mr-1" /> {t('actionEdit')}
                          </Button>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === deal.id ? null : deal.id)}
                            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                        {openMenuId === deal.id && (
                          <div className="absolute right-0 top-full mt-1 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                            <button
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                              onClick={() => handleDelete(deal.id)}
                            >
                              <Trash2 size={14} /> {t('actionDelete')}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {meta.total_pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700">
              <span className="text-sm text-slate-500">
                {t('totalItems', { total: meta.total })}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => setMeta(m => ({ ...m, page: m.page - 1 }))}
                >
                  {t('prevPage')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.total_pages}
                  onClick={() => setMeta(m => ({ ...m, page: m.page + 1 }))}
                >
                  {t('nextPage')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
