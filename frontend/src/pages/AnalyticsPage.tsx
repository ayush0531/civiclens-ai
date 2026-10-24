import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  MapPin, 
  Layers, 
  AlertTriangle, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';
import { api } from '../services/api';
import { AnalyticsTrends, OverviewStats } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [trendsData, overviewData] = await Promise.all([
          api.getAnalyticsTrends(),
          api.getOverviewStats(),
        ]);
        setTrends(trendsData);
        setOverview(overviewData);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-slate-50">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const categoryChartData = trends?.categories.map((c) => ({
    name: c.category,
    count: c.count,
    pct: c.percentage,
  })) || [];

  const severityChartData = trends?.severities.map((s) => ({
    name: s.level,
    value: s.count,
    color: s.color,
  })) || [];

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Database Aggregations</span>
            </div>
            <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">Infrastructure Analytics & Defect Trends</h1>
            <p className="text-xs text-slate-500 mt-1">
              Dynamic statistical metrics derived from active database records across Nagpur municipal zones.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
              Active Engine: {overview?.ai_model_name}
            </span>
          </div>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Defect Reports</span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{overview?.total_reports ?? 0}</div>
            <span className="text-[10px] text-teal-600">Database verified</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Critical Severity Cases</span>
            <div className="text-2xl font-bold font-mono text-rose-700 mt-1">{overview?.critical_severity_count ?? 0}</div>
            <span className="text-[10px] text-slate-400">Score &gt;= 75.0</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Repairs Resolved</span>
            <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">{overview?.resolved_count ?? 0}</div>
            <span className="text-[10px] text-slate-400">Closure audit on file</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Average Resolution</span>
            <div className="text-2xl font-bold font-mono text-teal-700 mt-1">{overview?.average_resolution_hours ?? 0}h</div>
            <span className="text-[10px] text-slate-400">From submission to fix</span>
          </div>
        </div>

        {/* Charts Row 1: Category Distribution & Severity Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Category Bar Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                Damage Category Frequency Distribution
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">Count</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-25} 
                    textAnchor="end" 
                    interval={0} 
                    tick={{ fontSize: 10, fill: '#64748B' }} 
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                    formatter={(val: any) => [`${val} reports`, 'Count']}
                  />
                  <Bar dataKey="count" fill="#0D9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Severity Donut Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-teal-600" />
                Defect Severity Level Proportion
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">Severity</span>
            </div>

            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px' }}
                    formatter={(val: any, name: any) => [`${val} reports`, name]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    formatter={(val) => <span style={{ fontSize: '11px', color: '#334155', fontWeight: 600 }}>{val}</span>} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Charts Row 2: Monthly Submission vs Resolution Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Monthly Civic Intake vs Resolution Throughput
              </h2>
              <p className="text-xs text-slate-500">Defect volume logged by citizens compared against completed maintenance closures</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends?.monthly_trends || []} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '12px' }} />
                <Legend verticalAlign="top" align="right" height={30} />
                <Area type="monotone" dataKey="submitted" name="Reports Submitted" stroke="#0D9488" fillOpacity={1} fill="url(#colorSub)" strokeWidth={2} />
                <Area type="monotone" dataKey="resolved" name="Repairs Resolved" stroke="#10B981" fillOpacity={1} fill="url(#colorRes)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Hotspot Cluster Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-600" />
              Nagpur Geographic Hotspot Clustering
            </h2>
            <span className="text-xs text-slate-500">Ranked by Defect Density</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Area / Corridor</th>
                  <th className="px-4 py-3 text-center">Defect Count</th>
                  <th className="px-4 py-3 text-center">Avg Severity</th>
                  <th className="px-4 py-3">Coordinates</th>
                  <th className="px-4 py-3 text-right">Municipal Attention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trends?.hotspots.map((hotspot) => (
                  <tr key={hotspot.area_name} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {hotspot.area_name}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                      {hotspot.report_count}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        hotspot.average_severity >= 65 ? 'bg-rose-100 text-rose-800' :
                        hotspot.average_severity >= 45 ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {hotspot.average_severity.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {hotspot.latitude.toFixed(4)}°N, {hotspot.longitude.toFixed(4)}°E
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                        {hotspot.report_count >= 3 ? 'Immediate Intervention' : 'Monitored'}
                      </span>
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
