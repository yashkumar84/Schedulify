import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/LoginPage';
import ForgotPasswordPage from './features/auth/ForgotPasswordPage';
import DashboardPage from './features/dashboard/DashboardPage';
import ProjectListPage from './features/projects/ProjectListPage';
import ProjectDetailPage from './features/projects/ProjectDetailPage';
import KanbanBoard from './features/tasks/KanbanBoard';
import TeamPage from './features/team/TeamPage';
import ExpensesPage from './features/finance/ExpensesPage';
import ProfilePage from './features/profile/ProfilePage';
import Layout from './features/dashboard/Layout';
import { useAuthStore } from './store/authStore';

const App: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/dashboard" element={
          isAuthenticated ? (
            <Layout>
              <DashboardPage />
            </Layout>
          ) : <Navigate to="/login" />
        } />
        <Route path="/projects" element={
          isAuthenticated ? (
            <Layout>
              <ProjectListPage />
            </Layout>
          ) : <Navigate to="/login" />
        } />
        <Route path="/projects/:id" element={
          isAuthenticated ? (
            <Layout>
              <ProjectDetailPage />
            </Layout>
          ) : <Navigate to="/login" />
        } />
        <Route path="/tasks" element={
          isAuthenticated ? (
            <Layout>
              <KanbanBoard />
            </Layout>
          ) : <Navigate to="/login" />
        } />
        <Route path="/expenses" element={
          isAuthenticated ? (
            <Layout>
              <ExpensesPage />
            </Layout>
          ) : <Navigate to="/login" />
        } />
        <Route path="/team" element={
          isAuthenticated ? (
            <Layout>
              <TeamPage />
            </Layout>
          ) : <Navigate to="/login" />
        } />
        <Route path="/profile" element={
          isAuthenticated ? (
            <Layout>
              <ProfilePage />
            </Layout>
          ) : <Navigate to="/login" />
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

export default App;
