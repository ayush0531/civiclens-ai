import React from 'react';

interface Props {
  score: number;
  showLabel?: boolean;
}

export const PriorityBadge: React.FC<Props> = ({ score, showLabel = true }) => {
  let color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let label = 'Low';

  if (score >= 75) {
    color = 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-400';
    label = 'Critical';
  } else if (score >= 50) {
    color = 'bg-orange-50 text-orange-700 border-orange-200';
    label = 'High';
  } else if (score >= 25) {
    color = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'Moderate';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${color}`}>
      <span className="font-mono">{score.toFixed(1)}</span>
      {showLabel && <span className="text-[10px] uppercase font-bold tracking-tight opacity-80">({label})</span>}
    </div>
  );
};
