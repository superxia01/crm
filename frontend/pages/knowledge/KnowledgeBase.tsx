import React, { useState, useEffect } from 'react';
import { Search, UploadCloud, FileText, Tag, Trash2, Eye, Filter, CheckCircle2, Loader2, Plus } from 'lucide-react';
import { Card, Button, Badge, Modal, Input } from '../../components/UI';
import { knowledgeService, Knowledge } from '../../lib/services/knowledgeService';
import { CreateKnowledgeRequest } from '../../lib/services/knowledgeService';
import { useLanguage } from '../../contexts';
import { handleApiError } from '../../lib/apiClient';

export const KnowledgeBase: React.FC = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState<'select' | 'processing' | 'done'>('select');
  const [knowledges, setKnowledges] = useState<Knowledge[]>([]);
  const [searchResults, setSearchResults] = useState<Knowledge[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchingAi, setIsSearchingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState<CreateKnowledgeRequest>({
    title: '',
    content: '',
    type: 'sales_script',
    tags: [],
    description: '',
  });

  useEffect(() => {
    loadKnowledge();
  }, []);

  const loadKnowledge = async () => {
    try {
      setIsLoading(true);
      const response = await knowledgeService.listKnowledge({ page: 1, per_page: 50 });
      setKnowledges(response.knowledges);
    } catch (err) {
      console.error('Failed to load knowledge:', err);
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }

    setIsSearchingAi(true);
    try {
      const results = await knowledgeService.searchKnowledge({
        query: searchTerm,
        limit: 10,
      });
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
      setError(handleApiError(err));
    } finally {
      setIsSearchingAi(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.title || !uploadForm.content) {
      setError('请填写标题和内容');
      return;
    }

    setUploadStep('processing');
    try {
      await knowledgeService.createKnowledge(uploadForm);
      setUploadStep('done');
      await loadKnowledge();

      // Reset after delay
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadStep('select');
        setUploadForm({
          title: '',
          content: '',
          type: 'sales_script',
          tags: [],
          description: '',
        });
      }, 1500);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(handleApiError(err));
      setUploadStep('select');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此知识条目吗？')) return;

    try {
      await knowledgeService.deleteKnowledge(id);
      loadKnowledge();
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const displayItems = searchResults.length > 0 ? searchResults : knowledges;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('kbTitle')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('kbSubtitle')}</p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)}>
          <UploadCloud size={18} className="mr-2" />
          {t('uploadAnalyze')}
        </Button>
      </div>

      <Card className="p-0 overflow-hidden min-h-[500px]">
        {/* Search Bar */}
        <div className="p-6 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
          <div className="max-w-2xl mx-auto">
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('aiSemanticSearch')}</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('searchKbPlaceholder')}
                  className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearchingAi}>
                {isSearchingAi ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} /> 搜索中...
                  </>
                ) : (
                  '搜索'
                )}
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 text-sm text-slate-300">
                找到 {searchResults.length} 个相关结果
                <button
                  onClick={() => { setSearchResults([]); setSearchTerm(''); }}
                  className="ml-2 text-primary hover:underline"
                >
                  清除搜索
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex gap-4 overflow-x-auto">
          <button className="flex items-center text-sm font-medium text-primary bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full">{t('allTypes')}</button>
          <button className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-full">销售话术</button>
          <button className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-full">产品信息</button>
          <button className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-full">案例研究</button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {displayItems.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge color="blue">{item.type}</Badge>
                        <span className="text-slate-300">|</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">添加于: {new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                      {item.description && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {item.tags.map(tag => (
                          <div key={tag} className="flex items-center text-xs text-slate-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                            <Tag size={10} className="mr-1" /> {tag}
                          </div>
                        ))}
                        {item.tags.length === 0 && (
                          <span className="text-xs text-slate-400">无标签</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" className="h-8 px-3 text-xs">查看</Button>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {displayItems.length === 0 && (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500">
                {searchResults.length > 0 ? '没有找到相关知识条目' : t('noItems')}
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={t('uploadTitle')}
        footer={uploadStep === 'select' ? (
          <Button onClick={handleUpload}>
            <UploadCloud size={16} className="mr-2" /> {t('uploadProcess')}
          </Button>
        ) : null}
      >
        {uploadStep === 'select' ? (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            <Input
              label={t('docTitle')}
              placeholder="例如：Q3 销售手册"
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('docType')}</label>
              <select
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
                value={uploadForm.type}
                onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
              >
                <option value="sales_script">销售话术</option>
                <option value="product_info">产品信息</option>
                <option value="case_study">案例研究</option>
                <option value="best_practice">最佳实践</option>
                <option value="faq">常见问题</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">内容</label>
              <textarea
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-slate-900 dark:text-slate-100"
                rows={6}
                placeholder="输入知识内容..."
                value={uploadForm.content}
                onChange={(e) => setUploadForm({ ...uploadForm, content: e.target.value })}
              ></textarea>
            </div>
            <Input
              label="描述（可选）"
              placeholder="简短描述此知识条目"
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
            />
            <Input
              label="标签（逗号分隔）"
              placeholder="销售, Q3, 策略"
              value={uploadForm.tags.join(', ')}
              onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
            />
          </div>
        ) : uploadStep === 'processing' ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-100">{t('processing')}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('processingDesc')}</p>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-100">{t('uploadComplete')}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('uploadCompleteDesc')}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
