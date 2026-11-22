import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Layers, 
  Zap, 
  RefreshCw, 
  ExternalLink,
  X,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AIEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModeChanged?: () => void;
}

export const AIEngineModal: React.FC<AIEngineModalProps> = ({ isOpen, onClose, onModeChanged }) => {
  const { user } = useAuth();
  const [engineInfo, setEngineInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAIStatus();
      setEngineInfo(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch AI engine status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleMode = async () => {
    if (!engineInfo) return;
    const targetMode = engineInfo.mode === 'REAL' ? 'DEMO' : 'REAL';
    try {
      setSwitching(true);
      setError(null);
      await api.setAIMode(targetMode);
      await fetchStatus();
      if (onModeChanged) onModeChanged();
    } catch (err: any) {
      setError(err?.message || 'Failed to switch inference mode. Authority or Admin role required.');
    } finally {
      setSwitching(false);
    }
  };

  const isReal = engineInfo?.mode === 'REAL';
  const canToggle = user && (user.role === 'admin' || user.role === 'authority');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isReal ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-navy-900 text-base">Inference Engine Architecture</h3>
              <p className="text-xs text-slate-500">Live AI Execution & Runtime Verification</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {loading && !engineInfo ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
              <p className="text-sm">Querying ONNX execution runtime...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Status Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                isReal 
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}>
                {isReal ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      {isReal ? 'ONNX Runtime Deep Learning Active' : 'Heuristic Fallback Engine Active'}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isReal ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                    }`}>
                      {engineInfo?.mode}
                    </span>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {engineInfo?.disclaimer}
                  </p>
                </div>
              </div>

              {/* Engine Technical Specifications */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Architecture / Model</span>
                  <span className="font-mono font-semibold text-navy-900 block truncate">
                    {engineInfo?.model_name || 'CivicLens AI Inference Engine'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Execution Provider</span>
                  <span className="font-mono font-semibold text-teal-700 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    {engineInfo?.execution_providers?.[0] || 'CPUExecutionProvider'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Input Resolution</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {engineInfo?.input_resolution ? `${engineInfo.input_resolution[0]} × ${engineInfo.input_resolution[1]} px` : '640 × 640 px'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Weights Status</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {engineInfo?.weights_present ? 'ONNX Graph Loaded' : 'Synthesized Graph'}
                  </span>
                </div>
              </div>

              {/* Supported Classes */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Taxonomy Classes (RDD2022 Pavement Standard)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(engineInfo?.supported_classes || []).map((cls: string) => (
                    <span key={cls} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {cls}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mode Switcher Action for Evaluator/Authority */}
              <div className="pt-2 border-t border-slate-100">
                {canToggle ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Evaluator Engine Switch</p>
                      <p className="text-[11px] text-slate-500">Toggle between ONNX Runtime Deep Learning and Heuristic mode</p>
                    </div>
                    <button
                      onClick={handleToggleMode}
                      disabled={switching}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 ${
                        isReal 
                          ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300' 
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {switching ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      <span>Switch to {isReal ? 'Demo Heuristic' : 'ONNX Model'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <ShieldAlert className="w-4 h-4 text-slate-400" />
                    <span>Log in as <strong>Authority</strong> or <strong>Admin</strong> to toggle inference engines live.</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <Link
            to="/lab"
            onClick={onClose}
            className="text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
          >
            <span>Open Model Evaluation Laboratory</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
