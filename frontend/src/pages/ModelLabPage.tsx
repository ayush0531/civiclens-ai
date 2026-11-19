import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Cpu, Database, RefreshCw, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

export const ModelLabPage: React.FC = () => {
  const [evaluation, setEvaluation] = useState<any>(null);
  const [engine, setEngine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [evaluationResult, engineResult] = await Promise.all([
        api.getModelEvaluation(),
        api.getAIStatus(),
      ]);
      setEvaluation(evaluationResult);
      setEngine(engineResult);
    } catch (e: any) {
      setError(e?.message || 'Unable to retrieve model diagnostics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  if (loading) return <main className="mx-auto flex min-h-[50vh] max-w-5xl items-center justify-center px-5"><div className="text-center"><RefreshCw className="mx-auto h-8 w-8 animate-spin text-teal-700" /><p className="mt-3 text-sm font-semibold text-slate-700">Loading model diagnostics…</p></div></main>;
  if (error || !evaluation || !engine) return <main className="mx-auto max-w-4xl px-5 py-16"><div className="rounded-2xl border border-rose-200 bg-white p-7 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-rose-600" /><h1 className="mt-3 text-xl font-bold text-slate-900">Model diagnostics unavailable</h1><p className="mt-2 text-sm text-slate-600">{error || 'No diagnostic response was returned.'}</p><button onClick={load} className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white">Retry</button></div></main>;

  const realReady = engine.mode === 'REAL' && engine.model_validation_approved === true && engine.model_validation_status === 'OPERATOR_APPROVED_NOT_INDEPENDENTLY_VERIFIED';

  return (
    <main className="flex-1 bg-slate-50 px-4 py-9 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl bg-[#0b2234] p-7 text-white sm:p-10">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-teal-200"><Cpu className="h-4 w-4" /> CivicLens research laboratory</div>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">AI model validation & runtime diagnostics</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">This page separates model availability, runtime configuration and scientific evaluation. A model loading successfully is not proof of detection accuracy.</p>
        </header>

        <section className={`rounded-2xl border p-5 sm:p-7 ${realReady ? 'border-amber-300 bg-amber-50' : 'border-rose-200 bg-white'}`}>
          <div className="flex items-start gap-3">
            {realReady ? <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" /> : <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-rose-600" />}
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">{realReady ? 'Model enabled by operator; independent validation outstanding' : 'Trained detector is not validated or enabled'}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">{engine.model_validation_reason || evaluation.evaluation_notice}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-600">Validation status: {engine.model_validation_status || evaluation.evaluation_status || 'UNKNOWN'}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active engine</p><p className="mt-2 text-base font-extrabold text-slate-950">{engine.model_name}</p><p className="mt-2 text-xs text-slate-500">Runtime mode: {engine.mode}</p></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Model artifact</p><p className="mt-2 text-2xl font-black tabular-nums text-slate-950">{Number(engine.model_artifact_size_bytes || 0).toLocaleString()} bytes</p><p className="mt-2 text-xs text-slate-500">{engine.weights_present ? 'Artifact file exists; provenance still needs validation.' : 'No model artifact is configured.'}</p></article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Execution provider</p><p className="mt-2 text-base font-extrabold text-slate-950">{engine.execution_providers?.join(', ') || 'Not initialized'}</p><p className="mt-2 text-xs text-slate-500">Configured input: {(engine.input_resolution || []).join(' × ') || 'Not reported'}</p></article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-2"><Database className="h-5 w-5 text-teal-700" /><h2 className="text-lg font-extrabold text-slate-950">Scientific evaluation status</h2></div>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-950">No verified benchmark results are available.</p>
            <p className="mt-2 text-sm leading-6 text-amber-900">{evaluation.evaluation_notice || 'A reproducible held-out test dataset, ground-truth annotations and evaluation report have not been supplied.'}</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {['mAP@0.50', 'mAP@0.50:0.95', 'Precision', 'Recall', 'F1 score', 'Confusion matrix', 'Per-class metrics', 'Latency benchmark'].map(label => <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-600">{label}</p><p className="mt-2 text-sm font-extrabold text-slate-400">Not measured</p></div>)}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-teal-700" /><h2 className="text-lg font-extrabold text-slate-950">What is required to validate the model?</h2></div>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
            <li>Provide the original trained weights and their training/export provenance.</li>
            <li>Provide a held-out labelled road-damage dataset that was not used for training.</li>
            <li>Verify the ONNX input/output tensor contract and decode detections using the model's actual export specification.</li>
            <li>Run a reproducible evaluation that reports mAP, precision, recall, F1, per-class metrics and confusion matrix.</li>
            <li>Record hardware, runtime version, preprocessing, thresholds and latency measurement method.</li>
          </ol>
        </section>
        <div className="flex justify-end"><button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /> Refresh diagnostics</button></div>
      </div>
    </main>
  );
};
