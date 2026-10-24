import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  Users, 
  Database, 
  HardDrive, 
  Cpu, 
  ShieldAlert, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import { User, AuditLogItem } from '../types';
import { useAuth } from '../context/AuthContext';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reseeding, setReseeding] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, auditData, statusData] = await Promise.all([
        api.getAllUsers(),
        api.getAuditLogs(undefined, 25),
        api.getSystemStatus(),
      ]);
      setUsers(usersData);
      setAuditLogs(auditData);
      setSystemStatus(statusData);
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to load administrative data.', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.updateUserRole(userId, { role: newRole });
      setMsg({ text: `Updated user #${userId} role to '${newRole}'.`, error: false });
      await loadData();
    } catch (err: any) {
      setMsg({ text: err.message || 'Role modification rejected.', error: true });
    }
  };

  const handleReseed = async () => {
    if (!window.confirm('Reset database with clean Nagpur synthetic demo records? This will restore 25 fresh cases.')) {
      return;
    }
    setReseeding(true);
    try {
      await api.reseedDatabase();
      setMsg({ text: 'Database successfully reseeded with 25 synthetic Nagpur cases.', error: false });
      await loadData();
    } catch (err: any) {
      setMsg({ text: err.message || 'Reseeding failed.', error: true });
    } finally {
      setReseeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-slate-50">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Permission Gate
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-slate-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3 shadow-sm">
          <Lock className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Administrator Access Required</h2>
          <p className="text-xs text-slate-500">
            You must be logged in with the <strong>admin</strong> role to inspect system settings and manage accounts.
          </p>
          <div className="pt-2">
            <span className="text-xs text-slate-400 block mb-2">Switch via Navbar Demo Switcher:</span>
            <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded border border-teal-200">
              admin@civiclens.ai / DemoPass123!
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-navy-900"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-navy-900">System Administration</span>
            </div>
            <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">Admin System & Role Governance</h1>
            <p className="text-xs text-slate-500 mt-1">
              User identity access management, AI inference diagnostics, and cryptographic audit records.
            </p>
          </div>

          <button
            onClick={handleReseed}
            disabled={reseeding}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${reseeding ? 'animate-spin' : ''}`} />
            <span>{reseeding ? 'Reseeding Database...' : 'Reseed Nagpur Demo Records'}</span>
          </button>
        </div>

        {/* Feedback Message */}
        {msg && (
          <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            msg.error ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <span>{msg.text}</span>
            <button onClick={() => setMsg(null)} className="font-bold">&times;</button>
          </div>
        )}

        {/* System Diagnostics 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Database Diagnostics */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-teal-600" />
              Relational Database Health
            </h3>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {systemStatus?.database?.type || 'SQLite (WAL Mode)'}
            </div>
            <div className="text-xs space-y-1 text-slate-600 border-t border-slate-100 pt-2 font-mono">
              <div className="flex justify-between">
                <span>Total Users:</span>
                <strong className="text-slate-900">{systemStatus?.database?.users_count ?? 0}</strong>
              </div>
              <div className="flex justify-between">
                <span>Damage Reports:</span>
                <strong className="text-slate-900">{systemStatus?.database?.reports_count ?? 0}</strong>
              </div>
              <div className="flex justify-between">
                <span>Audit Logs:</span>
                <strong className="text-slate-900">{systemStatus?.database?.audit_logs_count ?? 0}</strong>
              </div>
            </div>
          </div>

          {/* AI Inference Mode */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-teal-600" />
              Active Computer Vision Engine
            </h3>
            <div className="text-sm font-bold text-slate-900 truncate">
              {systemStatus?.ai_engine?.model_name || 'EdgeCV Heuristics'}
            </div>
            <div className="text-xs space-y-1 text-slate-600 border-t border-slate-100 pt-2">
              <div className="flex justify-between">
                <span>Inference Mode:</span>
                <strong className="font-mono text-teal-700">{systemStatus?.ai_engine?.mode || 'DEMO'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Demo Fallback Active:</span>
                <strong className="text-slate-800">{systemStatus?.ai_engine?.is_demo_mode ? 'Yes (Honest Heuristic)' : 'No'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Custom Weights Present:</span>
                <strong className="text-slate-800">{systemStatus?.ai_engine?.weights_present ? 'Yes' : 'None (Using Heuristics)'}</strong>
              </div>
            </div>
          </div>

          {/* Storage & Uploads */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-teal-600" />
              Uploads Storage Diagnostics
            </h3>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {systemStatus?.storage?.upload_size_mb ?? 0} MB
            </div>
            <div className="text-xs space-y-1 text-slate-600 border-t border-slate-100 pt-2 font-mono">
              <div className="flex justify-between">
                <span>Stored Media Files:</span>
                <strong className="text-slate-900">{systemStatus?.storage?.upload_files_count ?? 0} images</strong>
              </div>
              <div className="flex justify-between">
                <span>Max Upload Size:</span>
                <strong className="text-slate-900">{systemStatus?.storage?.max_allowed_mb ?? 10} MB/file</strong>
              </div>
              <div className="flex justify-between">
                <span>Sanitization:</span>
                <strong className="text-emerald-700">MIME & Ext Checked</strong>
              </div>
            </div>
          </div>

        </div>

        {/* User Identity & Role Governance Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              User Directory & Role Governance
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Roles enforce server-side API permissions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Assigned Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Account Status</th>
                  <th className="px-4 py-3 text-right">Role Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-slate-600">#{u.id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{u.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                        u.role === 'admin' ? 'bg-navy-900 text-white' :
                        u.role === 'authority' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.department || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[10px]">
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.id === user.id}
                        className="px-2 py-1 text-xs rounded border border-slate-200 bg-white font-medium focus:ring-1 focus:ring-teal-500 disabled:opacity-40"
                      >
                        <option value="citizen">Citizen</option>
                        <option value="authority">Authority</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cryptographic Audit Trail Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-teal-600" />
              System Audit Logs (Recent 25 Actions)
            </h2>
            <span className="text-xs text-slate-400 font-mono">Immutable Log</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-800">
                      {log.actor_name || 'System / Unauth'}
                    </td>
                    <td className="px-4 py-2.5 text-teal-700 font-semibold">
                      {log.action}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {log.target_type} #{log.target_id}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate">
                      {log.metadata_json || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
