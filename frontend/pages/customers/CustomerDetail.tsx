import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit, Mail, Phone, Building2, Calendar,
  DollarSign, TrendingUp, FileText, MessageSquarePlus,
  CheckCircle2, Clock, AlertTriangle, MoreHorizontal,
  Download, Share2, Archive, Trash2, Loader2, Wand2, PhoneCall, Mail as MailIcon, MessageSquare, User
} from 'lucide-react';
import { customerService, Customer } from '../../lib/services/customerService';
import { aiService } from '../../lib/services/aiService';
import { interactionService, Interaction } from '../../lib/services/interactionService';
import { Card, Button, Badge } from '../../components/UI';
import { useLanguage } from '../../contexts';
import { FollowUpModal } from '../../components/FollowUpModal';
import { handleApiError } from '../../lib/apiClient';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoadingInteractions, setIsLoadingInteractions] = useState(false);
  const [selectedCustomerForFollowUp, setSelectedCustomerForFollowUp] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const handleFollowUpSaved = () => {
    // Refresh customer data to show updated follow-up count
    if (customer) {
      loadCustomer(customer.id);
      loadInteractions(customer.id);
    }
  };

  useEffect(() => {
    if (id) {
      loadCustomer(parseInt(id));
    }
  }, [id]);

  const loadInteractions = async (customerId: number) => {
    setIsLoadingInteractions(true);
    try {
      const data = await interactionService.getByCustomerId(customerId);
      setInteractions(data);
    } catch (err) {
      console.error('Failed to load interactions:', err);
    } finally {
      setIsLoadingInteractions(false);
    }
  };

  const loadCustomer = async (customerId: number) => {
    try {
      setIsLoading(true);
      const data = await customerService.getCustomer(customerId);
      setCustomer(data);
      // Load interactions after customer is loaded
      loadInteractions(customerId);
    } catch (err) {
      console.error('Failed to load customer:', err);
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!customer) return;

    setIsAnalyzing(true);
    try {
      const analysis = await aiService.analyzeCustomer(customer.id, 'comprehensive');
      setAiAnalysis(analysis);
    } catch (err) {
      console.error('AI analysis failed:', err);
      alert(handleApiError(err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary mx-auto mb-4" size={32} />
          <p className="text-slate-500 dark:text-slate-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">{error || '客户不存在'}</p>
          <Button onClick={() => navigate('/customers')}>
            <ArrowLeft size={16} className="mr-2" />
            返回客户列表
          </Button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/customers"
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {customer.name}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">{customer.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download size={16} className="mr-2" />
            导出
          </Button>
          <Button variant="outline">
            <Share2 size={16} className="mr-2" />
            分享
          </Button>
          <Button onClick={() => navigate(`/customers/${customer.id}/edit`)}>
            <Edit size={16} className="mr-2" />
            编辑
          </Button>
        </div>
      </div>

      {/* Key Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">销售阶段</span>
            {customer.stage && (
              <Badge color={getStageColor(customer.stage)}>{customer.stage}</Badge>
            )}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">意向度</span>
            <Badge color={getIntentColor(customer.intent_level)}>{customer.intent_level}</Badge>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">合同金额</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {customer.contract_value || customer.budget || '-'}
            </span>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">成交概率</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {customer.probability !== undefined ? `${customer.probability}%` : '-'}
            </span>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card title="联系信息">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">邮箱</div>
                    <div className="text-slate-900 dark:text-white">{customer.email || '-'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">电话</div>
                    <div className="text-slate-900 dark:text-white">{customer.phone}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 size={18} className="text-slate-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">公司</div>
                    <div className="text-slate-900 dark:text-white">{customer.company}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{customer.position || '-'}</div>
                  </div>
                </div>
                {customer.industry && (
                  <div className="flex items-start gap-3">
                    <Building2 size={18} className="text-slate-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">行业</div>
                      <div className="text-slate-900 dark:text-white">{customer.industry}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Contract Information */}
          <Card title="合同信息">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">合同金额</div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {customer.contract_value || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">合同状态</div>
                  <div>
                    {customer.contract_status ? (
                      <Badge color={getContractStatusColor(customer.contract_status)}>
                        {customer.contract_status === 'Signed' ? '已签约' :
                         customer.contract_status === 'Pending' ? '待签约' :
                         customer.contract_status === 'Expired' ? '已过期' : '已取消'}
                      </Badge>
                    ) : '-'}
                  </div>
                </div>
              </div>
              {customer.contract_start_date && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">合同开始</div>
                    <div className="text-slate-900 dark:text-white">{new Date(customer.contract_start_date).toLocaleDateString()}</div>
                  </div>
                  {customer.contract_end_date && (
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">合同结束</div>
                      <div className="text-slate-900 dark:text-white">{new Date(customer.contract_end_date).toLocaleDateString()}</div>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">预计成交日期</div>
                  <div className="text-slate-900 dark:text-white">
                    {customer.expected_close_date ? new Date(customer.expected_close_date).toLocaleDateString() : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">年度收入</div>
                  <div className="text-slate-900 dark:text-white">
                    {customer.annual_revenue || '-'}
                  </div>
                </div>
              </div>
              {customer.probability !== undefined && (
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">成交概率</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          customer.probability >= 80 ? 'bg-green-500' :
                          customer.probability >= 50 ? 'bg-blue-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${customer.probability}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white min-w-[50px] text-right">
                      {customer.probability}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card title="跟进记录">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 pb-2 border-b border-gray-100 dark:border-slate-700">
                <Clock size={16} />
                <span>最后联系: {customer.last_contact ? new Date(customer.last_contact).toLocaleDateString() : '-'}</span>
                <span className="text-slate-400">•</span>
                <span>跟进次数: {customer.follow_up_count || 0}</span>
              </div>

              {isLoadingInteractions ? (
                <div className="text-center py-8">
                  <Loader2 className="animate-spin text-primary mx-auto" size={24} />
                  <p className="text-xs text-slate-400 mt-2">加载中...</p>
                </div>
              ) : interactions.length > 0 ? (
                <div className="space-y-4">
                  {interactions.map((interaction, index) => (
                    <div key={interaction.id} className="flex gap-3">
                      {/* Timeline Line */}
                      {index < interactions.length - 1 && (
                        <div className="absolute left-[19px] top-10 w-0.5 h-full bg-gray-200 dark:bg-slate-700"></div>
                      )}

                      {/* Icon */}
                      <div className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0
                        ${interaction.type === 'call' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                          interaction.type === 'email' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                          interaction.type === 'meeting' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                          'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'}">
                        {interaction.type === 'call' ? <PhoneCall size={16} /> :
                         interaction.type === 'email' ? <MailIcon size={16} /> :
                         interaction.type === 'meeting' ? <User size={16} /> :
                         <MessageSquare size={16} />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {interaction.type === 'call' ? '电话沟通' :
                             interaction.type === 'email' ? '邮件往来' :
                             interaction.type === 'meeting' ? '会议' :
                             interaction.type === 'note' ? '备注' : '其他'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(interaction.created_at).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                          {interaction.content}
                        </p>
                        {interaction.next_action && (
                          <div className="mt-2 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                            <span>下一步: {interaction.next_action}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  暂无跟进记录
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card title="快速操作">
            <div className="space-y-3">
              <Button
                className="w-full justify-start"
                onClick={() => setSelectedCustomerForFollowUp({ id: customer.id, name: customer.name })}
              >
                <MessageSquarePlus size={16} className="mr-2" />
                添加跟进记录
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/customers/${customer.id}/edit`)}>
                <Edit size={16} className="mr-2" />
                编辑客户信息
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Share2 size={16} className="mr-2" />
                分享客户
              </Button>
              <Button variant="outline" className="w-full justify-start text-slate-600 dark:text-slate-400">
                <Archive size={16} className="mr-2" />
                归档客户
              </Button>
            </div>
          </Card>

          {/* Source Info */}
          <Card title="来源信息">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">客户来源</div>
                <div className="text-slate-900 dark:text-white">
                  {customer.source === 'LinkedIn' ? 'LinkedIn' :
                   customer.source === 'Website' ? '网站' :
                   customer.source === 'Referral' ? '推荐' :
                   customer.source === 'Cold Call' ? '电话' :
                   customer.source === 'Event' ? '活动' :
                   customer.source === 'Manual' ? '手动添加' : customer.source || '-'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">预算</div>
                <div className="text-slate-900 dark:text-white">{customer.budget || '-'}</div>
              </div>
              {customer.notes && (
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">备注</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{customer.notes}</div>
                </div>
              )}
            </div>
          </Card>

          {/* AI Insights */}
          <Card title="AI 洞察" icon={<TrendingUp size={18} className="text-purple-500" />}>
            {!aiAnalysis ? (
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={16} /> 分析中...
                    </>
                  ) : (
                    <>
                      <Wand2 size={16} className="mr-2" /> AI 分析客户
                    </>
                  )}
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  点击使用 AI 分析客户意向、风险和机会
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-green-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                      <div className="font-semibold mb-1">摘要</div>
                      {aiAnalysis.summary}
                    </div>
                  </div>
                </div>
                {aiAnalysis.intent_score && (
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">AI 意向评分</div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {aiAnalysis.intent_score}/100
                    </div>
                  </div>
                )}
                {aiAnalysis.risk_level && (
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">风险等级</div>
                    <Badge color={aiAnalysis.risk_level === 'high' ? 'red' : aiAnalysis.risk_level === 'medium' ? 'yellow' : 'green'}>
                      {aiAnalysis.risk_level === 'high' ? '高' : aiAnalysis.risk_level === 'medium' ? '中' : '低'}
                    </Badge>
                  </div>
                )}
                {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">建议</div>
                    <ul className="space-y-1">
                      {aiAnalysis.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start">
                          <span className="text-primary mr-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Follow Up Modal */}
      <FollowUpModal
        isOpen={!!selectedCustomerForFollowUp}
        onClose={() => setSelectedCustomerForFollowUp(null)}
        customerId={selectedCustomerForFollowUp?.id || 0}
        customerName={selectedCustomerForFollowUp?.name || ''}
        onSave={handleFollowUpSaved}
      />
    </div>
  );
};
