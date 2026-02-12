import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Trash2, MoreHorizontal, Search, Loader2, Calendar } from 'lucide-react';
import { customerService, Customer } from '../../lib/services/customerService';
import { Card, Button, Badge } from '../../components/UI';
import { useToast } from '../../contexts';

export const ArchivedCustomers: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [meta, setMeta] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
  });

  const loadArchivedCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await customerService.listArchivedCustomers({
        page: meta.page,
        per_page: meta.per_page,
        search: searchQuery || undefined,
      });
      setCustomers(response.customers);
      setMeta(response.meta);
    } catch (err) {
      console.error('Failed to load archived customers:', err);
      showError('加载归档客户失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArchivedCustomers();
  }, [meta.page]);

  const handleSearch = () => {
    setMeta(prev => ({ ...prev, page: 1 }));
    loadArchivedCustomers();
  };

  const handleRestore = async (id: number, name: string) => {
    if (!confirm(`确定要恢复客户 "${name}" 吗？`)) return;

    try {
      await customerService.restoreCustomer(id);
      showSuccess(`客户 "${name}" 已恢复`);
      loadArchivedCustomers();
    } catch (err) {
      console.error('Failed to restore customer:', err);
      showError('恢复客户失败');
    }
  };

  const handlePermanentDelete = async (id: number, name: string) => {
    if (!confirm(`确定要永久删除客户 "${name}" 吗？此操作不可恢复！`)) return;

    try {
      await customerService.deleteCustomer(id);
      showSuccess(`客户 "${name}" 已永久删除`);
      loadArchivedCustomers();
    } catch (err) {
      console.error('Failed to delete customer:', err);
      showError('删除客户失败');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStageColor = (stage?: string) => {
    switch (stage) {
      case 'Leads': return 'gray';
      case 'Qualified': return 'blue';
      case 'Proposal': return 'purple';
      case 'Negotiation': return 'orange';
      case 'Closed Won': return 'green';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/customers')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">已归档客户</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">共 {meta.total} 个归档客户</p>
        </div>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="搜索归档客户..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
          </div>
          <Button onClick={handleSearch}>搜索</Button>
        </div>
      </Card>

      {/* List */}
      {isLoading ? (
        <Card className="p-12 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </Card>
      ) : customers.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500 dark:text-slate-400">暂无归档客户</p>
          <Button onClick={() => navigate('/customers')} className="mt-4">
            返回客户列表
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => (
            <Card key={customer.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      to={`/customers/${customer.id}`}
                      className="font-semibold text-slate-800 dark:text-slate-100 hover:text-primary"
                    >
                      {customer.name}
                    </Link>
                    {customer.stage && (
                      <Badge color={getStageColor(customer.stage)}>{customer.stage}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <p>{customer.company} {customer.position ? `· ${customer.position}` : ''}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        归档于: {formatDate(customer.updated_at)}
                      </span>
                      {customer.email && <span>{customer.email}</span>}
                      {customer.phone && <span>{customer.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(customer.id, customer.name)}
                    className="text-green-600 border-green-200 hover:bg-green-50 dark:border-green-900/30 dark:hover:bg-green-900/20 dark:text-green-400"
                  >
                    <RotateCcw size={14} className="mr-1" />
                    恢复
                  </Button>
                  <button
                    onClick={() => handlePermanentDelete(customer.id, customer.name)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="永久删除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.total_pages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              共 {meta.total} 条记录
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page === 1}
                onClick={() => setMeta(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                上一页
              </Button>
              <span className="flex items-center text-sm text-slate-600 dark:text-slate-400 px-4">
                第 {meta.page} / {meta.total_pages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.page === meta.total_pages}
                onClick={() => setMeta(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                下一页
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
