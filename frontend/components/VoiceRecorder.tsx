import React, { useState, useRef } from 'react';
import { Mic, StopCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { aiService } from '../lib/services/aiService';

interface VoiceRecorderProps {
  onTranscriptComplete: (text: string) => void;
  onError?: (error: string) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptComplete,
  onError
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      // 创建 MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: 'audio/webm;codecs=opus'
        });
        chunksRef.current = [];

        setIsProcessing(true);

        try {
          // 发送到后端进行语音识别
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          formData.append('language', 'zh');

          const result = await aiService.speechToText(formData);

          setTranscript(result.text);
          onTranscriptComplete(result.text);

          // 3秒后清除结果
          setTimeout(() => setTranscript(''), 3000);
        } catch (error: any) {
          console.error('Speech recognition failed:', error);
          const errorMsg = error?.response?.data?.message || error?.message || '语音识别失败，请重试';
          onError?.(errorMsg);
        } finally {
          setIsProcessing(false);
          setRecordingTime(0);
        }

        // 停止所有音频轨道
        stream.getTracks().forEach(track => track.stop());
      };

      // 开始录音
      mediaRecorder.start(1000); // 每秒触发一次 dataavailable
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // 开始计时
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error: any) {
      console.error('Failed to start recording:', error);
      if (error.name === 'NotAllowedError') {
        onError?.('无法访问麦克风，请在浏览器设置中允许麦克风权限');
      } else if (error.name === 'NotFoundError') {
        onError?.('未检测到麦克风设备');
      } else {
        onError?.('启动录音失败：' + error.message);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-3">
      {/* 录音控制 */}
      <div className="flex items-center gap-3">
        {!isRecording && !isProcessing && (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-sm hover:shadow-md"
          >
            <Mic size={18} />
            开始录音
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors animate-pulse shadow-lg"
          >
            <StopCircle size={18} />
            停止录音 ({formatTime(recordingTime)})
          </button>
        )}

        {isProcessing && (
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
          >
            <Loader2 className="animate-spin" size={18} />
            识别中...
          </button>
        )}
      </div>

      {/* 识别结果 */}
      {transcript && (
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded"></div>
          <div className="ml-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                  识别结果：
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                  {transcript}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 提示信息 */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        💡 点击"开始录音"按钮，说话完成后点击"停止录音"进行识别
      </p>
    </div>
  );
};
