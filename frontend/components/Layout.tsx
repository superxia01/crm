import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, MessageSquareText, Search, Bell, Menu, Moon, Sun, Globe, LogOut, ChevronDown, User } from 'lucide-react';
import { useTheme, useLanguage, useAuth } from '../contexts';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, logout, customTitle } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: t('dashboard'), path: '/', icon: LayoutDashboard },
    { label: t('customers'), path: '/customers', icon: Users },
    { label: t('scriptAssistant'), path: '/scripts', icon: MessageSquareText },
    { label: t('knowledgeBase'), path: '/knowledge', icon: BookOpen },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 hidden md:flex flex-col">
        <div className="p-6 flex items-center space-x-2 border-b border-gray-100 dark:border-slate-700">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
             <span className="text-white font-bold">AI</span>
          </div>
          <span className="text-xl font-bold text-slate-800 dark:text-slate-100">NextCRM</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-primary font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-slate-700">
          <div
            ref={userMenuRef}
            className="relative"
          >
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 px-2 w-full hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors py-2"
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300 font-medium overflow-hidden shrink-0">
                {(user as any)?.avatarUrl ? (
                  <img src={(user as any).avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  getUserInitials()
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {(user as any)?.nickname || (user as any)?.name || user?.name || 'Demo User'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {customTitle || (user as any)?.role || t('salesManager')}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* 个人中心 Dropdown */}
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">个人中心</p>
                </div>
                <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {(user as any)?.nickname || (user as any)?.name || user?.name}
                  </p>
                  {(user as any)?.email && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {(user as any).email}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <User size={16} />
                  进入个人中心
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={16} />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-8">
          <button className="md:hidden p-2 text-slate-600 dark:text-slate-400">
            <Menu size={24} />
          </button>
          
          <div className="flex-1 max-w-xl mx-auto hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input 
                type="text" 
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-slate-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
             {/* Language Switcher */}
             <button 
              onClick={toggleLanguage}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center space-x-1"
              title="Switch Language"
            >
              <Globe size={20} />
              <span className="text-sm font-medium uppercase">{language}</span>
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8 bg-gray-50 dark:bg-slate-900 transition-colors">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
