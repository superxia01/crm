import React, { useState } from 'react';
import { Copy, RefreshCw, Wand2, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { Card, Button, Badge } from '../../components/UI';
import { aiService } from '../../lib/services/aiService';
import { useLanguage } from '../../contexts';
import { handleApiError } from '../../lib/apiClient';

export const ScriptAssistant: React.FC = () => {
  const { t } = useLanguage();
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!customPrompt) {
      setError('请输入生成话术的描述');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await aiService.generateScript({
        context: customPrompt,
        customer_name: '客户',
        scenario: 'cold_call',
      });

      setGeneratedScript(response.script);
      setKeyPoints(response.key_points || []);
      setTips(response.tips || []);
    } catch (err) {
      console.error('Failed to generate script:', err);
      setError(handleApiError(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('scriptTitle')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{t('scriptSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Context */}
        <div className="lg:col-span-1 space-y-6">
          <Card title={t('customerContext')}>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-100 dark:border-slate-600">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">{t('targetCustomer')}</div>
                <div className="font-medium text-slate-900 dark:text-slate-100 mt-1">待定客户</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">选择客户后可生成个性化话术</div>
              </div>

              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">使用说明</div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  在右侧输入您想要生成的销售话术描述，AI 将为您生成专业的话术内容。
                </p>
              </div>
            </div>
          </Card>

          <Card title={t('customGeneration')}>
            <div className="space-y-3">
              {error && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              <label className="text-sm text-slate-600 dark:text-slate-300">{t('whatToSay')}</label>
              <textarea
                className="w-full p-3 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-slate-100"
                rows={6}
                placeholder={t('placeholderScript')}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              ></textarea>
              <Button className="w-full" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} /> 生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2" size={16} /> {t('generateScript')}
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Scripts */}
        <div className="lg:col-span-2 space-y-6">
          {generatedScript && (
            <Card className="border-primary/30 shadow-md shadow-blue-50 dark:shadow-none">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary" size={20} />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">{t('customResult')}</h3>
                </div>
                <button
                  onClick={() => handleCopy(generatedScript)}
                  className="text-slate-400 hover:text-primary transition-colors"
                  title="复制话术"
                >
                  <Copy size={18} />
                </button>
              </div>
              <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {generatedScript}
              </div>

              {keyPoints.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">关键要点</h4>
                  <ul className="space-y-1">
                    {keyPoints.map((point, idx) => (
                      <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start">
                        <span className="text-primary mr-2">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tips.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">成功建议</h4>
                  <ul className="space-y-1">
                    {tips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          <div className="text-center text-slate-400 dark:text-slate-500 py-12">
            <Wand2 size={48} className="mx-auto mb-4 opacity-50" />
            <p>在左侧输入描述，AI 将为您生成专业的销售话术</p>
          </div>
        </div>
      </div>
    </div>
  );
};
