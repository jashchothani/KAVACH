import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { AppThemeProvider } from './context/ThemeContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { PublicLayout } from './layouts/PublicLayout';

// Public Pages
import { Home } from './pages/public/Home';
import { About } from './pages/public/About';
import { DownloadPage } from './pages/public/Download';
import { Contact } from './pages/public/Contact';
import { GetStarted } from './pages/public/GetStarted';
import { Showcase } from './pages/public/Showcase';

// Dashboard Protected Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ThreatDetection } from './pages/ThreatDetection';
import { MitreAttack } from './pages/MitreAttack';
import { SoarCenter } from './pages/SoarCenter';
import { IncidentManagement } from './pages/IncidentManagement';
import { AiSecurity } from './pages/AiSecurity';
import { ThreatIntelligence } from './pages/ThreatIntelligence';
import { AlertCenter } from './pages/AlertCenter';
import { Analytics } from './pages/Analytics';
import { AuditCenter } from './pages/AuditCenter';
import { Settings } from './pages/Settings';

import '@fontsource/inter';
import '@fontsource/outfit';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppThemeProvider>
          <Routes>
            {/* Fullscreen 3D Crystal Showcase Experience */}
            <Route path="/showcase" element={<Showcase />} />

            {/* Animated Public Brand Web Portal Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/download" element={<DownloadPage />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/get-started" element={<GetStarted />} />
            </Route>

            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Dashboard Protected SOAR Platform Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/threats" element={<ThreatDetection />} />
              <Route path="/mitre" element={<MitreAttack />} />
              <Route path="/soar" element={<SoarCenter />} />
              <Route path="/incidents" element={<IncidentManagement />} />
              <Route path="/ai-security" element={<AiSecurity />} />
              <Route path="/threat-intel" element={<ThreatIntelligence />} />
              <Route path="/alerts" element={<AlertCenter />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/audit" element={<AuditCenter />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
