import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { NewReportPage } from './pages/NewReportPage';
import { AnalysisResultsPage } from './pages/AnalysisResultsPage';
import { InteractiveMapPage } from './pages/InteractiveMapPage';
import { AuthorityDashboard } from './pages/AuthorityDashboard';
import { CaseDetailsPage } from './pages/CaseDetailsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AdminPage } from './pages/AdminPage';
import { AboutPage } from './pages/AboutPage';
import { TrackComplaintPage } from './pages/TrackComplaintPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/citizen" element={<CitizenDashboard />} />
              <Route path="/report-new" element={<NewReportPage />} />
              <Route path="/reports/new" element={<NewReportPage />} />
              <Route path="/track" element={<TrackComplaintPage />} />
              <Route path="/track/:identifier" element={<TrackComplaintPage />} />
              <Route path="/analysis/:id" element={<AnalysisResultsPage />} />
              <Route path="/map" element={<InteractiveMapPage />} />
              <Route path="/authority" element={<AuthorityDashboard />} />
              <Route path="/case/:id" element={<CaseDetailsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
