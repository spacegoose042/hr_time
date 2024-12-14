import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from '@/theme';
import Layout from './components/Layout';

// Temporary placeholder components
const Login = () => <div>Login</div>;
const TimeClock = () => <div>TimeClock</div>;
const TimeEntries = () => <div>TimeEntries</div>;
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
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
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
