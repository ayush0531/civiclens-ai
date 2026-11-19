import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  Users, 
  Database, 
  HardDrive, 
  Cpu, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Lock,
  Sliders,
  Save,
  RefreshCw,
  Zap,
  Info,
  Building2
} from 'lucide-react';
import { api } from '../services/api';
import { User, AuditLogItem, PriorityPolicyData, NMCIntegrationConfig, NMCTransactionAudit } from '../types';
import { useAuth } from '../context/AuthContext';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [policyData, setPolicyData] = useState<PriorityPolicyData | null>(null);
  const [editedWeights, setEditedWeights] = useState<Record<string, number>>({});
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reseeding, setReseeding] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

  // NMC Gateway Integration States
  const [nmcConfig, setNmcConfig] = useState<NMCIntegrationConfig | null>(null);
  const [nmcHealth, setNmcHealth] = useState<any | null>(null);
  const [nmcTransactions, setNmcTransactions] = useState<NMCTransactionAudit[]>([]);
  const [testingNmcHealth, setTestingNmcHealth] = useState<boolean>(false);
  const [savingNmcConfig, setSavingNmcConfig] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, auditData, statusData, policyRes, nmcCfg, nmcTx] = await Promise.all([
        api.getAllUsers(),
        api.getAuditLogs(undefined, 25),
        api.getSystemStatus(),
        api.getPriorityPolicy(),
        api.getNMCConfig().catch(() => null),
        api.getNMCTransactions(15).catch(() => []),
      ]);
      setUsers(usersData);
      setAuditLogs(auditData);
      setSystemStatus(statusData);
      setPolicyData(policyRes);
      setEditedWeights(policyRes.policy || {});
      if (nmcCfg) setNmcConfig(nmcCfg);
      setNmcTransactions(nmcTx || []);
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to load administrative data.', error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleTestNmcHealth = async () => {
    setTestingNmcHealth(true);
    try {
      const h = await api.getNMCHealth();
      setNmcHealth(h);
      setMsg({ text: `Gateway health ping: ${h.health_status} (${h.adapter_mode}, ${h.latency_ms?.toFixed(1) || '0.0'}ms).`, error: false });
    } catch (err: any) {
      setMsg({ text: err.message || 'NMC health ping failed.', error: true });
    } finally {
      setTestingNmcHealth(false);
    }
  };

  const handleSaveNmcConfig = async () => {
    if (!nmcConfig) return;
    setSavingNmcConfig(true);
    try {
      const updated = await api.updateNMCConfig({
        adapter_mode: nmcConfig.adapter_mode,
        endpoint_url: nmcConfig.endpoint_url,
        api_key: nmcConfig.api_key_masked?.includes('***') ? undefined : nmcConfig.api_key_masked,
        timeout_seconds: nmcConfig.timeout_seconds,
        retry_limit: nmcConfig.retry_limit,
      });
      setNmcConfig(updated);
      setMsg({ text: `NMC Integration configuration updated to mode '${updated.adapter_mode}'.`, error: false });
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to save NMC configuration.', error: true });
    } finally {
      setSavingNmcConfig(false);
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

  const handleWeightSlider = (key: string, val: number) => {
    setEditedWeights((prev) => ({
      ...prev,
      [key]: Math.round(val * 100) / 100,
    }));
  };

  const currentWeightSum = Object.values(editedWeights).reduce((a, b) => a + b, 0);
  const isWeightSumValid = Math.abs(currentWeightSum - 1.0) <= 0.005;

  const handleSavePolicy = async () => {
    if (!isWeightSumValid) {
      alert(`Weights must sum exactly to 1.00 (Current sum: ${currentWeightSum.toFixed(2)})`);
      return;
    }
    setSavingPolicy(true);
    try {
      await api.updatePriorityPolicy(editedWeights);
      setMsg({ text: 'Maintenance priority policy updated. All open road cases recalculated!', error: false });
      await loadData();
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to update priority policy.', error: true });
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleResetPolicy = () => {
    setEditedWeights({
      w_sev: 0.35,
      w_conf: 0.15,
      w_dup: 0.15,
      w_age: 0.15,
      w_road: 0.10,
      w_traffic: 0.10,
    });
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
          <div className="pt-2 rounded-xl bg-slate-50 border border-slate-200 p-4 text-left">
            <p className="text-xs font-semibold text-slate-700">Administrator accounts are provisioned privately.</p>
            <p className="text-xs text-slate-500 mt-1">Public registration is limited to citizen accounts. Contact the project administrator to request authorized access.</p>
          </div>
        </div>
      </div>
    );
  }

  const weightLabels: Record<string, { title: string; desc: string }> = {
    w_sev: { title: 'Physical Severity Index (w_sev)', desc: 'Engineering distress surface area and defect count' },
    w_conf: { title: 'AI Prediction Confidence (w_conf)', desc: 'Model confidence score on defect detection' },
    w_dup: { title: 'Citizen Duplicate Density (w_dup)', desc: 'Clustering of recurring public citizen complaints' },
    w_age: { title: 'Case Age & Neglect SLA (w_age)', desc: 'Time elapsed since initial incident report' },
    w_road: { title: 'Road Hierarchy Importance (w_road)', desc: 'National Highway / Arterial vs Local residential road' },
    w_traffic: { title: 'Traffic Multiplier (w_traffic)', desc: 'Transit corridor congestion and safety exposure' },
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-navy-900"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-navy-900">System Administration</span>
            </div>
            <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">Admin System & Policy Governance</h1>
            <p className="text-xs text-slate-500 mt-1">
              Explainable multi-criteria dispatch policy weights, user identity access management, and audit records.
            </p>
          </div>

          <button
            onClick={handleReseed}
            disabled={reseeding}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 shrink-0"
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

        {/* Priority Policy Governance Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-navy-900">Explainable Maintenance Priority Policy (6 Factors)</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Adjust criteria weight coefficients. Updating weights triggers instant recalculation of all open municipal cases.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border ${
                isWeightSumValid 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                <span>Σ Weights: {currentWeightSum.toFixed(2)} / 1.00</span>
                {isWeightSumValid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
              </div>

              <button
                onClick={handleResetPolicy}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium px-2 py-1"
                title="Reset to IRC standard baseline"
              >
                Reset Default
              </button>

              <button
                onClick={handleSavePolicy}
                disabled={savingPolicy || !isWeightSumValid}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                {savingPolicy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save & Recalculate</span>
              </button>
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Object.keys(editedWeights).map((key) => {
              const meta = weightLabels[key] || { title: key, desc: 'Criteria factor weight' };
              const val = editedWeights[key] || 0;
              return (
                <div key={key} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-navy-900">{meta.title}</span>
                    <span className="font-mono font-black text-xs text-teal-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {val.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">{meta.desc}</p>
                  
                  <input
                    type="range"
                    min="0"
                    max="0.60"
                    step="0.05"
                    value={val}
                    onChange={(e) => handleWeightSlider(key, parseFloat(e.target.value))}
                    className="w-full accent-teal-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>0.00</span>
                    <span>{(val * 100).toFixed(0)}% contribution</span>
                    <span>0.60</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200 text-xs text-teal-900 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 text-teal-700 mt-0.5" />
            <span>
              <strong>Explainability Note:</strong> Priority Score formula:
              <code className="mx-1 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-teal-200">
                P = w_sev · S_phys + w_conf · C_ai + w_dup · D_rep + w_age · A_sla + w_road · R_class + w_traffic · T_vuln
              </code>
              ensures municipal authorities can justify budget allocation transparently under civic audits.
            </span>
          </div>
        </div>

        {/* Official NMC Municipal Integration Gateway & Governance */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                <h2 className="text-base font-bold text-navy-900">Nagpur Municipal Corporation (NMC) Integration Gateway</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure official municipal grievance dispatch adapters, idempotency locks, and inspect live transaction telemetry.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={testingNmcHealth}
                onClick={handleTestNmcHealth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${testingNmcHealth ? 'animate-spin' : ''}`} />
                <span>Test Gateway Ping</span>
              </button>

              <button
                type="button"
                disabled={savingNmcConfig || !nmcConfig}
                onClick={handleSaveNmcConfig}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                {savingNmcConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Gateway Config</span>
              </button>
            </div>
          </div>

          {/* Health Ping Feedback Banner */}
          {nmcHealth && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${nmcHealth.health_status === 'HEALTHY' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="font-bold text-slate-800">
                  Gateway Mode: <span className="font-mono text-teal-700">{nmcHealth.adapter_mode}</span>
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">Latency: <strong>{nmcHealth.latency_ms?.toFixed(1) || '0.0'}ms</strong></span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {nmcHealth.message}
              </span>
            </div>
          )}

          {/* Config Controls Grid */}
          {nmcConfig && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Adapter Operating Mode</label>
                <select
                  value={nmcConfig.adapter_mode}
                  onChange={(e) => setNmcConfig({ ...nmcConfig, adapter_mode: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-semibold"
                >
                  <option value="SIMULATED">SIMULATED (Academic Demo Mode)</option>
                  <option value="OFFICIAL_API">OFFICIAL_API (Authorized NMC Endpoint)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Simulated mode generates realistic synthetic NMC references for evaluator demos.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Gateway Endpoint URL</label>
                <input
                  type="text"
                  value={nmcConfig.endpoint_url || ''}
                  onChange={(e) => setNmcConfig({ ...nmcConfig, endpoint_url: e.target.value })}
                  placeholder="https://nmcnagpur.gov.in/api/v1/grievance"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">API Key / Bearer Secret</label>
                <input
                  type="password"
                  value={nmcConfig.api_key_masked || ''}
                  onChange={(e) => setNmcConfig({ ...nmcConfig, api_key_masked: e.target.value })}
                  placeholder="Bearer token or authorization header..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Timeout & Retry Limit</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={nmcConfig.timeout_seconds}
                    onChange={(e) => setNmcConfig({ ...nmcConfig, timeout_seconds: parseInt(e.target.value) || 15 })}
                    className="w-1/2 px-3 py-2 rounded-xl border border-slate-300 focus:outline-none bg-white font-mono"
                    title="Timeout in seconds"
                  />
                  <input
                    type="number"
                    value={nmcConfig.retry_limit}
                    onChange={(e) => setNmcConfig({ ...nmcConfig, retry_limit: parseInt(e.target.value) || 3 })}
                    className="w-1/2 px-3 py-2 rounded-xl border border-slate-300 focus:outline-none bg-white font-mono"
                    title="Retry limit"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Timeout: {nmcConfig.timeout_seconds}s • Max Retries: {nmcConfig.retry_limit}
                </span>
              </div>
            </div>
          )}

          {/* Transaction Audit Log Table */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Recent Gateway Dispatch Transactions ({nmcTransactions.length})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Idempotency-Protected Records
              </span>
            </div>

            {nmcTransactions.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                No recent municipal gateway transactions recorded. Submit a complaint to generate audit dispatches.
              </p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Timestamp</th>
                      <th className="px-3 py-2">Report ID</th>
                      <th className="px-3 py-2">Operation</th>
                      <th className="px-3 py-2">Official Ref</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="px-3 py-2">Idempotency Key</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {nmcTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                          {new Date(tx.timestamp).toLocaleString('en-IN')}
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-800">
                          #{tx.report_id}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {tx.transaction_type}
                        </td>
                        <td className="px-3 py-2 text-teal-800 font-bold">
                          {tx.official_reference_id || 'PENDING'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.http_status_code === 200 || tx.http_status_code === 201
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            HTTP {tx.http_status_code}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-400 truncate max-w-xs">
                          {tx.idempotency_key}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* System Diagnostics 3-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Database Diagnostics */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-teal-600" />
              Active Computer Vision Engine
            </h3>
            <div className="text-sm font-bold text-slate-900 truncate">
              {systemStatus?.ai_engine?.model_name || 'YOLOv8-RDD2022'}
            </div>
            <div className="text-xs space-y-1 text-slate-600 border-t border-slate-100 pt-2">
              <div className="flex justify-between">
                <span>Inference Mode:</span>
                <strong className="font-mono text-teal-700">{systemStatus?.ai_engine?.mode || 'REAL'}</strong>
              </div>
              <div className="flex justify-between">
                <span>ONNX Runtime Active:</span>
                <strong className="text-emerald-700">
                  {systemStatus?.ai_engine?.weights_present ? 'Yes (Native ONNX)' : 'Demo Fallback'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Execution Provider:</span>
                <strong className="font-mono text-slate-800">
                  {systemStatus?.ai_engine?.execution_providers?.[0] || 'CPUExecutionProvider'}
                </strong>
              </div>
            </div>
          </div>

          {/* Storage & Uploads */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
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
