import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Save, MessageSquare, List, Send, Bot, User, CheckCircle2, Mic, StopCircle, Loader2 } from 'lucide-react';
import { Card, Button, Input } from '../../components/UI';
import { customerService, CreateCustomerRequest } from '../../lib/services/customerService';
import { useLanguage, useToast } from '../../contexts';
import { handleApiError } from '../../lib/apiClient';
import { aiService } from '../../lib/services/aiService';

export const NewCustomer: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showSuccess, showError } = useToast();
  const [mode, setMode] = useState<'form' | 'chat' | 'voice'>('form');
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    name: '',
    company: '',
    position: '',
    phone: '',
    email: '',
    budget: '',
    intent_level: 'Medium',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat State（真 AI：豆包）
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'ai'; text: string }>>([
    { id: '1', role: 'ai', text: '你好！我可以帮你快速注册新客户。你可以直接说出或输入客户信息（姓名、公司、电话为必填），我会尽量少问几轮就帮你填齐。' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [createSuccessTip, setCreateSuccessTip] = useState<string | null>(null); // 创建成功后提示可补充选填项

  // 进度：必填项 姓名、公司、电话 已填数量 / 3 * 100
  const requiredFilled = [formData.name?.trim(), formData.company?.trim(), formData.phone?.trim()].filter(Boolean).length;
  const chatProgressPercent = Math.round((requiredFilled / 3) * 100);

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name || !formData.company || !formData.phone) {
      setError('请填写必填字段（姓名、公司、电话）');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await customerService.createCustomer(formData);
      navigate('/customers');
    } catch (err) {
      console.error('Failed to create customer:', err);
      setError(handleApiError(err));
      setIsSubmitting(false);
    }
  };

  // --- Chat Logic：对接豆包，引导填必填项，收齐后创建客户 ---
  const handleSendMessage = async () => {
    const text = inputMessage.trim();
    if (!text) return;

    const userMsg = { id: Date.now().toString(), role: 'user' as const, text };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);
    setError(null);
    setCreateSuccessTip(null);

    try {
      const apiMessages = messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user' as const, content: m.text }));
      apiMessages.push({ role: 'user' as const, content: text });

      const currentFields: Record<string, string> = {
        name: formData.name || '',
        company: formData.company || '',
        phone: formData.phone || '',
        position: formData.position || '',
        email: formData.email || '',
        budget: formData.budget || '',
        intent_level: formData.intent_level || 'Medium',
        notes: formData.notes || '',
      };

      const res = await aiService.customerIntakeChat({
        messages: apiMessages,
        current_fields: currentFields,
      });

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', text: res.reply }]);

      const merged = { ...formData, ...res.extracted_fields };
      if (merged.intent_level === '') merged.intent_level = 'Medium';
      setFormData(merged);

      if (res.can_create) {
        const createPayload: CreateCustomerRequest = {
          name: merged.name,
          company: merged.company,
          phone: merged.phone,
          position: merged.position || undefined,
          email: merged.email || undefined,
          budget: merged.budget || undefined,
          intent_level: merged.intent_level || 'Medium',
          notes: merged.notes || undefined,
        };
        await customerService.createCustomer(createPayload);
        showSuccess('客户已创建');
        setCreateSuccessTip('您还可以在客户详情中补充：职位、邮箱、预算、意向、备注等选填项。');
        setTimeout(() => navigate('/customers'), 2000);
      }
    } catch (err) {
      console.error('AI 对话失败:', err);
      setError(handleApiError(err));
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', text: '抱歉，对话暂时出错了，请重试或切换到表单手动填写。' }]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- Voice Recording Logic ---
  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await processAudio(audioBlob);
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingTime(0);

        // Start timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);

      } catch (err) {
        console.error('Error accessing microphone:', err);
        showError('无法访问麦克风，请检查权限设置');
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      showSuccess('录音完成，正在转换...');
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', 'zh');
      const result = await aiService.speechToText(formData);
      setVoiceText(result.text);
    } catch (err) {
      console.error('Error processing audio:', err);
      showError('语音识别失败，请重试');
    }
  };

  const applyVoiceToForm = () => {
    setFormData(prev => ({ ...prev, notes: (prev.notes ? prev.notes + '\n\n' : '') + voiceText }));
    setMode('form');
  };

  /** 将语音识别结果填入 AI 对话输入框，切换到对话模式，用户可编辑后发送 */
  const applyVoiceToChat = () => {
    setInputMessage(voiceText);
    setMode('chat');
    showSuccess('已填入输入框，可编辑后发送给 AI');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('newCustomerTitle')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('newCustomerSubtitle')}</p>
        </div>

        {/* Mode Switcher: 表单 / AI Chat / 录音输入 */}
        <div className="bg-white dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-slate-700 flex flex-wrap gap-1">
          <button
            onClick={() => setMode('form')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center ${mode === 'form' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            <List size={16} className="mr-2" /> {t('modeForm')}
          </button>
          <button
            onClick={() => setMode('chat')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center ${mode === 'chat' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            <MessageSquare size={16} className="mr-2" /> {t('modeChat')}
          </button>
          <button
            onClick={() => setMode('voice')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center ${mode === 'voice' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            <Mic size={16} className="mr-2" /> 录音输入
          </button>
        </div>
      </div>

      {mode === 'form' && (
        <Card>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label={t('customerName')} name="name" value={formData.name} onChange={handleInputChange} placeholder="例如：张三" required />
            <Input label={t('companyName')} name="company" value={formData.company} onChange={handleInputChange} placeholder="例如：科技有限公司" required />

            <Input label={t('position')} name="position" value={formData.position} onChange={handleInputChange} placeholder="例如：CTO" />
            <Input label={t('email')} name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="例如：zhangsan@company.com" />
            <Input label={t('phone')} name="phone" value={formData.phone} onChange={handleInputChange} placeholder="例如：13800138000" required />
            <Input label={t('budgetEstimate')} name="budget" value={formData.budget} onChange={handleInputChange} placeholder="例如：¥50,000" />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('intentLevel')}</label>
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('notes')}</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                placeholder="添加备注信息..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
              ></textarea>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-slate-700">
            <Button variant="outline" onClick={() => navigate('/customers')} disabled={isSubmitting}>{t('cancel')}</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} /> {t('saving')}
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" /> {t('saveCustomer')}
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {mode === 'voice' && (
        <Card>
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">录音后自动识别为文字，可填入表单或继续编辑。</p>
            <button
              onClick={toggleRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse shadow-lg'
                  : 'bg-primary text-white hover:opacity-90 shadow-md'
              }`}
              title={isRecording ? '停止录音' : '开始录音'}
            >
              {isRecording ? <StopCircle size={36} /> : <Mic size={36} />}
            </button>
            {isRecording && (
              <div className="mt-4 flex items-center gap-2 text-sm text-red-500 dark:text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>录音中... {formatTime(recordingTime)}</span>
              </div>
            )}
            {voiceText && !isRecording && (
              <div className="mt-6 w-full max-w-xl">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">识别结果</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{voiceText}</p>
                </div>
                <div className="mt-4 flex justify-center gap-3 flex-wrap">
                  <Button onClick={applyVoiceToChat}>
                    填入 AI 对话
                  </Button>
                  <Button onClick={applyVoiceToForm}>
                    填入表单
                  </Button>
                  <Button variant="outline" onClick={() => setVoiceText('')}>
                    清空并重新录音
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {mode === 'chat' && (
        <Card className="h-[600px] max-h-[calc(100vh-10rem)] flex flex-col p-0 overflow-hidden min-h-0">
          {/* Progress：必填项 姓名、公司、电话 填齐即 100% */}
          <div className="shrink-0 bg-blue-50 dark:bg-blue-900/20 px-6 py-3 border-b border-blue-100 dark:border-blue-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">{t('aiAssistantActive')}</span>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-blue-600 dark:text-blue-400">{chatProgressPercent}% {t('complete')}</span>
              <div className="w-20 h-1.5 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${chatProgressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
          {createSuccessTip && (
            <div className="shrink-0 px-6 py-2 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">
              {createSuccessTip}
            </div>
          )}

          {/* Messages: min-h-0 lets flex child shrink so overflow-y-auto can scroll */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-900/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mx-2 ${msg.role === 'ai' ? 'bg-primary text-white' : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-200'}`}>
                    {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 shadow-sm rounded-tl-none'}`}>
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

          {/* Input: 仅文字输入 + 发送，无录音 */}
          <div className="shrink-0 p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={t('typeAnswer')}
                className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-slate-100"
              />
              <Button onClick={handleSendMessage} disabled={!inputMessage.trim()}>
                <Send size={18} />
              </Button>
            </div>

            <div className="mt-2 flex justify-between items-center">
              <button onClick={() => setMode('form')} className="text-xs text-slate-500 hover:text-primary hover:underline dark:text-slate-400 dark:hover:text-primary">
                {t('switchToManual')}
              </button>
              {chatProgressPercent === 100 && (
                <Button variant="ghost" className="text-xs h-6" onClick={() => setMode('form')}>
                  {t('reviewSave')}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
