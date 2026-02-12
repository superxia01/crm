import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, MessageSquare, List, Send, Bot, User, CheckCircle2 } from 'lucide-react';
import { Card, Button, Input, Badge } from '../../components/UI';
import { aiService } from '../../lib/services/aiService';
import { customerService, Customer, UpdateCustomerRequest } from '../../lib/services/customerService';
import { useLanguage, useToast } from '../../contexts';
import { handleApiError } from '../../lib/apiClient';

export const CustomerEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { showSuccess } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 编辑模式：form 或 chat
  const [editMode, setEditMode] = useState<'form' | 'chat'>('form');

  // AI Chat 状态
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: 'user' | 'ai'; text: string }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUpdatingFromChat, setIsUpdatingFromChat] = useState(false);

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
    customer_no: '',
    customer_type: '',
    wechat_id: '',
    address: '',
    company_scale: '',
    registered_capital: '',
    legal_person: '',
    credit_code: '',
    customer_level: '',
    customer_status: '',
    potential_score: 0,
    invoice_title: '',
    tax_number: '',
    bank_account: '',
    payment_terms: '',
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
        customer_no: data.customer_no || '',
        customer_type: data.customer_type || '',
        wechat_id: data.wechat_id || '',
        address: data.address || '',
        company_scale: data.company_scale || '',
        registered_capital: data.registered_capital || '',
        legal_person: data.legal_person || '',
        credit_code: data.credit_code || '',
        customer_level: data.customer_level || '',
        customer_status: data.customer_status || '',
        potential_score: data.potential_score || 0,
        invoice_title: data.invoice_title || '',
        tax_number: data.tax_number || '',
        bank_account: data.bank_account || '',
        payment_terms: data.payment_terms || '',
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
    const isNum = (v: string) => (v === '' ? undefined : Number(v));
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'potential_score' || name === 'probability') ? isNum(value) : value,
    }));
    setError(null);
  };

  const handleSave = async () => {
    if (!customer) return;

    // Validation: name, company 必填，phone/email/wechat_id 至少一个
    if (!formData.name || !formData.company) {
      setError('请填写必填字段（姓名、公司）');
      return;
    }
    if (!formData.phone && !formData.email && !formData.wechat_id) {
      setError('请至少填写一种联系方式（电话、邮箱或微信号）');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await customerService.updateCustomer(customer.id, formData);
      showSuccess('客户信息更新成功！');
      navigate(`/customers/${customer.id}`);
    } catch (err) {
      console.error('Failed to update customer:', err);
      setError(handleApiError(err));
      setIsSubmitting(false);
    }
  };

  // --- AI Chat 编辑相关函数 ---

  // 初始化 Chat 模式
  const initChatMode = () => {
    if (!customer) return;

    setChatMessages([{
      id: '1',
      role: 'ai',
      text: `你好！我可以帮你编辑客户信息。

当前客户信息：
姓名：${customer.name}
公司：${customer.company}
职位：${customer.position || '未填写'}
电话：${customer.phone || '未填写'}
邮箱：${customer.email || '未填写'}
微信号：${customer.wechat_id || '未填写'}

📝 你可以说：
- "把姓名改成李四"
- "补充一下邮箱是 xxx@xxx.com"
- "电话错了，应该是 13900139000"

请告诉我需要修改或补充的内容。`
    }]);
  };

  // 切换到 Chat 模式
  const handleSwitchToChat = () => {
    initChatMode();
    setEditMode('chat');
    setError(null);
  };

  // Chat 模式发送消息
  const handleChatSend = async () => {
    if (!customer) return;
    const text = inputMessage.trim();
    if (!text) return;

    const userMsg = { id: Date.now().toString(), role: 'user' as const, text };
    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);
    setError(null);

    try {
      // 构建当前字段
      const currentFields: Record<string, string> = {
        name: formData.name || '',
        company: formData.company || '',
        phone: formData.phone || '',
        email: formData.email || '',
        wechat_id: formData.wechat_id || '',
        position: formData.position || '',
        budget: formData.budget || '',
        intent_level: formData.intent_level || 'Medium',
        notes: formData.notes || '',
      };

      const apiMessages = chatMessages
        .filter(m => m.role !== 'ai' || m.id !== '1') // 移除初始化消息
        .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user' as const, content: m.text }));
      apiMessages.push({ role: 'user' as const, content: text });

      const res = await aiService.customerIntakeChat({
        messages: apiMessages,
        current_fields: currentFields,
      });

      // 更新消息
      setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', text: res.reply }]);

      // 更新表单数据
      const merged = { ...formData, ...res.extracted_fields };
      if (merged.intent_level === '') merged.intent_level = 'Medium';
      setFormData(merged);
    } catch (err) {
      console.error('AI 编辑失败:', err);
      setError(handleApiError(err));
      setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', text: '抱歉，处理失败了，请重试或切换到表单模式。' }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Chat 模式保存更改
  const handleChatSave = async () => {
    if (!customer) return;

    setIsUpdatingFromChat(true);
    setError(null);

    try {
      await customerService.updateCustomer(customer.id, formData);
      showSuccess('客户信息更新成功！');
      navigate(`/customers/${customer.id}`);
    } catch (err) {
      console.error('更新客户失败:', err);
      setError(handleApiError(err));
    } finally {
      setIsUpdatingFromChat(false);
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

      {/* 模式切换 */}
      <div className="flex justify-center">
        <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-slate-700 flex gap-1">
          <button
            onClick={() => setEditMode('form')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${editMode === 'form' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            <List size={16} className="mr-2" /> 表单编辑
          </button>
          <button
            onClick={handleSwitchToChat}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${editMode === 'chat' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            <MessageSquare size={16} className="mr-2" /> AI 智能编辑
          </button>
        </div>
      </div>

      {/* 表单编辑模式 */}
      {editMode === 'form' && (
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

        {/* Extended Information Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-gray-200 dark:border-slate-700">
            扩展信息
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="客户编号" name="customer_no" value={formData.customer_no} onChange={handleInputChange} placeholder="可留空自动生成" />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">客户类型</label>
              <select name="customer_type" value={formData.customer_type} onChange={handleInputChange} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm text-slate-900 dark:text-slate-100">
                <option value="">请选择</option>
                <option value="企业">企业</option>
                <option value="个人">个人</option>
                <option value="渠道">渠道</option>
              </select>
            </div>
            <Input label="微信号/企业微信" name="wechat_id" value={formData.wechat_id} onChange={handleInputChange} placeholder="微信号或企业微信 ID" />
            <Input label="地址" name="address" value={formData.address} onChange={handleInputChange} placeholder="省市区 + 详细地址" />
            <Input label="公司规模" name="company_scale" value={formData.company_scale} onChange={handleInputChange} placeholder="如：1-50人" />
            <Input label="注册资本" name="registered_capital" value={formData.registered_capital} onChange={handleInputChange} placeholder="如：100万" />
            <Input label="法人代表" name="legal_person" value={formData.legal_person} onChange={handleInputChange} />
            <Input label="统一社会信用代码" name="credit_code" value={formData.credit_code} onChange={handleInputChange} />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">客户等级</label>
              <select name="customer_level" value={formData.customer_level} onChange={handleInputChange} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm text-slate-900 dark:text-slate-100">
                <option value="">请选择</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="VIP">VIP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">客户状态</label>
              <select name="customer_status" value={formData.customer_status} onChange={handleInputChange} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm text-slate-900 dark:text-slate-100">
                <option value="">请选择</option>
                <option value="活跃">活跃</option>
                <option value="休眠">休眠</option>
                <option value="流失">流失</option>
              </select>
            </div>
            <Input label="潜力评分 (0-100)" name="potential_score" type="number" min={0} max={100} value={formData.potential_score ?? ''} onChange={handleInputChange} placeholder="0-100" />
            <Input label="发票抬头" name="invoice_title" value={formData.invoice_title} onChange={handleInputChange} />
            <Input label="纳税人识别号" name="tax_number" value={formData.tax_number} onChange={handleInputChange} />
            <Input label="开户行及账号" name="bank_account" value={formData.bank_account} onChange={handleInputChange} placeholder="开户行 + 账号" />
            <Input label="账期" name="payment_terms" value={formData.payment_terms} onChange={handleInputChange} placeholder="如：月结30天" />
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
      )}

      {/* AI Chat 编辑模式 */}
      {editMode === 'chat' && (
        <Card className="h-[650px] max-h-[calc(100vh-10rem)] flex flex-col p-0 overflow-hidden min-h-0">
          {/* Header */}
          <div className="shrink-0 bg-blue-50 dark:bg-blue-900/20 px-6 py-3 border-b border-blue-100 dark:border-blue-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot size={16} className="text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                AI 智能编辑
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-900/50">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mx-2 ${msg.role === 'ai' ? 'bg-primary text-white' : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-200'}`}>
                    {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 shadow-sm rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 mx-2">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-none border border-gray-200 dark:border-slate-700 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-300 dark:bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-300 dark:bg-gray-500 rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-gray-300 dark:bg-gray-500 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input & Actions */}
          <div className="shrink-0 p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                placeholder="输入需要修改的内容，如：把姓名改成李四"
                disabled={isTyping}
                className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-slate-100 disabled:opacity-50"
              />
              <Button onClick={handleChatSend} disabled={!inputMessage.trim() || isTyping}>
                <Send size={18} />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEditMode('form')}
                className="flex-1"
              >
                切换到表单
              </Button>
              <Button
                onClick={handleChatSave}
                disabled={isUpdatingFromChat}
                className="flex-1"
              >
                {isUpdatingFromChat ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} /> 保存中...
                  </>
                ) : (
                  <>
                    <Save size={18} className="mr-2" /> 保存更改
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
