import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import PageDetail from './pages/PageDetail';
import CompanyList from './pages/crm/CompanyList';
import CompanyDetail from './pages/crm/CompanyDetail';
import CompanyForm from './pages/crm/CompanyForm';
import ContactList from './pages/crm/ContactList';
import ContractDetail from './pages/crm/ContractDetail';
import ContractForm from './pages/crm/ContractForm';
import MeetingDetail from './pages/crm/MeetingDetail';
import MeetingForm from './pages/crm/MeetingForm';
import TaskBoard from './pages/tasks/TaskBoard';
import DocumentManager from './pages/documents/DocumentManager';
import MeetingTemplates from './pages/crm/MeetingTemplates';

import DatabaseView from './components/database/DatabaseView';
import SharedView from './pages/guest/SharedView';
import Home from './pages/Home';

import Profile from './pages/Profile';
import GoogleCallback from './pages/GoogleCallback';

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
      <Route path="/shared/:token" element={<SharedView />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Home />} />
        <Route path="pages/:id" element={<PageDetail />} />
        <Route path="crm/companies" element={<CompanyList />} />
        <Route path="crm/companies/new" element={<CompanyForm />} />
        <Route path="crm/companies/:id" element={<CompanyDetail />} />
        <Route path="crm/companies/:id/edit" element={<CompanyForm />} />
        <Route path="crm/contacts" element={<ContactList />} />
        <Route path="crm/contracts/new" element={<ContractForm />} />
        <Route path="crm/contracts/:id" element={<ContractDetail />} />
        <Route path="crm/contracts/:id/edit" element={<ContractForm />} />
        <Route path="crm/meetings/new" element={<MeetingForm />} />
        <Route path="crm/meetings/:id" element={<MeetingDetail />} />
        <Route path="crm/meetings/:id/edit" element={<MeetingForm />} />
        <Route path="tasks" element={<TaskBoard />} />
        <Route path="documents" element={<DocumentManager />} />
        <Route path="meeting-templates" element={<MeetingTemplates />} />
        <Route path="databases/:id" element={<DatabaseView />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="/google/callback" element={
        <ProtectedRoute>
          <GoogleCallback />
        </ProtectedRoute>
      } />
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
