import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../../components/UI';
import { useAuth } from '../../contexts';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('缺少登录凭证，请重新登录');
      setTimeout(() => {
        navigate('/login?error=missing_token', { replace: true });
      }, 3000);
      return;
    }

    // Call backend to verify token and get user info
    fetch('/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          // Store token and user info using correct keys
          localStorage.setItem('nextcrm_token', token);
          localStorage.setItem('nextcrm_user', JSON.stringify(data.data));

          setStatus('success');
          setMessage('登录成功，正在跳转...');

          // Redirect to dashboard after a short delay
          // Use window.location.href to force page reload and reinitialize AuthContext
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        } else {
          throw new Error('认证失败');
        }
      })
      .catch((err) => {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage('登录验证失败，请重试');
        setTimeout(() => {
          navigate('/login?error=auth_failed', { replace: true });
        }, 3000);
      });
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="p-8 shadow-xl border-0 text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                正在登录...
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                请稍候，我们正在验证您的身份
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                登录成功！
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {message}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                登录失败
              </h2>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                {message}
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
              >
                返回登录
              </button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AuthCallback;
