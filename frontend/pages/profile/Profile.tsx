import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, LogOut, ArrowLeft } from 'lucide-react';
import { Card, Button, Input } from '../../components/UI';
import { useAuth, useToast, useLanguage } from '../../contexts';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, customTitle, setCustomTitle } = useAuth();
  const { showSuccess } = useToast();
  const { t } = useLanguage();
  const [titleInput, setTitleInput] = useState(customTitle || (user as any)?.role || '');
  const [titleSaved, setTitleSaved] = useState(false);

  const displayName = (user as any)?.nickname || (user as any)?.name || 'Demo User';
  const email = (user as any)?.email || '';
  const phone = (user as any)?.phoneNumber || '';
  const avatarUrl = (user as any)?.avatarUrl || '';
  const roleFromApi = (user as any)?.role || '';

  const handleSaveTitle = () => {
    setCustomTitle(titleInput.trim());
    setTitleSaved(true);
    showSuccess(t('positionSaved') + (titleInput.trim() || t('defaultRole')));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          aria-label={t('back')}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('personalCenter')}</h1>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center overflow-hidden shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-slate-500 dark:text-slate-400" />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('nickname')}</p>
              <p className="text-lg font-medium text-slate-900 dark:text-slate-100">{displayName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('positionRole')}</p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mb-2">
                {t('roleDisplayHint')}
              </p>
              <div className="flex gap-2 items-start">
                <div className="flex-1 min-w-0">
                  <Input
                    value={titleInput}
                    onChange={(e) => { setTitleInput(e.target.value); setTitleSaved(false); }}
                    placeholder={roleFromApi || t('roleExample')}
                  />
                </div>
                <Button onClick={handleSaveTitle} disabled={titleSaved && titleInput.trim() === customTitle}>
                  {titleSaved ? t('saved') : t('saveCustomer')}
                </Button>
              </div>
            </div>
            {email && (
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-slate-400 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">{email}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-2">
                <Phone size={18} className="text-slate-400 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">{phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut size={18} />
            {t('logoutLogin')}
          </Button>
        </div>
      </Card>
    </div>
  );
};
