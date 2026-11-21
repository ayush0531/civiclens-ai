import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin, ArrowRight, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { api } from '../services/api';
import { RoadDamageReport } from '../types';
import { DamageBadge, SeverityBadge } from './DamageBadge';
import { PriorityBadge } from './PriorityBadge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RoadDamageReport[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      loadInitialResults();
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  const loadInitialResults = async () => {
    try {
      setLoading(true);
      const res = await api.getReports({ limit: 6, sort_by: 'priority_score', order: 'desc' });
      setResults(res);
    } catch (err) {
      console.error('Failed to load search results', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.getReports({
          search: query.trim() || undefined,
          limit: 8,
          sort_by: 'priority_score',
          order: 'desc'
        });
        setResults(res);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (reportId: number) => {
    onClose();
    navigate(`/case/${reportId}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-teal-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports by ID (REP-2026-...), street, landmark, or category..."
            className="w-full bg-transparent border-0 outline-none text-slate-800 placeholder-slate-400 text-sm font-medium"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-200/70 rounded">
            ESC
          </span>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
          {loading && (
            <div className="py-8 text-center text-slate-400 text-sm">
              <div className="inline-block w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p>Scanning civic database...</p>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-sm">No matching reports found</p>
              <p className="text-xs text-slate-400 mt-1">Try searching for "Wardha Road", "Sitabuldi", or "Pothole"</p>
            </div>
          )}

          {!loading && results.map((report) => (
            <div
              key={report.id}
              onClick={() => handleSelect(report.id)}
              className="p-3.5 hover:bg-teal-50/40 cursor-pointer transition-colors flex items-center justify-between group"
            >
              <div className="space-y-1.5 max-w-[80%]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-navy-900 group-hover:text-teal-700 transition-colors">
                    {report.reference_number}
                  </span>
                  <DamageBadge category={report.predicted_damage_category} />
                  <SeverityBadge level={report.severity_level} />
                  {report.is_duplicate && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      Duplicate Linked
                    </span>
                  )}
                </div>

                <p className="text-xs font-medium text-slate-700 line-clamp-1">
                  {report.title}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {report.address_text || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-medium">Priority</div>
                  <PriorityBadge score={report.priority_score} />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            Civic Lens AI Global Index
          </span>
          <span>Click report to open maintenance dispatch record</span>
        </div>
      </div>
    </div>
  );
};
