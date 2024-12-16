import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { theme } from '@/theme';
import Layout from './components/Layout';
import TimeClock from './pages/TimeClock';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuditLogs from './pages/admin/AuditLogs';

// Temporary placeholder components
const Login = () => <div>Login</div>;
const TimeEntries = () => <div>TimeEntries</div>;
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route element={<Layout />}>
              <Route path="/" element={
                <PrivateRoute>
                  <TimeClock />
                </PrivateRoute>
              } />
              <Route path="/entries" element={
                <PrivateRoute>
                  <TimeEntries />
                </PrivateRoute>
              } />
            </Route>
            <Route path="/admin/audit-logs" element={
              <PrivateRoute>
                <AuditLogs />
              </PrivateRoute>
            } />
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
