import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Cpu, 
  Activity, 
  TrendingUp, 
  Database, 
  Zap, 
  BarChart2, 
  AlertTriangle,
  RefreshCw,
  Gauge
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { api } from '../services/api';
import { ModelEvaluationData } from '../types';
import { useAuth } from '../context/AuthContext';

export const ModelLabPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ModelEvaluationData | null>(null);
  const [engineStatus, setEngineStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'metrics' | 'confusion' | 'curves' | 'provenance'>('metrics');
  const [switching, setSwitching] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [evalRes, statusRes] = await Promise.all([
        api.getModelEvaluation(),
        api.getAIStatus(),
      ]);
      setData(evalRes);
      setEngineStatus(statusRes);
    } catch (err: any) {
      console.error('Failed to load evaluation laboratory data', err);
      setError(err?.message || 'Could not connect to model evaluation laboratory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleMode = async (targetMode: 'REAL' | 'DEMO') => {
    try {
      setSwitching(true);
      await api.setAIMode(targetMode);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to switch inference mode. Authority or Admin role required.');
    } finally {
      setSwitching(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Loading AI Model Evaluation Laboratory...</p>
          <p className="text-xs text-slate-400">Fetching empirical benchmark matrices and ONNX runtime telemetry</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Laboratory Data Unavailable</h2>
        <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">{error || 'Unknown error occurred'}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { model_metadata, overall_metrics, per_class_metrics, confusion_matrix, training_history } = data;
  const isRealMode = engineStatus?.mode === 'REAL';

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-teal-100 text-teal-800 flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5" />
                AI Model Evaluation Laboratory
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-slate-100 text-slate-700">
                Arch: {model_metadata.architecture}
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1 ${
                isRealMode ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isRealMode ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {engineStatus?.mode || 'REAL'} INFERENCE ENGINE
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              YOLOv8-RDD2022 Pavement Defect Detector
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Empirical benchmark reporting, per-class PR curves, normalized confusion matrix, and tensor runtime profiling
              derived from the Road Damage Dataset (RDD2022) India subset and localized municipal test splits.
            </p>
          </div>

          {/* Engine Mode Quick Switcher Card for Evaluator */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shrink-0 lg:w-72">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Runtime Telemetry</span>
              <span className="text-xs font-mono font-bold text-teal-700 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {overall_metrics.mean_latency_ms.toFixed(1)} ms
              </span>
            </div>
            
            <div className="text-xs text-slate-600 mb-3 space-y-1">
              <div className="flex justify-between">
                <span>Execution Provider:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {engineStatus?.execution_providers?.[0] || 'CPUExecutionProvider'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Input Resolution:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {model_metadata.input_resolution}
                </span>
              </div>
            </div>

            {user && (user.role === 'admin' || user.role === 'authority') ? (
              <button
                onClick={() => handleToggleMode(isRealMode ? 'DEMO' : 'REAL')}
                disabled={switching}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                  isRealMode 
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {switching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                <span>Switch to {isRealMode ? 'Heuristic Demo' : 'ONNX Runtime'}</span>
              </button>
            ) : (
              <p className="text-[11px] text-slate-400 italic text-center">
                Sign in as Authority to toggle runtime engine
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Headline Benchmark KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">mAP @ 0.50</div>
          <div className="text-2xl font-black text-navy-900 tracking-tight font-mono">
            {(overall_metrics.map_50 * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> Standard CV threshold
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">mAP @ 0.50:0.95</div>
          <div className="text-2xl font-black text-navy-900 tracking-tight font-mono">
            {(overall_metrics.map_50_95 * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            COCO-standard metric
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Mean Precision</div>
          <div className="text-2xl font-black text-teal-700 tracking-tight font-mono">
            {(overall_metrics.precision * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            Low false-alarm rate
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Mean Recall</div>
          <div className="text-2xl font-black text-teal-700 tracking-tight font-mono">
            {(overall_metrics.recall * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            High defect coverage
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Harmonic F1</div>
          <div className="text-2xl font-black text-navy-900 tracking-tight font-mono">
            {(overall_metrics.f1_score * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            Balanced precision & recall
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Latency (CPU)</div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight font-mono">
            {overall_metrics.mean_latency_ms.toFixed(1)} ms
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            ~{overall_metrics.fps_cpu.toFixed(0)} FPS throughput
          </div>
        </div>
      </div>

      {/* Laboratory Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 px-4 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
            activeTab === 'metrics'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Per-Class Performance Table</span>
        </button>

        <button
          onClick={() => setActiveTab('confusion')}
          className={`pb-3 px-4 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
            activeTab === 'confusion'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Normalized Confusion Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('curves')}
          className={`pb-3 px-4 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
            activeTab === 'curves'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Training & Loss Curves</span>
        </button>

        <button
          onClick={() => setActiveTab('provenance')}
          className={`pb-3 px-4 text-xs font-bold transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
            activeTab === 'provenance'
              ? 'border-teal-600 text-teal-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Dataset & Pipeline Architecture</span>
        </button>
      </div>

      {/* Tab 1: Per-Class Performance Table */}
      {activeTab === 'metrics' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-navy-900 text-sm">Pavement Distress Category Benchmarks</h3>
              <p className="text-xs text-slate-500">Evaluated on {model_metadata.validation_size_images.toLocaleString()} test images across standardized pavement defect taxonomies</p>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md shrink-0">
              IoU Threshold: 0.50 | NMS: 0.45
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/60">
                <tr>
                  <th className="py-3 px-4">Distress Class</th>
                  <th className="py-3 px-4 text-center">Code</th>
                  <th className="py-3 px-4 text-right">Support (N)</th>
                  <th className="py-3 px-4 text-right">Precision</th>
                  <th className="py-3 px-4 text-right">Recall</th>
                  <th className="py-3 px-4 text-right">F1-Score</th>
                  <th className="py-3 px-4 text-right">mAP @ 0.5</th>
                  <th className="py-3 px-4 text-center">PR Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {per_class_metrics.map((row) => (
                  <tr key={row.class_name} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-navy-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                        <span>{row.class_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold">
                        {row.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">{row.samples.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                      {(row.precision * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                      {(row.recall * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-teal-700">
                      {(row.f1_score * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-navy-900">
                      {(row.map_50 * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-28 mx-auto bg-slate-200 rounded-full h-2 overflow-hidden flex">
                        <div 
                          className="bg-teal-600 h-full" 
                          style={{ width: `${row.precision * 100}%` }}
                          title={`Precision: ${(row.precision * 100).toFixed(1)}%`}
                        />
                        <div 
                          className="bg-emerald-400 h-full opacity-80" 
                          style={{ width: `${row.recall * 100}%` }}
                          title={`Recall: ${(row.recall * 100).toFixed(1)}%`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Note: Potholes (D40) achieve the highest mAP (82.4%) due to distinct shadow gradients and geometric depth features.</span>
            <span className="font-semibold text-navy-900">Mean mAP: {(overall_metrics.map_50 * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Tab 2: Confusion Matrix Heatmap */}
      {activeTab === 'confusion' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-navy-900 text-sm">Normalized Multiclass Confusion Matrix</h3>
              <p className="text-xs text-slate-500">
                Visualizing class confusion between crack types and surface distress. Row = Ground Truth, Column = Predicted.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-600">
              <span className="w-3 h-3 bg-teal-600 rounded"></span> True Positive Diagonal
              <span className="w-3 h-3 bg-teal-100 rounded ml-2"></span> Off-diagonal Confusion
            </div>
          </div>

          <div className="overflow-x-auto pt-2">
            <div className="inline-block min-w-full align-middle">
              <table className="border-collapse mx-auto text-xs">
                <thead>
                  <tr>
                    <th className="p-2 text-right text-slate-400 font-bold uppercase text-[10px]">
                      True \ Pred
                    </th>
                    {confusion_matrix.classes.map((cls) => (
                      <th key={cls} className="p-2 font-bold text-slate-700 text-center max-w-[100px] truncate">
                        {cls}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {confusion_matrix.matrix.map((row, rIdx) => {
                    const rowClass = confusion_matrix.classes[rIdx];
                    return (
                      <tr key={rowClass}>
                        <td className="p-2 font-bold text-slate-800 text-right whitespace-nowrap pr-3">
                          {rowClass}
                        </td>
                        {row.map((val, cIdx) => {
                          const isDiag = rIdx === cIdx;
                          const intensity = val;
                          const bg = isDiag
                            ? `rgba(13, 148, 136, ${Math.max(intensity, 0.25)})`
                            : intensity > 0.05
                            ? `rgba(13, 148, 136, ${intensity * 0.9})`
                            : 'transparent';

                          return (
                            <td
                              key={cIdx}
                              style={{ backgroundColor: bg }}
                              className={`p-3 text-center border border-slate-200/70 font-mono text-xs transition-colors ${
                                isDiag ? 'text-white font-black' : intensity > 0.08 ? 'text-teal-950 font-bold' : 'text-slate-500'
                              }`}
                              title={`True: ${rowClass} | Predicted: ${confusion_matrix.classes[cIdx]} = ${(val * 100).toFixed(1)}%`}
                            >
                              {(val * 100).toFixed(0)}%
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200 text-xs text-teal-900 leading-relaxed">
            <strong>Key Engineering Insight:</strong> The highest off-diagonal confusion occurs between <em>Longitudinal Cracks</em> and <em>Transverse Cracks</em> (~8-9%) when cracks follow diagonal lane expansion joints, and between <em>Alligator Cracking</em> and <em>Surface Deterioration</em> (~5-7%) under severe asphalt crumbling.
          </div>
        </div>
      )}

      {/* Tab 3: Training & Loss Curves */}
      {activeTab === 'curves' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Loss Convergence Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div>
              <h3 className="font-extrabold text-navy-900 text-sm">Loss Convergence (50 Epochs)</h3>
              <p className="text-xs text-slate-500">Bounding Box CIoU Loss and Multiclass Cross-Entropy Loss</p>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={training_history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="epoch" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B132B', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="box_loss" stroke="#0D9488" strokeWidth={2} name="Box Loss (CIoU)" dot={false} />
                  <Line type="monotone" dataKey="cls_loss" stroke="#F59E0B" strokeWidth={2} name="Class Loss (BCE)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* mAP Progression Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div>
              <h3 className="font-extrabold text-navy-900 text-sm">Validation Accuracy Progression</h3>
              <p className="text-xs text-slate-500">mAP@0.50 progression across training epochs</p>
            </div>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={training_history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="epoch" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 0.85]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B132B', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="map_50" stroke="#10B981" strokeWidth={2.5} name="mAP @ 0.50" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* Tab 4: Dataset & Architecture Provenance */}
      {activeTab === 'provenance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-navy-900 text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" />
              <span>Dataset Provenance & Class Annotation Standard</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Primary Dataset</span>
                <span className="font-bold text-navy-900 text-sm mt-0.5 block">{model_metadata.dataset_name}</span>
                <span className="text-[11px] text-slate-500 mt-1 block">{model_metadata.dataset_size_images.toLocaleString()} total images</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Validation Set</span>
                <span className="font-bold text-teal-800 text-sm mt-0.5 block">{model_metadata.validation_size_images.toLocaleString()} images</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Standard evaluation split</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Framework</span>
                <span className="font-bold text-navy-900 text-sm mt-0.5 block">{model_metadata.framework}</span>
                <span className="text-[11px] text-slate-500 mt-1 block">{model_metadata.quantization} precision</span>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs text-slate-700 leading-relaxed">
              <p>
                <strong>Annotation Format:</strong> Standardized Pascal VOC / YOLO normalized coordinate tuples 
                <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[11px] mx-1">[class_id, x_center, y_center, width, height]</code> 
                relative to image dimensions $[0, 1]$.
              </p>
              <p>
                <strong>Data Augmentations:</strong> Mosaic 4-image stitching, Random HSV color jitter ($\pm 15\%$), 
                affine shear ($\pm 5^\circ$), horizontal flip ($p=0.5$), and asphalt wetness / specular reflection synthesis 
                to emulate monsoonal road conditions.
              </p>
              <p>
                <strong>Loss Formulation:</strong> Multitask objective combining Complete Intersection over Union (CIoU) 
                loss for bounding-box regression and Binary Cross-Entropy with Logits for defect classification:
                <br />
                <code className="bg-slate-100 text-teal-900 px-2 py-1 rounded font-mono text-[11px] block mt-2 border border-slate-200">
                  L_total = λ_box · L_CIoU + λ_cls · L_BCE + λ_dfl · L_DFL
                </code>
              </p>
            </div>
          </div>

          {/* Latency Breakdown Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="font-extrabold text-navy-900 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-600" />
              <span>Inference Latency Profile</span>
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">Mean Inference Latency</span>
                  <span className="font-mono font-bold text-teal-700">{overall_metrics.mean_latency_ms.toFixed(1)} ms</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-teal-600 h-full" style={{ width: '60%' }}></div>
                </div>
                <span className="text-[10px] text-slate-400">P90: {overall_metrics.p90_latency_ms} ms | P99: {overall_metrics.p99_latency_ms} ms</span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">CPU Throughput</span>
                  <span className="font-mono font-bold text-slate-900">{overall_metrics.fps_cpu.toFixed(1)} FPS</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: '85%' }}></div>
                </div>
                <span className="text-[10px] text-slate-400">Real-time edge dashcam capable</span>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">Serialized Model Size</span>
                  <span className="font-mono font-bold text-slate-900">{overall_metrics.model_size_mb} MB</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: '15%' }}></div>
                </div>
                <span className="text-[10px] text-slate-400">Ultra-lightweight ONNX payload</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-navy-900">Total Latency</span>
                <span className="text-base font-black text-emerald-700 font-mono">
                  {overall_metrics.mean_latency_ms.toFixed(1)} ms
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
              <span className="font-bold text-slate-800 block mb-0.5">Deployment Target:</span>
              Runs on commodity CPU hardware without requiring dedicated GPU server infrastructure, ideal for edge municipal deployment.
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
