import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Card, Button, Input } from '../../components/UI';
import { dealService, CreateDealRequest } from '../../lib/services/dealService';
import { customerService } from '../../lib/services/customerService';
import { handleApiError } from '../../lib/apiClient';
import { useLanguage } from '../../contexts';

export const DealForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
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
      setError(t('validationRequiredFields'));
      return;
    }
    if (form.amount < 0) {
      setError(t('validationAmountNegative'));
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
          {isEdit ? t('editDeal') : t('newDeal')}
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('customers')} *</label>
            <select
              name="customer_id"
              value={form.customer_id || ''}
              onChange={e => setForm(f => ({ ...f, customer_id: parseInt(e.target.value, 10) || 0 }))}
              disabled={!!preselectedCustomerId}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            >
              <option value="">{t('selectCustomer')}</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.company} - {c.name}</option>
              ))}
            </select>
          </div>

          <Input
            label={t('productService') + ' *'}
            name="product_or_service"
            value={form.product_or_service}
            onChange={handleChange}
            placeholder={t('productServicePlaceholder')}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('dealType')}</label>
            <select name="deal_type" value={form.deal_type} onChange={handleChange} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm">
              <option value="sale">{t('typeSale')}</option>
              <option value="renewal">{t('typeRenewal')}</option>
              <option value="project">{t('typeProject')}</option>
            </select>
          </div>

          <Input label={t('amount') + ' *'} name="amount" type="number" min={0} step={0.01} value={form.amount || ''} onChange={handleChange} />
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('currency')}</label>
            <select name="currency" value={form.currency} onChange={handleChange} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm">
              <option value="CNY">CNY</option>
              <option value="USD">USD</option>
            </select>
          </div>

          <Input label={t('quantity')} name="quantity" type="number" min={0} step={0.01} value={form.quantity} onChange={handleChange} />
          <Input label={t('unit')} name="unit" value={form.unit} onChange={handleChange} placeholder="piece" />

          <Input label={t('dealDate') + ' *'} name="deal_at" type="date" value={form.deal_at} onChange={handleChange} />
          <Input label={t('contractNo')} name="contract_no" value={form.contract_no} onChange={handleChange} />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('paymentStatus')}</label>
            <select name="payment_status" value={form.payment_status} onChange={handleChange} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm">
              <option value="pending">{t('paymentStatusPending')}</option>
              <option value="partial">{t('paymentStatusPartial')}</option>
              <option value="paid">{t('paymentStatusPaid')}</option>
            </select>
          </div>
          <Input label={t('paidAmount')} name="paid_amount" type="number" min={0} step={0.01} value={form.paid_amount || ''} onChange={handleChange} />
          <Input label={t('signedDate')} name="signed_at" type="date" value={form.signed_at || ''} onChange={handleChange} />
          <Input label={t('paidDate')} name="paid_at" type="date" value={form.paid_at || ''} onChange={handleChange} />

          <div className="md:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="is_repeat_purchase"
              name="is_repeat_purchase"
              checked={form.is_repeat_purchase}
              onChange={handleChange}
              className="rounded border-gray-300"
            />
            <label htmlFor="is_repeat_purchase" className="text-sm text-slate-700 dark:text-slate-300">{t('isRepeatPurchase')}</label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('notes')}</label>
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
          <Button variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
            {t('saveCustomer')}
          </Button>
        </div>
      </Card>
    </div>
  );
};
