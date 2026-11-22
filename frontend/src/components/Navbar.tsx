import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  MapPin, 
  BarChart3, 
  BookOpen, 
  PlusCircle, 
  Layers, 
  Settings, 
  LogOut, 
  User as UserIcon, 
  ChevronDown, 
  Menu, 
  X,
  Search,
  Cpu,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { GlobalSearchModal } from './GlobalSearchModal';
import { AIEngineModal } from './AIEngineModal';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ mode: string; is_demo_mode: boolean; model_validation_status?: string; weights_present?: boolean; model_validation_approved?: boolean } | null>(null);

  const isActive = (path: string) => location.pathname === path;

  // Poll or fetch AI engine status on mount
  const refreshAIStatus = async () => {
    try {
      const res = await api.getAIStatus();
      setAiStatus({
        mode: res.mode,
        is_demo_mode: res.is_demo_mode,
        model_validation_status: res.model_validation_status,
        weights_present: res.weights_present,
        model_validation_approved: res.model_validation_approved
      });
    } catch (e) {
      // ignore in offline/initial load
    }
  };

  useEffect(() => {
    refreshAIStatus();
  }, [location.pathname]);

  // Global keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);



  const isRealAI = Boolean(aiStatus?.mode === 'REAL' || aiStatus?.weights_present || aiStatus?.model_validation_approved);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Brand Identity */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-navy-900 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-5 h-5 text-teal-200" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-lg tracking-tight text-navy-900">CivicLens AI</span>
                    <span className="bg-gradient-to-r from-teal-600 to-teal-700 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
                      RoadDefect
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 hidden sm:block tracking-wide">
                    Report. Detect. Prioritize. Improve Our Roads.
                  </p>
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden lg:flex items-center gap-1">
                <Link
                  to="/"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    isActive('/') ? 'text-teal-700 bg-teal-50/90 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Overview
                </Link>
                <Link
                  to="/track"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/track') ? 'text-teal-700 bg-teal-50/90 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-teal-600" />
                  Track Complaint
                </Link>
                <Link
                  to="/map"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/map') ? 'text-teal-700 bg-teal-50/90 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  Map & Clusters
                </Link>
                <Link
                  to="/analytics"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/analytics') ? 'text-teal-700 bg-teal-50/90 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
                  Analytics
                </Link>
                <Link
                  to="/about"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive('/about') ? 'text-teal-700 bg-teal-50/90 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                  About
                </Link>
              </nav>
            </div>

            {/* Middle Quick Search Bar */}
            <div className="hidden md:flex items-center">
              <button
                onClick={() => setSearchModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 rounded-xl transition-colors w-48 xl:w-60 justify-between group"
              >
                <span className="flex items-center gap-2 truncate">
                  <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600" />
                  <span className="truncate">Search defects, streets...</span>
                </span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Right Action Bar */}
            <div className="hidden md:flex items-center gap-2.5">
              
              {/* Active AI Engine Indicator Pill */}
              <button
                onClick={() => setAiModalOpen(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-lg border transition-all ${
                  isRealAI
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
                title="Click to view AI Runtime & ONNX Model Specifications"
              >
                <span className={`w-2 h-2 rounded-full ${isRealAI ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="font-bold">{isRealAI ? 'ONNX MODEL' : 'HEURISTIC DEMO'}</span>
                <Cpu className="w-3 h-3 text-slate-500" />
              </button>


            </div>

            {/* Mobile Header Controls */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setSearchModalOpen(true)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100"
              >
                Overview
              </Link>
              <Link
                to="/track"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5 text-teal-600" />
                Track Complaint
              </Link>
              <Link
                to="/map"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100"
              >
                Map & Clusters
              </Link>
              <Link
                to="/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100"
              >
                Analytics
              </Link>
              <Link
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100 col-span-2 flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                About CivicLens AI
              </Link>
            </div>

            {/* Quick Engine Indicator & Role Switcher */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">AI Engine Status</span>
                <button
                  onClick={() => { setMobileMenuOpen(false); setAiModalOpen(true); }}
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    isRealAI ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isRealAI ? '● ONNX MODEL' : '● DEMO HEURISTIC'}
                </button>
              </div>


            </div>

            {/* CTA Buttons */}
            <div className="space-y-2 pt-2">
              <Link
                to="/report-new"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl bg-teal-600 text-white shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Report Road Damage
              </Link>

              {user ? (
                <div className="flex items-center justify-between p-2 bg-slate-100 rounded-xl">
                  <div>
                    <span className="text-xs font-bold block">{user.name}</span>
                    <span className="text-[10px] text-teal-700 font-mono font-bold uppercase">{user.role}</span>
                  </div>
                  <button
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className="text-xs text-rose-600 font-medium hover:underline"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center block py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Modals */}
      <GlobalSearchModal 
        isOpen={searchModalOpen} 
        onClose={() => setSearchModalOpen(false)} 
      />
      <AIEngineModal 
        isOpen={aiModalOpen} 
        onClose={() => setAiModalOpen(false)} 
        onModeChanged={refreshAIStatus}
      />
    </>
  );
};
