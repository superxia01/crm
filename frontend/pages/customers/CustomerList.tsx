import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, MoreHorizontal, Filter, MessageSquarePlus, Sparkles, Edit, Trash2, Archive, LayoutGrid, List, Loader2, Download, FileUp, CheckSquare, Square, X, BoxArchive } from 'lucide-react';
import { customerService, Customer } from '../../lib/services/customerService';
import { Card, Button, Badge } from '../../components/UI';
import { useLanguage } from '../../contexts';
import { FollowUpModal } from '../../components/FollowUpModal';
import { BatchImportModal } from '../../components/BatchImportModal';
import { BatchEditModal } from '../../components/BatchEditModal';
import { importExportService } from '../../lib/services/importExportService';
import { handleApiError } from '../../lib/apiClient';
import { useToast } from '../../contexts';

export const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showSuccess, showError } = useToast();

  // Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0,
  });

  // View State
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [groupBy, setGroupBy] = useState<'stage' | 'source' | 'industry' | 'intent_level'>('stage');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    stage: '',
    intent_level: '',
    source: '',
    industry: '',
  });

  // Follow Up Modal State
  const [selectedCustomerForFollowUp, setSelectedCustomerForFollowUp] = useState<{id: number, name: string} | null>(null);

  // Import/Export State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Batch Selection State
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<number>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isBatchEditModalOpen, setIsBatchEditModalOpen] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Actions Menu State
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Drag and Drop State
  const [draggedCustomerId, setDraggedCustomerId] = useState<number | null>(null);
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  // Load customers
  useEffect(() => {
    loadCustomers();
  }, [meta.page, filters]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {
        page: meta.page,
        per_page: meta.per_page,
      };

      if (searchQuery) params.search = searchQuery;
      if (filters.stage) params.stage = filters.stage;
      if (filters.intent_level) params.intent_level = filters.intent_level;
      if (filters.source) params.source = filters.source;
      if (filters.industry) params.industry = filters.industry;

      const response = await customerService.listCustomers(params);
      setCustomers(response.customers);
      setMeta(response.meta);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setMeta(prev => ({ ...prev, page: 1 }));
    loadCustomers();
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!confirm('确定要删除此客户吗？')) return;

    try {
      await customerService.deleteCustomer(id);
      loadCustomers();
      setOpenActionMenuId(null);
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const handleArchiveCustomer = async (id: number) => {
    if (!confirm('确定要归档此客户吗？归档后可在已归档列表中查看。')) return;

    try {
      await customerService.archiveCustomer(id);
      showSuccess('客户已归档');
      loadCustomers();
      setOpenActionMenuId(null);
    } catch (err) {
      showError(handleApiError(err));
    }
  };

  const toggleActionMenu = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (openActionMenuId === id) {
      setOpenActionMenuId(null);
    } else {
      setOpenActionMenuId(id);
    }
  };

  const handleExport = async (format: 'xlsx' | 'csv') => {
    setIsExporting(true);
    try {
      await importExportService.exportCustomers(format);
      showSuccess(`导出成功（${format.toUpperCase()}）`);
    } catch (error: any) {
      console.error('Export error:', error);
      showError(error.message || '导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  // Batch Selection Functions
  const handleSelectCustomer = (id: number) => {
    const newSelection = new Set(selectedCustomerIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedCustomerIds(newSelection);
    setIsAllSelected(newSelection.size === customers.length && customers.length > 0);
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCustomerIds(new Set());
      setIsAllSelected(false);
    } else {
      setSelectedCustomerIds(new Set(customers.map(c => c.id)));
      setIsAllSelected(true);
    }
  };

  const handleClearSelection = () => {
    setSelectedCustomerIds(new Set());
    setIsAllSelected(false);
  };

  const handleBatchDelete = async () => {
    if (selectedCustomerIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedCustomerIds.size} 个客户吗？`)) return;

    setIsBatchProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedCustomerIds).map(id => customerService.deleteCustomer(id))
      );
      showSuccess(`已删除 ${selectedCustomerIds.size} 个客户`);
      handleClearSelection();
      loadCustomers();
    } catch (err) {
      console.error('Batch delete error:', err);
      showError(handleApiError(err));
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchArchive = async () => {
    if (selectedCustomerIds.size === 0) return;
    if (!confirm(`确定要归档选中的 ${selectedCustomerIds.size} 个客户吗？`)) return;

    setIsBatchProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedCustomerIds).map(id => customerService.archiveCustomer(id))
      );
      showSuccess(`已归档 ${selectedCustomerIds.size} 个客户`);
      handleClearSelection();
      loadCustomers();
    } catch (err) {
      console.error('Batch archive error:', err);
      showError(handleApiError(err));
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchExport = async () => {
    if (selectedCustomerIds.size === 0) return;

    setIsBatchProcessing(true);
    try {
      await importExportService.exportCustomers('xlsx', Array.from(selectedCustomerIds));
      showSuccess(`已导出 ${selectedCustomerIds.size} 个客户`);
    } catch (error: any) {
      console.error('Batch export error:', error);
      showError(error.message || '导出失败');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (customerId: number) => {
    setDraggedCustomerId(customerId);
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDraggedOverStage(stage);
  };

  const handleDragLeave = () => {
    setDraggedOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    setDraggedOverStage(null);

    if (!draggedCustomerId) return;

    const customer = customers.find(c => c.id === draggedCustomerId);
    if (!customer || customer.stage === newStage) {
      setDraggedCustomerId(null);
      return;
    }

    setIsUpdatingStage(true);
    try {
      await customerService.updateCustomer(draggedCustomerId, { stage: newStage });
      showSuccess(`客户 "${customer.name}" 已移动到 "${newStage}"`);
      loadCustomers();
    } catch (err) {
      console.error('Failed to update stage:', err);
      showError('更新阶段失败');
    } finally {
      setIsUpdatingStage(false);
      setDraggedCustomerId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedCustomerId(null);
    setDraggedOverStage(null);
  };

  const getIntentColor = (level: string) => {
    switch (level) {
      case 'High': return 'green';
      case 'Medium': return 'blue';
      case 'Low': return 'yellow';
      default: return 'blue';
    }
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

  const getContractStatusColor = (status?: string) => {
    switch (status) {
      case 'Signed': return 'green';
      case 'Pending': return 'yellow';
      case 'Expired': return 'red';
      case 'Cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getProbabilityColor = (probability?: number) => {
    if (!probability) return 'gray';
    if (probability >= 80) return 'green';
    if (probability >= 50) return 'blue';
    return 'red';
  };

  // Group Data for Kanban
  const groupedCustomers = useMemo(() => {
    const groups: Record<string, Customer[]> = {};

    // Define group order based on groupBy
    let orderedKeys: string[] = [];
    if (groupBy === 'stage') {
      orderedKeys = ['Leads', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won'];
    } else if (groupBy === 'intent_level') {
      orderedKeys = ['High', 'Medium', 'Low'];
    }

    // Initialize groups
    if (orderedKeys.length > 0) {
      orderedKeys.forEach(key => groups[key] = []);
    }

    // Distribute customers
    customers.forEach(customer => {
      const key = customer[groupBy] || 'Uncategorized';
      if (!groups[key]) groups[key] = [];
      groups[key].push(customer);
    });

    // If no preset order (like industry or source), sort keys alphabetically
    if (orderedKeys.length === 0) {
       return Object.keys(groups).sort().reduce((acc, key) => {
         acc[key] = groups[key];
         return acc;
       }, {} as Record<string, Customer[]>);
    }

    return groups;
  }, [groupBy, customers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('customersTitle')}</h1>
            <Link
              to="/customers/archived"
              className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary flex items-center gap-1"
            >
              <BoxArchive size={16} />
              查看归档
            </Link>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('customersSubtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
           {/* View Switcher */}
           <div className="flex bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-1">
             <button
               onClick={() => setViewMode('table')}
               className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
               title={t('viewTable')}
             >
               <List size={18} />
             </button>
             <button
               onClick={() => setViewMode('kanban')}
               className={`p-1.5 rounded transition-colors ${viewMode === 'kanban' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
               title={t('viewKanban')}
             >
               <LayoutGrid size={18} />
             </button>
           </div>

           {/* Import/Export Buttons */}
           <div className="flex items-center gap-2">
             <Button
               variant="outline"
               onClick={() => setIsImportModalOpen(true)}
               className="hidden sm:flex"
             >
               <FileUp size={16} className="mr-2" />
               导入
             </Button>
             <Button
               variant="outline"
               onClick={() => handleExport('xlsx')}
               disabled={isExporting}
               className="hidden sm:flex"
             >
               <Download size={16} className="mr-2" />
               {isExporting ? '导出中...' : '导出'}
             </Button>
           </div>

           <Button onClick={() => navigate('/customers/new')}>
            <Plus size={18} className="mr-2" />
            <span className="hidden sm:inline">{t('addCustomer')}</span>
          </Button>
        </div>
      </div>

      <div className="bg-transparent space-y-4">
        {/* Batch Actions Bar */}
        {selectedCustomerIds.size > 0 && (
          <Card className="bg-primary/5 border-primary/20">
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  已选择 {selectedCustomerIds.size} 项
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBatchEditModalOpen(true)}
                  disabled={isBatchProcessing}
                  className="text-sm"
                >
                  <Edit size={14} className="mr-1" />
                  批量编辑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchArchive}
                  disabled={isBatchProcessing}
                  className="text-sm"
                >
                  <Archive size={14} className="mr-1" />
                  归档
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchExport}
                  disabled={isBatchProcessing}
                  className="text-sm"
                >
                  <Download size={14} className="mr-1" />
                  导出
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchDelete}
                  disabled={isBatchProcessing}
                  className="text-sm text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 dark:text-red-400"
                >
                  <Trash2 size={14} className="mr-1" />
                  删除
                </Button>
                <button
                  onClick={handleClearSelection}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
                  title="取消选择"
                >
                  <X size={16} className="text-slate-500" />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Toolbar */}
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-lg">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                 <Sparkles size={16} />
              </div>
              <input
                type="text"
                placeholder={t('semanticSearchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-9 pr-4 py-2 bg-blue-50/50 dark:bg-slate-900 border border-blue-100 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            <div className="flex gap-2 items-center">
              {viewMode === 'kanban' && (
                <div className="flex items-center gap-2 mr-2">
                   <span className="text-sm text-slate-500 dark:text-slate-400">{t('groupBy')}:</span>
                   <select
                     value={groupBy}
                     onChange={(e) => setGroupBy(e.target.value as any)}
                     className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-primary text-slate-700 dark:text-slate-200"
                   >
                     <option value="stage">{t('groupStage')}</option>
                     <option value="source">{t('groupSource')}</option>
                     <option value="industry">{t('groupIndustry')}</option>
                     <option value="intent_level">{t('groupIntent')}</option>
                   </select>
                </div>
              )}
              <Button variant="outline" className="hidden sm:flex">
                <Filter size={16} className="mr-2" /> {t('filter')}
              </Button>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <Card className="p-12 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
          </Card>
        ) : error ? (
          <Card className="p-12 text-center">
            <p className="text-red-500">{error}</p>
            <Button onClick={loadCustomers} className="mt-4">重试</Button>
          </Card>
        ) : viewMode === 'table' ? (
          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-gray-50/50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 font-medium w-10">
                      <button
                        onClick={handleSelectAll}
                        className="hover:bg-gray-200 dark:hover:bg-slate-700 rounded p-1 transition-colors"
                        title={isAllSelected ? "取消全选" : "全选"}
                      >
                        {isAllSelected ? (
                          <CheckSquare size={16} className="text-primary" />
                        ) : (
                          <Square size={16} className="text-slate-400" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium">{t('colName')}</th>
                    <th className="px-4 py-3 font-medium">{t('colCompany')}</th>
                    <th className="px-4 py-3 font-medium">{t('colStage')}</th>
                    <th className="px-4 py-3 font-medium">{t('colIntent')}</th>
                    <th className="px-4 py-3 font-medium">{t('colContractValue')}</th>
                    <th className="px-4 py-3 font-medium">{t('colProbability')}</th>
                    <th className="px-4 py-3 font-medium">{t('colExpectedClose')}</th>
                    <th className="px-4 py-3 font-medium">{t('colContractStatus')}</th>
                    <th className="px-4 py-3 font-medium text-right">{t('colAction')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className={`hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group ${
                        selectedCustomerIds.has(customer.id) ? 'bg-primary/5 dark:bg-primary/10' : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleSelectCustomer(customer.id)}
                          className="hover:bg-gray-200 dark:hover:bg-slate-700 rounded p-1 transition-colors"
                          title="选择"
                        >
                          {selectedCustomerIds.has(customer.id) ? (
                            <CheckSquare size={16} className="text-primary" />
                          ) : (
                            <Square size={16} className="text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <Link to={`/customers/${customer.id}`} className="font-medium text-slate-900 dark:text-slate-100 hover:text-primary">
                          {customer.name}
                        </Link>
                        <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{customer.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-slate-800 dark:text-slate-200">{customer.company}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{customer.position}</div>
                      </td>
                      <td className="px-4 py-4">
                        {customer.stage && (
                          <Badge color={getStageColor(customer.stage)}>{customer.stage}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Badge color={getIntentColor(customer.intent_level)}>{customer.intent_level}</Badge>
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-300 font-medium">
                        {customer.contract_value || customer.budget}
                      </td>
                      <td className="px-4 py-4">
                        {customer.probability !== undefined && (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${getProbabilityColor(customer.probability) === 'green' ? 'bg-green-500' : getProbabilityColor(customer.probability) === 'blue' ? 'bg-blue-500' : 'bg-red-500'}`}
                                style={{ width: `${customer.probability}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-300">{customer.probability}%</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-500 dark:text-slate-400 text-xs">
                        {customer.expected_close_date || '-'}
                      </td>
                      <td className="px-4 py-4">
                        {customer.contract_status && (
                          <Badge color={getContractStatusColor(customer.contract_status)}>
                            {customer.contract_status === 'Signed' ? '已签约' :
                             customer.contract_status === 'Pending' ? '待签约' :
                             customer.contract_status === 'Expired' ? '已过期' : '已取消'}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right relative">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedCustomerForFollowUp({ id: customer.id, name: customer.name })}
                            className="p-1.5 text-primary bg-primary/10 rounded hover:bg-primary/20 transition-colors"
                            title={t('followUpTitle')}
                          >
                            <MessageSquarePlus size={16} />
                          </button>
                          <div className="relative">
                            <button
                              onClick={(e) => toggleActionMenu(customer.id, e)}
                              className={`p-1.5 rounded transition-colors ${openActionMenuId === customer.id ? 'bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            {/* Dropdown Menu */}
                            {openActionMenuId === customer.id && (
                              <div
                                ref={actionMenuRef}
                                className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-100 dark:border-slate-700 z-10 py-1"
                              >
                                <button
                                  onClick={() => { navigate(`/customers/${customer.id}`); setOpenActionMenuId(null); }}
                                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                  <Edit size={12} /> {t('actionEdit')}
                                </button>
                                <button
                                  onClick={() => handleArchiveCustomer(customer.id)}
                                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                >
                                  <Archive size={12} /> {t('actionArchive')}
                                </button>
                                <div className="h-px bg-gray-100 dark:bg-slate-700 my-1"></div>
                                <button
                                  onClick={() => handleDeleteCustomer(customer.id)}
                                  className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                  <Trash2 size={12} /> {t('actionDelete')}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {meta.total_pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
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
                  <span className="flex items-center text-sm text-slate-600 dark:text-slate-400">
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
            )}
          </Card>
        ) : (
          /* Kanban Board */
          <div className="flex overflow-x-auto pb-4 gap-4 items-start min-h-[500px]">
             {Object.keys(groupedCustomers).map(groupKey => (
               <div
                 key={groupKey}
                 className="min-w-[300px] w-[300px] flex-shrink-0 flex flex-col gap-3"
                 onDragOver={(e) => handleDragOver(e, groupKey)}
                 onDragLeave={handleDragLeave}
                 onDrop={(e) => handleDrop(e, groupKey)}
               >
                 {/* Column Header */}
                 <div className={`flex items-center justify-between px-2 py-2 rounded-lg transition-colors ${
                   draggedOverStage === groupKey
                     ? 'bg-primary/10 border-2 border-dashed border-primary'
                     : ''
                 }`}>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                       {groupKey === 'Uncategorized' ? t('uncategorized') :
                        t(`stage${groupKey.replace(/\s/g, '')}` as any) === `stage${groupKey.replace(/\s/g, '')}` ? groupKey : t(`stage${groupKey.replace(/\s/g, '')}` as any)
                       }
                       <span className="bg-gray-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full text-xs">
                         {groupedCustomers[groupKey].length}
                       </span>
                    </h3>
                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      <Plus size={16} />
                    </button>
                 </div>

                 {/* Cards Container */}
                 <div className="bg-gray-100/50 dark:bg-slate-800/50 rounded-xl p-2 min-h-[100px] flex flex-col gap-3"
                   style={{ minHeight: draggedOverStage === groupKey ? '200px' : '100px' }}
                 >
                    {groupedCustomers[groupKey].map(customer => (
                      <div
                        key={customer.id}
                        draggable={true}
                        onDragStart={() => handleDragStart(customer.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border transition-all group ${
                          draggedCustomerId === customer.id
                            ? 'border-primary opacity-50 cursor-grabbing'
                            : 'border-gray-200 dark:border-slate-700 cursor-grab hover:shadow-md'
                        }`}
                      >
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{customer.company}</span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => toggleActionMenu(customer.id, { stopPropagation: () => {} } as any)} className="text-slate-400 hover:text-slate-600">
                                <MoreHorizontal size={14} />
                              </button>
                            </div>
                         </div>
                         <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-1">{customer.name}</h4>
                         <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{customer.position}</p>

                         <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 dark:border-slate-700">
                            <Badge color={getIntentColor(customer.intent_level)}>{customer.intent_level}</Badge>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{customer.budget}</span>
                         </div>

                         {/* Quick Action Overlay for Follow Up */}
                         <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => setSelectedCustomerForFollowUp({ id: customer.id, name: customer.name })}
                              className="text-primary text-xs hover:underline flex items-center gap-1"
                            >
                               <MessageSquarePlus size={12} /> {t('followUpTitle')}
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Follow Up Modal */}
      <FollowUpModal
        isOpen={!!selectedCustomerForFollowUp}
        onClose={() => setSelectedCustomerForFollowUp(null)}
        customerId={selectedCustomerForFollowUp?.id ?? 0}
        customerName={selectedCustomerForFollowUp?.name || ''}
      />

      {/* Batch Import Modal */}
      <BatchImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => loadCustomers()}
      />

      {/* Batch Edit Modal */}
      <BatchEditModal
        isOpen={isBatchEditModalOpen}
        onClose={() => setIsBatchEditModalOpen(false)}
        customerIds={Array.from(selectedCustomerIds)}
        onSuccess={() => {
          loadCustomers();
          handleClearSelection();
        }}
      />
    </div>
  );
};
