import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CustomerList } from './pages/customers/CustomerList';
import { CustomerDetail } from './pages/customers/CustomerDetail';
import { CustomerEdit } from './pages/customers/CustomerEdit';
import { NewCustomer } from './pages/customers/NewCustomer';
import { ArchivedCustomers } from './pages/customers/ArchivedCustomers';
import { ScriptAssistant } from './pages/scripts/ScriptAssistant';
import { KnowledgeBase } from './pages/knowledge/KnowledgeBase';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Activities } from './pages/Activities';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { AuthCallback } from './pages/auth/Callback';
import { Profile } from './pages/profile/Profile';
import { DealList } from './pages/deals/DealList';
import { DealForm } from './pages/deals/DealForm';
import { AuthProvider, ThemeProvider, LanguageProvider, ToastProvider } from './contexts';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <Routes>
                {/* Public routes - no Layout */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Protected routes - with Layout */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/activities" element={<Activities />} />
                          <Route path="/customers" element={<CustomerList />} />
                          <Route path="/customers/new" element={<NewCustomer />} />
                          <Route path="/customers/:id" element={<CustomerDetail />} />
                          <Route path="/customers/:id/edit" element={<CustomerEdit />} />
                          <Route path="/customers/archived" element={<ArchivedCustomers />} />
                          <Route path="/deals" element={<DealList />} />
                          <Route path="/deals/new" element={<DealForm />} />
                          <Route path="/deals/:id/edit" element={<DealForm />} />
                          <Route path="/scripts" element={<ScriptAssistant />} />
                          <Route path="/knowledge" element={<KnowledgeBase />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/knowledge/upload" element={<Navigate to="/knowledge" replace />} />

                          {/* Catch all - redirect to dashboard */}
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
