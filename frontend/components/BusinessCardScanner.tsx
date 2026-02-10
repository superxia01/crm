import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, X, FileText } from 'lucide-react';
import { aiService } from '../lib/services/aiService';
import { useToast } from '../contexts';

interface BusinessCardScannerProps {
  onScanned: (data: BusinessCardData) => void;
}

export interface BusinessCardData {
  name?: string;
  company?: string;
  position?: string;
  phone?: string;
  email?: string;
  address?: string;
  confidence?: number;
}

export const BusinessCardScanner: React.FC<BusinessCardScannerProps> = ({ onScanned }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      showError('请选择图片文件');
      return;
    }

    // 检查文件大小（最大 10MB）
    if (file.size > 10 * 1024 * 1024) {
      showError('图片大小不能超过 10MB');
      return;
    }

    setSelectedFile(file);

    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!selectedFile) return;

    setIsScanning(true);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const result = await aiService.ocrBusinessCard(formData);

      showSuccess('名片识别成功！');
      onScanned(result);

      // 清空选择
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('OCR failed:', error);
      const errorMsg = error?.response?.data?.message || error?.message || '名片识别失败，请重试';
      showError(errorMsg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openCamera = () => {
    // 移动端可以调用相机
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 文件上传按钮 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
          className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload size={24} className="text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isScanning ? '识别中...' : '上传图片'}
          </span>
        </button>

        {/* 相机按钮 */}
        <button
          onClick={openCamera}
          disabled={isScanning}
          className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Camera size={24} className="text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            拍照识别
          </span>
        </button>
      </div>

      {/* 图片预览 */}
      {previewUrl && (
        <div className="relative">
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-32 h-20 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                {selectedFile?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {selectedFile && (selectedFile.size / 1024).toFixed(1)} KB
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs rounded hover:bg-primary-hover disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      识别中...
                    </>
                  ) : (
                    <>
                      <FileText size={14} />
                      开始识别
                    </>
                  )}
                </button>
                <button
                  onClick={handleClear}
                  disabled={isScanning}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-slate-600 text-xs rounded hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  <X size={14} />
                  清除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        // 移动端支持相机
        capture="environment"
      />

      {/* 提示信息 */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 支持格式：JPG、PNG、WEBP（最大 10MB）
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          📱 移动端点击"拍照识别"可直接调用相机
        </p>
      </div>
    </div>
  );
};
