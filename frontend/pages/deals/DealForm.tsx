import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Card, Button, Input } from '../../components/UI';
import { dealService, CreateDealRequest } from '../../lib/services/dealService';
import { customerService } from '../../lib/services/customerService';
import { handleApiError } from '../../lib/apiClient';

export const DealForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customer_id');

  const isEdit = !!id;
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<{ id: number; name: string; company: string }[]>([]);

  const [form, setForm] = useState<CreateDealRequest & { customer_id: number }>({
    customer_id: preselectedCustomerId ? parseInt(preselectedCustomerId, 10) : 0,
    deal_type: 'sale',
    product_or_service: '',
    quantity: 1,
    unit: 'piece',
    amount: 0,
    currency: 'CNY',
    contract_no: '',
    payment_status: 'pending',
    paid_amount: 0,
    is_repeat_purchase: false,
    deal_at: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await customerService.listCustomers({ per_page: 500 });
        if (!cancelled) setCustomers(res.customers);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const deal = await dealService.getDeal(parseInt(id!, 10));
        if (cancelled) return;
        setForm({
          customer_id: deal.customer_id,
          deal_type: deal.deal_type || 'sale',
          product_or_service: deal.product_or_service,
          quantity: deal.quantity,
          unit: deal.unit || 'piece',
          amount: deal.amount,
          currency: deal.currency || 'CNY',
          contract_no: deal.contract_no || '',
          signed_at: deal.signed_at ? deal.signed_at.slice(0, 10) : undefined,
          payment_status: deal.payment_status || 'pending',
          paid_amount: deal.paid_amount,
          paid_at: deal.paid_at ? deal.paid_at.slice(0, 10) : undefined,
          is_repeat_purchase: deal.is_repeat_purchase,
          deal_at: deal.deal_at ? deal.deal_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
          notes: deal.notes || '',
        });
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  useEffect(() => {
    if (preselectedCustomerId && !isEdit) {
      const cid = parseInt(preselectedCustomerId, 10);
      if (!isNaN(cid)) setForm(f => ({ ...f, customer_id: cid }));
    }
  }, [preselectedCustomerId, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!form.customer_id || !form.product_or_service || !form.deal_at) {
      setError('请填写客户、产品/服务、成交日期');
      return;
    }
    if (form.amount < 0) {
      setError('金额不能为负');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEdit) {
        await dealService.updateDeal(parseInt(id!, 10), {
          deal_type: form.deal_type,
          product_or_service: form.product_or_service,
          quantity: form.quantity,
          unit: form.unit,
          amount: form.amount,
          currency: form.currency,
          contract_no: form.contract_no || undefined,
          signed_at: form.signed_at ? new Date(form.signed_at).toISOString() : undefined,
          payment_status: form.payment_status,
          paid_amount: form.paid_amount,
          paid_at: form.paid_at ? new Date(form.paid_at).toISOString() : undefined,
          is_repeat_purchase: form.is_repeat_purchase,
          deal_at: new Date(form.deal_at).toISOString(),
          notes: form.notes || undefined,
        });
        navigate(`/deals`);
      } else {
        await dealService.createDeal({
          customer_id: form.customer_id,
          deal_type: form.deal_type,
          product_or_service: form.product_or_service,
          quantity: form.quantity,
          unit: form.unit,
          amount: form.amount,
          currency: form.currency,
          contract_no: form.contract_no || undefined,
          signed_at: form.signed_at ? new Date(form.signed_at).toISOString() : undefined,
          payment_status: form.payment_status,
          paid_amount: form.paid_amount,
          paid_at: form.paid_at ? new Date(form.paid_at).toISOString() : undefined,
          is_repeat_purchase: form.is_repeat_purchase,
          deal_at: new Date(form.deal_at).toISOString(),
          notes: form.notes || undefined,
        });
        navigate(preselectedCustomerId ? `/customers/${preselectedCustomerId}` : '/deals');
      }
    } catch (err) {
      setError(handleApiError(err));
      setIsSubmitting(false);
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {isEdit ? '编辑业绩' : '新增业绩'}
        </h1>
      </div>

      <Card>
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">客户 *</label>
            <select
              name="customer_id"
              value={form.customer_id || ''}
              onChange={e => setForm(f => ({ ...f, customer_id: parseInt(e.target.value, 10) || 0 }))}
              disabled={!!preselectedCustomerId}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            >
              <option value="">请选择客户</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.company} - {c.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="产品/服务 *"
            name="product_or_service"
            value={form.product_or_service}
            onChange={handleChange}
            placeholder="例如：年度服务费"
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">类型</label>
            <select name="deal_type" value={form.deal_type} onChange={handleChange} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm">
              <option value="sale">销售</option>
              <option value="renewal">续费</option>
              <option value="project">项目</option>
            </select>
          </div>

          <Input label="金额 *" name="amount" type="number" min={0} step={0.01} value={form.amount || ''} onChange={handleChange} />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">币种</label>
            <select name="currency" value={form.currency} onChange={handleChange} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm">
              <option value="CNY">CNY</option>
              <option value="USD">USD</option>
            </select>
          </div>

          <Input label="数量" name="quantity" type="number" min={0} step={0.01} value={form.quantity} onChange={handleChange} />
          <Input label="单位" name="unit" value={form.unit} onChange={handleChange} placeholder="piece" />

          <Input label="成交日期 *" name="deal_at" type="date" value={form.deal_at} onChange={handleChange} />
          <Input label="合同编号" name="contract_no" value={form.contract_no} onChange={handleChange} />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">回款状态</label>
            <select name="payment_status" value={form.payment_status} onChange={handleChange} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm">
              <option value="pending">待回款</option>
              <option value="partial">部分回款</option>
              <option value="paid">已回款</option>
            </select>
          </div>
          <Input label="已回款金额" name="paid_amount" type="number" min={0} step={0.01} value={form.paid_amount || ''} onChange={handleChange} />
          <Input label="签约日期" name="signed_at" type="date" value={form.signed_at || ''} onChange={handleChange} />
          <Input label="回款日期" name="paid_at" type="date" value={form.paid_at || ''} onChange={handleChange} />

          <div className="md:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="is_repeat_purchase"
              name="is_repeat_purchase"
              checked={form.is_repeat_purchase}
              onChange={handleChange}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_repeat_purchase" className="text-sm text-slate-700 dark:text-slate-300">复购</label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">备注</label>
            <textarea
              name="notes"
              value={form.notes || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-slate-700">
          <Button variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>取消</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
            保存
          </Button>
        </div>
      </Card>
    </div>
  );
};
