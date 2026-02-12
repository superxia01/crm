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
    wechat_id: '',
    budget: '',
    intent_level: 'Medium',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat State（真 AI：豆包）
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'ai'; text: string }>>([
    { id: '1', role: 'ai', text: '你好！我可以帮你快速录入客户信息。请告诉我客户的姓名、公司和联系方式（电话/邮箱/微信号任选其一），我会引导你完成信息收集。' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatStatus, setChatStatus] = useState<'collecting' | 'ready_for_confirmation'>('collecting');
  const [customerSummary, setCustomerSummary] = useState<string | null>(null); // AI 生成的信息总结
  const [isCreatingFromChat, setIsCreatingFromChat] = useState(false);

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
      await customerService.createCustomer(formData);
      showSuccess('客户创建成功！');
      navigate('/customers');
    } catch (err) {
      console.error('Failed to create customer:', err);
      setError(handleApiError(err));
      setIsSubmitting(false);
    }
  };

  // --- Chat Logic：对接豆包，引导用户收集信息，最后给出总结等待确认 ---
  const handleSendMessage = async () => {
    const text = inputMessage.trim();
    if (!text) return;

    const userMsg = { id: Date.now().toString(), role: 'user' as const, text };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);
    setError(null);

    try {
      const apiMessages = messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user' as const, content: m.text }));
      apiMessages.push({ role: 'user' as const, content: text });

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

      const res = await aiService.customerIntakeChat({
        messages: apiMessages,
        current_fields: currentFields,
      });

      // 更新状态
      setChatStatus(res.status);
      setCustomerSummary(res.summary || null);

      // 更新消息
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', text: res.reply }]);

      // 更新表单数据
      const merged = { ...formData, ...res.extracted_fields };
      if (merged.intent_level === '') merged.intent_level = 'Medium';
      setFormData(merged);
    } catch (err) {
      console.error('AI 对话失败:', err);
      setError(handleApiError(err));
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', text: '抱歉，对话暂时出错了，请重试或切换到表单手动填写。' }]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- 确认并创建客户 ---
  const handleConfirmAndCreate = async () => {
    setIsCreatingFromChat(true);
    setError(null);

    try {
      const createPayload: CreateCustomerRequest = {
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        position: formData.position || undefined,
        email: formData.email || undefined,
        budget: formData.budget || undefined,
        intent_level: formData.intent_level || 'Medium',
        notes: formData.notes || undefined,
      };

      await customerService.createCustomer(createPayload);
      showSuccess('客户创建成功！');
      setTimeout(() => navigate('/customers'), 1500);
    } catch (err) {
      console.error('创建客户失败:', err);
      setError(handleApiError(err));
    } finally {
      setIsCreatingFromChat(false);
    }
  };

  // --- 继续编辑（用户想修改信息）---
  const handleContinueEditing = () => {
    setChatStatus('collecting');
    setCustomerSummary(null);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'ai',
      text: `好的，你可以：

📝 补充信息：如"补充一下职位是CTO"、"邮箱是zhangsan@abc.com"

✏️ 修改信息：如"把姓名改成李四"、"电话错了，应该是13900139000"

💡 快速完成：如果信息没问题，你可以点击「确认创建」按钮

请告诉我你需要修改或补充的内容。`
    }]);
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
            <Input label={t('phone')} name="phone" value={formData.phone} onChange={handleInputChange} placeholder="例如：13800138000" />
            <Input label="微信号" name="wechat_id" value={formData.wechat_id || ''} onChange={handleInputChange} placeholder="例如：abc123" />
            <Input label={t('budgetEstimate')} name="budget" value={formData.budget} onChange={handleInputChange} placeholder="例如：¥50,000" />

            <div className="md:col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                * 联系方式至少填写一种（电话/邮箱/微信号）
              </p>
            </div>

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
        <Card className="h-[650px] max-h-[calc(100vh-10rem)] flex flex-col p-0 overflow-hidden min-h-0">
          {/* Header: AI 状态指示 */}
          <div className="shrink-0 bg-blue-50 dark:bg-blue-900/20 px-6 py-3 border-b border-blue-100 dark:border-blue-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot size={16} className="text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                {chatStatus === 'collecting' ? '收集中' : '等待确认'}
              </span>
            </div>
            <button onClick={() => setMode('form')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              切换到表单
            </button>
          </div>

          {/* Messages: min-h-0 lets flex child shrink so overflow-y-auto can scroll */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-900/50">
            {messages.map((msg) => (
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

          {/* 总结和确认区域 */}
          {chatStatus === 'ready_for_confirmation' && customerSummary && (
            <div className="shrink-0 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-t border-blue-200 dark:border-blue-800">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-blue-100 dark:border-blue-800">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle2 size={18} className="text-green-500" />
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">信息收集完成</span>
                </div>
                <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono bg-slate-50 dark:bg-slate-900 p-3 rounded mb-4">
                  {customerSummary}
                </pre>
                <div className="flex gap-2">
                  <Button
                    onClick={handleConfirmAndCreate}
                    disabled={isCreatingFromChat}
                    className="flex-1"
                  >
                    {isCreatingFromChat ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={18} /> 创建中...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} className="mr-2" /> 确认创建
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleContinueEditing}
                    disabled={isCreatingFromChat}
                  >
                    继续编辑
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Input: 仅在收集中状态显示 */}
          {chatStatus === 'collecting' && (
            <div className="shrink-0 p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="输入客户信息..."
                  disabled={isTyping}
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900 dark:text-slate-100 disabled:opacity-50"
                />
                <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isTyping}>
                  <Send size={18} />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
