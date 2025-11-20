import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import PageDetail from './pages/PageDetail';
import CompanyList from './pages/crm/CompanyList';
import CompanyDetail from './pages/crm/CompanyDetail';
import ContactList from './pages/crm/ContactList';
import TaskBoard from './pages/tasks/TaskBoard';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<div className="p-12 text-gray-500">Select a page to start writing</div>} />
        <Route path="pages/:id" element={<PageDetail />} />
        <Route path="crm/companies" element={<CompanyList />} />
        <Route path="crm/companies/:id" element={<CompanyDetail />} />
        <Route path="crm/contacts" element={<ContactList />} />
        <Route path="tasks" element={<TaskBoard />} />
      </Route>
    </Routes>
  );
}

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
