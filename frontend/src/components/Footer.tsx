import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cpu, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-navy-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Platform Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight">CivicLens AI</span>
              <span className="bg-teal-500/20 text-teal-300 font-mono text-[10px] px-2 py-0.5 rounded border border-teal-500/30">
                Civic Prototype
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              AI-powered civic infrastructure intelligence and municipal road-damage grievance management for Nagpur, Maharashtra.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-teal-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>Pilot Deployment Area: Nagpur Municipal Corporation (10 Administrative Zones)</span>
            </div>
          </div>

          {/* Platform Navigation */}
          <div>
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3">Platform & Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="hover:text-teal-400 transition-colors">About CivicLens AI</Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-teal-400 transition-colors">Track Complaint</Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-teal-400 transition-colors">Nagpur Defect Map</Link>
              </li>
              <li>
                <Link to="/analytics" className="hover:text-teal-400 transition-colors">Analytics & Trends</Link>
              </li>
            </ul>
          </div>

          {/* Prototype Notice */}
          <div>
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3">System Notice</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              CivicLens AI is an engineering prototype designed to assist municipal road maintenance decision-making. Citizen grievances remain recorded within the system until official handoff to the NMC portal.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-teal-400">
              <Cpu className="w-3.5 h-3.5 text-teal-400" />
              <span>Computer Vision Triage & Priority Dispatch</span>
            </div>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <p>CivicLens AI | Intelligent Road Damage Detection</p>
          <p className="text-slate-500">
            Nagpur Municipal Pilot • Grievance Intelligence System
          </p>
        </div>
      </div>
    </footer>
  );
};
