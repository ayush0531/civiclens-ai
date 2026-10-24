import React from 'react';
import { ShieldCheck, Cpu, MapPin, ExternalLink, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-navy-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Project Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight">CivicLens AI</span>
              <span className="bg-teal-500/20 text-teal-300 font-mono text-[10px] px-2 py-0.5 rounded border border-teal-500/30">
                Capstone Prototype v1.0
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Intelligent Road Damage Detection and Maintenance Prioritization System. Final-Year B.Tech Artificial Intelligence Capstone Project.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-teal-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>Pilot Deployment Area: Nagpur Metro (Maharashtra, India)</span>
            </div>
          </div>

          {/* Academic Evaluation Links */}
          <div>
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3">Academic Research</h4>
            <ul className="space-y-2">
              <li>
                <a href="/about" className="hover:text-teal-400 transition-colors">AI Methodology & Taxonomy</a>
              </li>
              <li>
                <a href="/about#severity" className="hover:text-teal-400 transition-colors">Severity Mathematical Model</a>
              </li>
              <li>
                <a href="/about#priority" className="hover:text-teal-400 transition-colors">Explainable Priority Engine</a>
              </li>
              <li>
                <a href="/docs" target="_blank" rel="noreferrer" className="hover:text-teal-400 transition-colors inline-flex items-center gap-1">
                  <span>FastAPI Swagger Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Prototype Disclaimer */}
          <div>
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3">Prototype Notice</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              This system is an academic research demonstration designed to assist municipal engineering decision-making. Recommendations are advisory heuristics.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
              <Cpu className="w-3.5 h-3.5 text-teal-500" />
              <span>Computer Vision Heuristic Inference Mode</span>
            </div>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <p>&copy; {new Date().getFullYear()} CivicLens AI — Final Year Engineering Project. Open-source prototype.</p>
          <p className="flex items-center gap-1">
            Developed with <Heart className="w-3 h-3 text-rose-500 inline" /> for Smarter Indian Municipal Infrastructure
          </p>
        </div>
      </div>
    </footer>
  );
};
