import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Card, Button, Input, Badge } from '../../components/UI';
import { customerService, Customer, UpdateCustomerRequest } from '../../lib/services/customerService';
import { useLanguage } from '../../contexts';
import { handleApiError } from '../../lib/apiClient';

export const CustomerEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data with all editable fields
  const [formData, setFormData] = useState<UpdateCustomerRequest>({
    name: '',
    company: '',
    position: '',
    phone: '',
    email: '',
    industry: '',
    budget: '',
    intent_level: 'Medium',
    stage: 'Leads',
    source: 'Manual',
    notes: '',
    // Contract fields
    contract_value: '',
    contract_status: 'Pending',
    contract_start_date: '',
    contract_end_date: '',
    expected_close_date: '',
    probability: 0,
    annual_revenue: '',
  });

  // Load customer data
  useEffect(() => {
    if (id) {
      loadCustomer(parseInt(id));
    }
  }, [id]);

  const loadCustomer = async (customerId: number) => {
    try {
      setIsLoading(true);
      const data = await customerService.getCustomer(customerId);
      setCustomer(data);

      // Populate form with customer data
      setFormData({
        name: data.name || '',
        company: data.company || '',
        position: data.position || '',
        phone: data.phone || '',
        email: data.email || '',
        industry: data.industry || '',
        budget: data.budget || '',
        intent_level: data.intent_level || 'Medium',
        stage: data.stage || 'Leads',
        source: data.source || 'Manual',
        notes: data.notes || '',
        contract_value: data.contract_value || '',
        contract_status: data.contract_status || 'Pending',
        contract_start_date: data.contract_start_date || '',
        contract_end_date: data.contract_end_date || '',
        expected_close_date: data.expected_close_date || '',
        probability: data.probability || 0,
        annual_revenue: data.annual_revenue || '',
      });
    } catch (err) {
      console.error('Failed to load customer:', err);
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSave = async () => {
    if (!customer) return;

    // Validation
    if (!formData.name || !formData.company || !formData.phone) {
      setError('请填写必填字段（姓名、公司、电话）');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await customerService.updateCustomer(customer.id, formData);
      navigate(`/customers/${customer.id}`);
    } catch (err) {
      console.error('Failed to update customer:', err);
      setError(handleApiError(err));
      setIsSubmitting(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary mx-auto mb-4" size={32} />
          <p className="text-slate-500 dark:text-slate-400">加载客户信息中...</p>
        </div>
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={() => navigate('/customers')}>
            返回客户列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => customer && navigate(`/customers/${customer.id}`)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">编辑客户</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{customer?.name} - {customer?.company}</p>
        </div>
        {customer?.stage && (
          <Badge color={getStageColor(customer.stage)}>{customer.stage}</Badge>
        )}
      </div>

      <Card>
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Basic Information Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-gray-200 dark:border-slate-700">
            基本信息
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="客户姓名"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="例如：张三"
              required
            />
            <Input
              label="公司名称"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="例如：科技有限公司"
              required
            />
            <Input
              label="职位"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              placeholder="例如：CTO"
            />
            <Input
              label="行业"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              placeholder="例如：软件"
            />
            <Input
              label="邮箱"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="例如：zhangsan@company.com"
            />
            <Input
              label="电话"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="例如：13800138000"
              required
            />
          </div>
        </div>

        {/* Sales Information Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-gray-200 dark:border-slate-700">
            销售信息
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                销售阶段
              </label>
              <select
                name="stage"
                value={formData.stage}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="Leads">Leads - 线索</option>
                <option value="Qualified">Qualified - 合格线索</option>
                <option value="Proposal">Proposal - 方案</option>
                <option value="Negotiation">Negotiation - 谈判</option>
                <option value="Closed Won">Closed Won - 已成交</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                意向度
              </label>
              <select
                name="intent_level"
                value={formData.intent_level}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="High">High - 高意向</option>
                <option value="Medium">Medium - 中意向</option>
                <option value="Low">Low - 低意向</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                客户来源
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="Manual">Manual - 手动添加</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Website">Website - 网站</option>
                <option value="Referral">Referral - 推荐</option>
                <option value="Cold Call">Cold Call - 电话</option>
                <option value="Event">Event - 活动</option>
              </select>
            </div>
            <Input
              label="预算"
              name="budget"
              value={formData.budget}
              onChange={handleInputChange}
              placeholder="例如：¥50,000"
            />
          </div>
        </div>

        {/* Contract Information Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-gray-200 dark:border-slate-700">
            合同信息
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="合同金额"
              name="contract_value"
              value={formData.contract_value}
              onChange={handleInputChange}
              placeholder="例如：¥100,000"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                合同状态
              </label>
              <select
                name="contract_status"
                value={formData.contract_status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="Pending">Pending - 待签约</option>
                <option value="Signed">Signed - 已签约</option>
                <option value="Expired">Expired - 已过期</option>
                <option value="Cancelled">Cancelled - 已取消</option>
              </select>
            </div>
            <Input
              label="合同开始日期"
              name="contract_start_date"
              type="date"
              value={formData.contract_start_date}
              onChange={handleInputChange}
            />
            <Input
              label="合同结束日期"
              name="contract_end_date"
              type="date"
              value={formData.contract_end_date}
              onChange={handleInputChange}
            />
            <Input
              label="预计成交日期"
              name="expected_close_date"
              type="date"
              value={formData.expected_close_date}
              onChange={handleInputChange}
            />
            <Input
              label="年度收入"
              name="annual_revenue"
              value={formData.annual_revenue}
              onChange={handleInputChange}
              placeholder="例如：¥1,000,000"
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                成交概率 (%)
              </label>
              <input
                type="range"
                name="probability"
                min="0"
                max="100"
                value={formData.probability}
                onChange={handleInputChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0%</span>
                <span className="font-semibold text-primary">{formData.probability}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            备注
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={4}
            placeholder="添加备注信息..."
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={() => customer && navigate(`/customers/${customer.id}`)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                保存中...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                保存更改
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};
