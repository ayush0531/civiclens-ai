import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout, quickDemoLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleRoleSwitch = async (role: UserRole) => {
    setDemoMenuOpen(false);
    await quickDemoLogin(role);
    if (role === 'citizen') navigate('/citizen');
    else if (role === 'authority') navigate('/authority');
    else if (role === 'admin') navigate('/admin');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-navy-900 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-navy-900 font-sans">CivicLens</span>
                <span className="bg-teal-600 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">AI</span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block tracking-wide">Intelligent Road Damage System</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isActive('/') ? 'text-teal-700 bg-teal-50/80 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Overview
            </Link>
            <Link
              to="/map"
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                isActive('/map') ? 'text-teal-700 bg-teal-50/80 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-4 h-4 text-teal-600" />
              Damage Map
            </Link>
            <Link
              to="/analytics"
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                isActive('/analytics') ? 'text-teal-700 bg-teal-50/80 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-teal-600" />
              Analytics
            </Link>
            <Link
              to="/about"
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                isActive('/about') ? 'text-teal-700 bg-teal-50/80 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 text-teal-600" />
              Methodology
            </Link>
          </nav>

          {/* Right Action Bar */}
          <div className="hidden lg:flex items-center gap-3">
            
            {/* Quick Demo Role Switcher for College Evaluation */}
            <div className="relative">
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 transition-colors shadow-sm"
                title="Quick demo role switcher for evaluators"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Demo Switcher</span>
                <ChevronDown className="w-3 h-3 text-teal-600" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Evaluator Role Selector</p>
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('citizen')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between text-slate-700"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">Citizen Reporter</span>
                      <span className="text-[10px] text-slate-500">citizen@civiclens.ai</span>
                    </div>
                    {user?.role === 'citizen' && <span className="w-2 h-2 rounded-full bg-teal-500"></span>}
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('authority')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between text-slate-700"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">Municipal Authority</span>
                      <span className="text-[10px] text-slate-500">authority@civiclens.ai</span>
                    </div>
                    {user?.role === 'authority' && <span className="w-2 h-2 rounded-full bg-teal-500"></span>}
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('admin')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between text-slate-700"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">System Administrator</span>
                      <span className="text-[10px] text-slate-500">admin@civiclens.ai</span>
                    </div>
                    {user?.role === 'admin' && <span className="w-2 h-2 rounded-full bg-teal-500"></span>}
                  </button>
                </div>
              )}
            </div>

            {/* Role Dashboards & Report CTA */}
            <Link
              to="/report-new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Report Damage
            </Link>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {user.role === 'citizen' && (
                  <Link
                    to="/citizen"
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      isActive('/citizen') ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    My Reports
                  </Link>
                )}
                {user.role === 'authority' && (
                  <Link
                    to="/authority"
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                      isActive('/authority') ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-teal-400" />
                    Operations Queue
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                      isActive('/admin') ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5 text-teal-400" />
                    Admin
                  </Link>
                )}

                <div className="flex items-center gap-2 pl-2">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 block leading-tight">{user.name.split(' ')[0]}</span>
                    <span className="text-[10px] text-teal-700 uppercase font-mono font-semibold">{user.role}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5" />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100"
            >
              Overview
            </Link>
            <Link
              to="/map"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100"
            >
              Damage Map
            </Link>
            <Link
              to="/analytics"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100"
            >
              Analytics
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100"
            >
              Methodology
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/report-new"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2 text-sm font-semibold rounded-lg bg-teal-600 text-white shadow"
            >
              + Report Road Damage
            </Link>

            {user ? (
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{user.name}</p>
                  <p className="text-[10px] text-teal-600 uppercase font-mono">{user.role}</p>
                </div>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="px-3 py-1 text-xs text-rose-600 bg-rose-50 rounded border border-rose-200 font-semibold"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
