import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Button } from '../../components/UI';
import { MessageCircle, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  const handleWechatLogin = () => {
    // Redirect to backend WeChat login endpoint
    window.location.href = '/api/v1/auth/wechat/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl font-bold text-white">N</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            欢迎回来
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            登录到 NextCRM 智能客户管理系统
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 shadow-xl border-0">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm mb-6">
              <AlertCircle size={16} />
              <span>
                {error === 'missing_token' && '缺少登录凭证，请重新登录'}
                {error === 'auth_failed' && '登录验证失败，请重试'}
                {!error.includes('missing_token') && !error.includes('auth_failed') && '登录失败，请重试'}
              </span>
            </div>
          )}

          {/* WeChat Login Button */}
          <div className="space-y-4">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
              使用微信账号登录 NextCRM 智能客户管理系统
            </p>
            <Button
              type="button"
              onClick={handleWechatLogin}
              className="w-full py-3 text-base font-medium flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white border-0 shadow-lg"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 4.015-1.98 5.94-1.838-.576-3.583-4.196-6.153-8.597-6.153zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.179c0-.651.52-1.18 1.162-1.18zm11.188 1.554c-2.476 0-4.482 2.005-4.482 4.482s2.006 4.483 4.482 4.483c.72 0 1.398-.17 2.004-.468l.095.092 1.41 1.375a.29.29 0 0 0 .406 0 .288.288 0 0 0 .001-.407l-1.415-1.38a4.3 4.3 0 0 0 .468-2.003c0-2.477-2.005-4.482-4.482-4.482zm0 7.23a2.755 2.755 0 0 1-2.752-2.748 2.755 2.755 0 0 1 2.752-2.75 2.755 2.755 0 0 1 2.752 2.75 2.755 2.755 0 0 1-2.752 2.748z"/>
              </svg>
              <MessageCircle size={20} />
              微信登录
            </Button>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          登录即表示您同意我们的{' '}
          <a href="#" className="text-blue-600 hover:underline">服务条款</a>
          {' '}和{' '}
          <a href="#" className="text-blue-600 hover:underline">隐私政策</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
