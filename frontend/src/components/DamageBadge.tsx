import React from 'react';
import { AlertCircle, Activity, GitCommit, Layers, AlertTriangle } from 'lucide-react';
import { DamageCategory } from '../types';

interface Props {
  category: DamageCategory | string;
  size?: 'sm' | 'md' | 'lg';
}

export const DamageBadge: React.FC<Props> = ({ category, size = 'md' }) => {
  const getBadgeStyle = () => {
    switch (category) {
      case 'Pothole':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: AlertCircle,
          dot: 'bg-rose-500',
        };
      case 'Alligator cracking':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          icon: Activity,
          dot: 'bg-orange-500',
        };
      case 'Transverse crack':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: GitCommit,
          dot: 'bg-amber-500',
        };
      case 'Longitudinal crack':
        return {
          bg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
          icon: GitCommit,
          dot: 'bg-yellow-500',
        };
      case 'Surface deterioration':
        return {
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-200',
          icon: Layers,
          dot: 'bg-cyan-500',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: AlertTriangle,
          dot: 'bg-slate-400',
        };
    }
  };

  const { bg, icon: Icon, dot } = getBadgeStyle();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${bg} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{category}</span>
    </span>
  );
};
