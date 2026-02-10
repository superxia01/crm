import React, { useState, useRef } from 'react';
import {
  Upload, Download, FileText, X, CheckCircle2, AlertCircle,
  Loader2, FileSpreadsheet, AlertTriangle
} from 'lucide-react';
import { Button, Modal } from './UI';
import { importExportService, ImportResult } from '../lib/services/importExportService';
import { useToast } from '../contexts';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { showSuccess, showError, showInfo } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showError('请选择文件');
      return;
    }

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    // Check file extension
    const fileName = file.name.toLowerCase();
    const isValidFile = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');

    if (!isValidFile) {
      showError('不支持的文件格式，请上传 Excel (.xlsx, .xls) 或 CSV 文件');
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      const importResult = await importExportService.importCustomers(file);
      setResult(importResult);

      if (importResult.imported > 0) {
        showSuccess(`导入完成！成功 ${importResult.imported} 条，失败 ${importResult.failed} 条`);
      } else if (importResult.failed > 0) {
        showError(`导入失败 ${importResult.failed} 条，请检查文件格式`);
      }

      // Trigger refresh after a delay
      if (importResult.imported > 0 && onSuccess) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      showError(error.message || '导入失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setResult(null);
      onClose();
    }
  };

  const handleDownloadTemplate = async (format: 'xlsx' | 'csv') => {
    try {
      await importExportService.downloadTemplate(format);
      showSuccess(`模板下载成功（${format.toUpperCase()}）`);
    } catch (error: any) {
      console.error('Template download error:', error);
      showError('模板下载失败');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="批量导入客户">
      <div className="space-y-6">
        {/* File Upload Area */}
        {!file ? (
          <div>
            <div
              className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-primary hover:bg-blue-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                点击上传或拖拽文件到此处
              </p>
              <p className="text-xs text-slate-500">
                支持 Excel (.xlsx, .xls) 或 CSV 文件
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="text-blue-600 dark:text-blue-400" size={20} />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setResult(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Template Download */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            没有数据？先下载导入模板：
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadTemplate('xlsx')}
              className="flex-1"
            >
              <Download size={14} className="mr-2" />
              Excel 模板
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadTemplate('csv')}
              className="flex-1"
            >
              <FileText size={14} className="mr-2" />
              CSV 模板
            </Button>
          </div>
        </div>

        {/* Import Result */}
        {result && (
          <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 dark:text-white">导入结果</h3>
              <div className="text-sm text-slate-500">
                共 {result.total} 条数据
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.imported}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  成功
                </div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {result.failed}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  失败
                </div>
              </div>
            </div>

            {result.errors && result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  失败详情：
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((error, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-xs p-2 bg-red-50 dark:bg-red-900/20 rounded"
                    >
                      <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">第 {error.row} 行: {error.name}</span>
                        <p className="text-red-600 dark:text-red-400 mt-0.5">
                          {error.error}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                导入中...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                开始导入
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
