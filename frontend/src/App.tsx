import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ViewModeProvider } from './context/ViewModeContext';
import { useAuth } from './context/useAuth';
import { AppThemeProvider } from './context/ThemeContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { PublicLayout } from './layouts/PublicLayout';

// Public Pages
import { Home } from './pages/public/Home';
import { About } from './pages/public/About';
import { Features } from './pages/public/Features';
import { HowItWorks } from './pages/public/HowItWorks';
import { RakshaAiPage } from './pages/public/RakshaAiPage';
import { SecurityPage } from './pages/public/SecurityPage';
import { DownloadPage } from './pages/public/Download';
import { Contact } from './pages/public/Contact';
import { GetStarted } from './pages/public/GetStarted';
import { Showcase } from './pages/public/Showcase';
import { PrivacyPolicy } from './pages/public/PrivacyPolicy';
import { TermsOfService } from './pages/public/TermsOfService';
import { NotFound } from './pages/public/NotFound';

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

// New Intelligence & Monitoring Pages
import { UrlScanner } from './pages/UrlScanner';
import { MlDetection } from './pages/MlDetection';
import { RakshaAi } from './pages/RakshaAi';
import { MonitoringView } from './pages/MonitoringView';
import { ReportsView } from './pages/ReportsView';
import { AttackGraphView } from './pages/AttackGraphView';
import { CertInComplianceView } from './pages/CertInComplianceView';
import { RakshaFlowStudio } from './pages/RakshaFlowStudio';
import { MayajaalDeceptionView } from './pages/MayajaalDeceptionView';

// User Dashboard (Bento-Box Consumer UI)
import { UserDashboardLayout } from './layouts/UserDashboardLayout';
import { UserDashboard } from './pages/UserDashboard';

import '@fontsource/inter';
import '@fontsource/outfit';

import { isAnalystRole } from './context/AuthContext';
export { isAnalystRole };

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

const AnalystRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!isAnalystRole(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const DashboardDispatcher: React.FC = () => {
  const { user } = useAuth();
  const isAnalyst = isAnalystRole(user?.role);

  if (isAnalyst) {
    return (
      <DashboardLayout>
        <Dashboard />
      </DashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <UserDashboard />
    </UserDashboardLayout>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppThemeProvider>
          <ViewModeProvider>
            <Routes>
            {/* Fullscreen 3D Crystal Showcase Experience */}
            <Route path="/showcase" element={<Showcase />} />

            {/* Animated Public Brand Web Portal Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/features" element={<Features />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/raksha-ai" element={<RakshaAiPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/download" element={<DownloadPage />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/get-started" element={<GetStarted />} />
            </Route>

            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Dashboard Route Dispatched by Role */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardDispatcher />
                </ProtectedRoute>
              }
            />

            {/* Bento-Box User Security Dashboard (Exclusively for standard users, previewable by analysts) */}
            <Route
              element={
                <ProtectedRoute>
                  <UserDashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/user" element={<UserDashboard />} />
              <Route path="/user/:section" element={<UserDashboard />} />
              <Route path="/user-dashboard" element={<UserDashboard />} />
            </Route>

            {/* SOC Analyst Protected Platform Routes (Strictly restricted to analysts/admins) */}
            <Route
              element={
                <ProtectedRoute>
                  <AnalystRoute>
                    <DashboardLayout />
                  </AnalystRoute>
                </ProtectedRoute>
              }
            >
              <Route path="/analyst" element={<Dashboard />} />

              {/* Security */}
              <Route path="/threats" element={<ThreatDetection />} />
              <Route path="/alerts" element={<AlertCenter />} />
              <Route path="/incidents" element={<IncidentManagement />} />

              {/* Monitoring */}
              <Route path="/devices" element={<MonitoringView initialTab={0} />} />
              <Route path="/processes" element={<MonitoringView initialTab={1} />} />
              <Route path="/network" element={<MonitoringView initialTab={2} />} />
              <Route path="/activity" element={<MonitoringView initialTab={3} />} />

              {/* Intelligence */}
              <Route path="/url-scanner" element={<UrlScanner />} />
              <Route path="/threat-intel" element={<ThreatIntelligence />} />
              <Route path="/ml-detection" element={<MlDetection />} />

              {/* Intelligent Assistant */}
              <Route path="/raksha-ai" element={<RakshaAi />} />

              {/* Platform Controls */}
              <Route path="/reports" element={<ReportsView />} />
              <Route path="/settings" element={<Settings />} />

              {/* Additional SOC Modules */}
              <Route path="/mitre" element={<MitreAttack />} />
              <Route path="/soar" element={<SoarCenter />} />
              <Route path="/raksha-flow" element={<RakshaFlowStudio />} />
              <Route path="/attack-graph" element={<AttackGraphView />} />
              <Route path="/cert-in-compliance" element={<CertInComplianceView />} />
              <Route path="/mayajaal" element={<MayajaalDeceptionView />} />
              <Route path="/ai-security" element={<AiSecurity />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/audit" element={<AuditCenter />} />
            </Route>

            {/* Fallback 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ViewModeProvider>
      </AppThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
