import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, BarChart3, Camera, CheckCircle2, ClipboardList, Cpu, MapPin, Search, ShieldCheck, Waves } from 'lucide-react';
import { api } from '../services/api';
import { OverviewStats } from '../types';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickTrackId, setQuickTrackId] = useState('');

  useEffect(() => {
    let active = true;
    api.getOverviewStats()
      .then((data) => { if (active) setStats(data); })
      .catch((error) => console.error('Overview metrics unavailable', error))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const track = (event: React.FormEvent) => {
    event.preventDefault();
    if (quickTrackId.trim()) navigate(`/track/${encodeURIComponent(quickTrackId.trim())}`);
  };

  const metrics = [
    { label: 'Reports recorded', value: stats?.total_reports, note: 'Civic Lens AI database' },
    { label: 'High-priority cases', value: stats?.critical_severity_count, note: 'Severity classification' },
    { label: 'Assigned cases', value: stats?.assigned_count, note: 'Internal workflow' },
    { label: 'Resolved internally', value: stats?.resolved_count, note: 'Civic Lens AI status' },
  ];

  const engineIsReal = stats?.ai_inference_mode === 'REAL';

  return (
    <main className="flex-1 bg-[#f5f8fa] text-slate-900">
      <section className="relative overflow-hidden bg-[#071b2b] text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(45,212,191,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,.16) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute -top-40 right-[-8rem] h-[34rem] w-[34rem] rounded-full bg-teal-400/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-300/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.18em] text-teal-200">
              <span className="h-2 w-2 rounded-full bg-teal-300" /> AI-Powered Road Intelligence · Nagpur Municipal Prototype
            </div>
            <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              See the road.
              <span className="block text-teal-300">Understand the damage.</span>
              Prioritize the response.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Civic Lens AI is a research prototype for photo-based road-defect assessment, geospatial duplicate screening and explainable maintenance prioritization across Nagpur.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/report-new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-400 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-teal-950/30 transition hover:bg-teal-300">
                <Camera className="h-4 w-4" /> Create a road report <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/map" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
                <MapPin className="h-4 w-4" /> Explore defect map
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-300" /> Research / demonstration environment</span>
              <span className="inline-flex items-center gap-2"><Waves className="h-4 w-4 text-teal-300" /> Nagpur, Maharashtra</span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/[.07] p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-teal-200">System snapshot</p>
                <h2 className="mt-1 text-xl font-bold">Civic infrastructure intelligence</h2>
              </div>
              <Activity className="h-6 w-6 text-teal-300" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {metrics.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                  <p className="text-2xl font-black tabular-nums text-white">{loading ? '—' : (item.value ?? 0)}</p>
                  <p className="mt-1 text-xs font-bold text-slate-200">{item.label}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{item.note}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-teal-300/20 bg-teal-300/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-teal-100">Image analysis engine</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${engineIsReal ? 'bg-emerald-300/20 text-emerald-200' : 'bg-amber-300/20 text-amber-100'}`}>
                  {loading ? 'CHECKING' : engineIsReal ? 'ONNX MODEL' : 'RESEARCH MODE'}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-300">
                {loading ? 'Reading live engine configuration…' : engineIsReal ? (stats?.ai_model_name || 'ONNX inference active') : 'The deployed environment uses image-feature heuristics unless trained ONNX weights are loaded. Results are experimental, not validated predictions.'}
              </p>
            </div>
            <Link to="/analytics" className="mt-5 flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/5">
              View system analytics <ArrowRight className="h-4 w-4 text-teal-300" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-teal-700">Designed as an engineering workflow</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">From a road photograph to a prioritized case.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">Each stage produces a traceable output for the next stage. Citizens can track the Civic Lens AI record; authorized staff can review, assign and update cases within the prototype.</p>
            <form onSubmit={track} className="mt-7 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <label htmlFor="quick-track" className="sr-only">Civic Lens AI reference number</label>
              <div className="flex gap-2">
                <input id="quick-track" value={quickTrackId} onChange={(e) => setQuickTrackId(e.target.value)} placeholder="Enter Civic Lens AI reference…" className="min-w-0 flex-1 rounded-xl px-3 py-3 text-sm outline-none placeholder:text-slate-400" />
                <button type="submit" disabled={!quickTrackId.trim()} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white transition hover:bg-teal-800 disabled:opacity-40"><Search className="h-4 w-4" /> Track</button>
              </div>
            </form>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { n: '01', icon: Camera, title: 'Evidence capture', body: 'Upload a road image and preserve the original evidence with the incident record.' },
              { n: '02', icon: MapPin, title: 'Location context', body: 'Add locality, landmark and coordinates to place the defect in a geographic context.' },
              { n: '03', icon: Cpu, title: 'Computer-vision assessment', body: 'Run the configured inference engine once, retain its mode, outputs and limitations.' },
              { n: '04', icon: Activity, title: 'Severity & priority', body: 'Calculate an explainable maintenance-priority score and screen nearby reports for duplicates.' },
              { n: '05', icon: ClipboardList, title: 'Case review & tracking', body: 'Create a Civic Lens AI reference and follow its internal status and audit trail.' },
              { n: '06', icon: ShieldCheck, title: 'Government handoff', body: 'Prepare a structured complaint summary. Official NMC registration remains separate until authorized integration is available.' },
            ].map((step) => (
              <article key={step.n} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-widest text-teal-700">{step.n}</span>
                  <step.icon className="h-5 w-5 text-slate-400 transition group-hover:text-teal-600" />
                </div>
                <h3 className="mt-4 text-sm font-extrabold text-slate-950">{step.title}</h3>
                <p className="mt-2 text-xs leading-6 text-slate-600">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-12 sm:px-8 md:grid-cols-3">
          {[
            { to: '/authority', icon: ClipboardList, title: 'Authority workspace', body: 'Review the queue, filter by urgency and manage internal case progress.' },
            { to: '/map', icon: MapPin, title: 'Geospatial view', body: 'Explore report locations and spatial clusters on the Nagpur map.' },
            { to: '/lab', icon: BarChart3, title: 'Model & methodology lab', body: 'Inspect engine configuration, evaluation information and research assumptions.' },
          ].map((item) => (
            <Link key={item.to} to={item.to} className="flex gap-4 rounded-2xl border border-slate-200 p-5 transition hover:border-teal-300 hover:bg-teal-50/40">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><item.icon className="h-5 w-5" /></div>
              <div><h3 className="text-sm font-extrabold text-slate-950">{item.title}</h3><p className="mt-1 text-xs leading-6 text-slate-600">{item.body}</p></div>
            </Link>
          ))}
        </div>
      </section>

    </main>
  );
};
