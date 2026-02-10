import React, { useState, useRef, useEffect } from 'react';
import {
  X, MessageSquare, Mic, List, FileText, Calendar,
  Send, Bot, User, CheckCircle2, StopCircle, Sparkles, Upload, Loader2
} from 'lucide-react';
import { Button, Input, Badge } from './UI';
import { useLanguage } from '../contexts';
import { ConversationMessage } from '../types';
import { customerService } from '../lib/services/customerService';
import { interactionService, Interaction } from '../lib/services/interactionService';

interface FollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number;
  customerName: string;
  onSave?: () => void; // Callback to refresh parent component
}

interface FollowUpRecord {
  id: string;
  customerId: number;
  date: string;
  type: string;
  content: string;
  nextStep: string;
  createdAt: string;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  onSave
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const [activeMainTab, setActiveMainTab] = useState<'new' | 'history'>('new');
  const [mode, setMode] = useState<'form' | 'chat' | 'voice' | 'import'>('form');

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Call',
    content: '',
    nextStep: ''
  });

  // Chat State
  const [messages, setMessages] = useState<ConversationMessage[]>([
    { id: '1', role: 'ai', text: `Hi! How did the interaction with ${customerName} go?` }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Import State
  const [importText, setImportText] = useState('');
  const [isAnalyzingImport, setIsAnalyzingImport] = useState(false);

  // Common State
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUpHistory, setFollowUpHistory] = useState<Interaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load follow-up history from API (only when we have a valid customerId)
  useEffect(() => {
    if (customerId > 0) {
      loadFollowUpHistory();
    } else {
      setFollowUpHistory([]);
    }
  }, [customerId]);

  useEffect(() => {
    if (activeMainTab === 'new' && mode === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, mode, activeMainTab]);

  const loadFollowUpHistory = async () => {
    if (customerId <= 0) {
      setFollowUpHistory([]);
      return;
    }
    setIsLoadingHistory(true);
    try {
      const interactions = await interactionService.getByCustomerId(customerId);
      setFollowUpHistory(interactions);
    } catch (err) {
      console.error('Failed to load follow-up history:', err);
      setFollowUpHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    if (customerId <= 0) {
      setError('无效的客户，请关闭后重试');
      return;
    }
    if (!formData.content.trim()) {
      setError('请填写互动内容');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Create interaction via API
      await interactionService.create({
        customer_id: customerId,
        type: formData.type.toLowerCase(),
        content: formData.content,
        next_action: formData.nextStep || undefined,
      });

      // Reset and close
      setTimeout(() => {
        setIsSaving(false);
        onClose();
        // Reset states
        setFormData({
          date: new Date().toISOString().split('T')[0],
          type: 'Call',
          content: '',
          nextStep: ''
        });
        setMessages([{ id: '1', role: 'ai', text: `Hi! How did the interaction with ${customerName} go?` }]);
        setVoiceText('');
        setImportText('');

        // Refresh history and trigger parent refresh
        loadFollowUpHistory();
        if (onSave) {
          onSave();
        }
      }, 500);
    } catch (err: any) {
      console.error('Failed to save follow-up:', err);
      setError(err.message || '保存失败，请重试');
      setIsSaving(false);
    }
  };

  // Chat Logic
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: inputMessage }]);
    const userInput = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          text: "Got it. I've noted that down. Any follow-up actions required?"
        }
      ]);

      // Auto-fill content from chat
      setFormData(prev => ({
        ...prev,
        content: userInput + '\n' + prev.content
      }));
    }, 1000);
  };

  // Voice Logic
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setVoiceText("Met with the client. They are concerned about the implementation timeline but happy with the pricing. We agreed to send a revised schedule by Friday.");
    } else {
      setIsRecording(true);
      setVoiceText('');
    }
  };

  const processVoice = () => {
    setIsProcessingVoice(true);
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        content: "Met with the client. Concerned about timeline, happy with pricing.",
        nextStep: "Send revised schedule by Friday."
      }));
      setIsProcessingVoice(false);
      setMode('form');
    }, 1000);
  };

  // Import Logic
  const analyzeImport = () => {
    setIsAnalyzingImport(true);
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        type: 'WeChat',
        content: "Client asked about API limits. Confirmed 10k calls/day is sufficient. Discussed contract duration.",
        nextStep: "Draft 1-year contract."
      }));
      setIsAnalyzingImport(false);
      setMode('form');
    }, 1500);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Call': return 'blue';
      case 'Meeting': return 'green';
      case 'Email': return 'yellow';
      case 'WeChat': return 'purple';
      default: return 'gray';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'Call': return '电话';
      case 'Meeting': return '会议';
      case 'Email': return '邮件';
      case 'WeChat': return '微信';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100 dark:border-slate-700 flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{t('followUpTitle')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('followUpSubtitle')} <span className="font-medium text-primary">{customerName}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&times;</button>
        </div>

        {/* Main Tabs */}
        <div className="flex border-b border-gray-100 dark:border-slate-700">
          <button
            onClick={() => setActiveMainTab('new')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeMainTab === 'new' ? 'text-primary border-b-2 border-primary bg-blue-50/30 dark:bg-blue-900/10' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            {t('tabNewRecord')}
          </button>
          <button
            onClick={() => setActiveMainTab('history')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeMainTab === 'history' ? 'text-primary border-b-2 border-primary bg-blue-50/30 dark:bg-blue-900/10' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            {t('tabHistory')} ({followUpHistory.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-0 bg-slate-50 dark:bg-slate-900">
          {activeMainTab === 'new' ? (
            <div className="flex flex-col h-full">
              {/* Input Mode Switcher */}
              <div className="px-6 py-3 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex gap-2 overflow-x-auto">
                <button onClick={() => setMode('form')} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center whitespace-nowrap transition-colors ${mode === 'form' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <List size={14} className="mr-1.5" /> {t('modeForm')}
                </button>
                <button onClick={() => setMode('chat')} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center whitespace-nowrap transition-colors ${mode === 'chat' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <MessageSquare size={14} className="mr-1.5" /> {t('modeChat')}
                </button>
                <button onClick={() => setMode('voice')} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center whitespace-nowrap transition-colors ${mode === 'voice' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <Mic size={14} className="mr-1.5" /> {t('modeVoice')}
                </button>
                <button onClick={() => setMode('import')} className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center whitespace-nowrap transition-colors ${mode === 'import' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  <FileText size={14} className="mr-1.5" /> {t('modeImport')}
                </button>
              </div>

              <div className="flex-1 p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {mode === 'form' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label={t('interactionDate')}
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('interactionType')}</label>
                        <select
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                          <option value="Call">{t('typeCall')}</option>
                          <option value="Meeting">{t('typeMeeting')}</option>
                          <option value="Email">{t('typeEmail')}</option>
                          <option value="WeChat">{t('typeWeChat')}</option>
                          <option value="Other">{t('typeOther')}</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('interactionContent')}</label>
                      <textarea
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
                        rows={5}
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="记录互动内容..."
                      ></textarea>
                    </div>
                    <Input
                      label={t('nextStep')}
                      value={formData.nextStep}
                      onChange={(e) => setFormData({ ...formData, nextStep: e.target.value })}
                      placeholder="下一步计划..."
                    />
                  </div>
                )}

                {mode === 'chat' && (
                  <div className="flex flex-col h-[350px]">
                    <div className="flex-1 overflow-y-auto space-y-4 p-2">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex items-start max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
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
                        <div className="flex justify-start ml-12">
                          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl rounded-tl-none border border-gray-200 dark:border-slate-700 shadow-sm">
                            <div className="flex space-x-1">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex gap-2">
                      <input
                        className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-100"
                        placeholder={t('typeAnswer')}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage} disabled={!inputMessage.trim()}><Send size={18} /></Button>
                    </div>
                  </div>
                )}

                {mode === 'voice' && (
                  <div className="flex flex-col items-center justify-center h-[350px] text-center">
                    <div
                      onClick={toggleRecording}
                      className={`w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${isRecording ? 'bg-red-500 shadow-lg shadow-red-200 animate-pulse' : 'bg-primary hover:bg-primary-hover shadow-lg shadow-blue-200'}`}
                    >
                      {isRecording ? <StopCircle size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
                    </div>
                    <p className="mt-4 text-lg font-medium text-slate-800 dark:text-slate-100">
                      {isRecording ? t('listening') : t('startRecording')}
                    </p>

                    {voiceText && (
                      <div className="mt-6 w-full max-w-md bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 text-left shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">{t('transcription')}</p>
                        <p className="text-slate-700 dark:text-slate-200 text-sm">{voiceText}</p>
                      </div>
                    )}

                    {voiceText && !isRecording && (
                      <Button onClick={processVoice} disabled={isProcessingVoice} className="mt-4">
                        {isProcessingVoice ? <Sparkles size={16} className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
                        {t('processVoice')}
                      </Button>
                    )}
                  </div>
                )}

                {mode === 'import' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('uploadLogFile')}</label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-primary hover:bg-blue-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                        <Upload className="mx-auto h-8 w-8 text-slate-400" />
                        <span className="mt-2 block text-xs text-slate-500">{t('clickToUpload')}</span>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-50 dark:bg-slate-900 px-2 text-slate-500">Or Paste Text</span>
                      </div>
                    </div>

                    <textarea
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
                      rows={6}
                      placeholder={t('pasteLogPlaceholder')}
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                    ></textarea>

                    <div className="flex justify-end">
                      <Button onClick={analyzeImport} disabled={!importText && !isAnalyzingImport}>
                        {isAnalyzingImport ? (
                          <>
                            <Sparkles size={16} className="animate-spin mr-2" /> {t('analyzingLog')}
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} className="mr-2" /> {t('importProcess')}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions for Form Mode */}
              <div className="px-6 py-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>{t('cancel')}</Button>
                {mode === 'form' && (
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={16} /> {t('saving')}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} className="mr-2" /> {t('saveFollowUp')}
                      </>
                    )}
                  </Button>
                )}
                {mode !== 'form' && (
                  <div className="text-xs text-slate-400 flex items-center">
                    {t('switchToManual')}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // History Tab Content - Real data from API
            <div className="p-6 space-y-4">
              {isLoadingHistory ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                  <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                  加载中...
                </div>
              ) : followUpHistory.length > 0 ? (
                followUpHistory.map((record) => (
                  <div key={record.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm relative">
                    <div className="absolute top-4 right-4 text-xs text-slate-400">
                      {new Date(record.created_at).toLocaleDateString('zh-CN')}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge color={getTypeColor(record.type)}>
                        {getTypeLabel(record.type)}
                      </Badge>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">跟进记录</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                      {record.content}
                    </p>
                    {record.next_action && (
                      <div className="mt-3 pt-3 border-t border-gray-50 dark:border-slate-700 flex gap-2 text-xs text-slate-500">
                        <span className="font-medium">Next:</span> {record.next_action}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  暂无跟进记录
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
