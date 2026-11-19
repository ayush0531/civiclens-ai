import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HardHat, Sparkles, Calendar, Layers } from 'lucide-react';
import { RepairResolutionEvidence } from '../types';
import { getImageUrl } from '../services/api';

interface RepairComparisonCardProps {
  evidence?: RepairResolutionEvidence;
  beforeImagePath?: string;
  afterImagePath?: string;
}

export const RepairComparisonCard: React.FC<RepairComparisonCardProps> = ({
  evidence,
  beforeImagePath,
  afterImagePath,
}) => {
  const beforeUrl = getImageUrl(beforeImagePath || evidence?.before_image_path);
  const afterUrl = getImageUrl(afterImagePath || evidence?.after_image_path);

  if (!beforeUrl && !afterUrl && !evidence) {
    return null;
  }

  const status = evidence?.resolution_status || 'VERIFIED_REPAIRED';
  const residualScore = evidence?.residual_damage_score ?? 12.0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Before & After Repair AI Quality Audit
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                AI CERTIFIED
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Photogrammetric surface inspection and residual distress telemetry
            </p>
          </div>
        </div>
        <div>
          {status === 'VERIFIED_REPAIRED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              Repair Certified (Residual: {residualScore.toFixed(1)}/100)
            </span>
          )}
          {status === 'PARTIAL_REPAIR_DETECTED' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-4 h-4" />
              Partial Repair (Residual: {residualScore.toFixed(1)}/100)
            </span>
          )}
          {status === 'DEFECT_REMAINS_ACTIVE' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <XCircle className="w-4 h-4" />
              Distress Unresolved ({residualScore.toFixed(1)}/100)
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Before Photo */}
          <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900 flex flex-col">
            <div className="px-3 py-2 bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                PRE-REPAIR DEFECT (INITIAL CITIZEN REPORT)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">BEFORE</span>
            </div>
            <div className="aspect-4/3 relative bg-slate-950 flex items-center justify-center">
              {beforeUrl ? (
                <img
                  src={beforeUrl}
                  alt="Pre-repair road defect"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-slate-500 text-xs">Initial image unavailable</div>
              )}
            </div>
          </div>

          {/* After Photo */}
          <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-900 flex flex-col">
            <div className="px-3 py-2 bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                POST-REPAIR RESTORATION (MUNICIPAL PATCH)
              </span>
              <span className="text-[11px] text-emerald-400 font-mono">AFTER RESOLUTION</span>
            </div>
            <div className="aspect-4/3 relative bg-slate-950 flex items-center justify-center">
              {afterUrl ? (
                <img
                  src={afterUrl}
                  alt="Post-repair restored road"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-slate-500 text-xs">Resolution image pending</div>
              )}
            </div>
          </div>
        </div>

        {/* Resolution Technical Metadata */}
        {evidence && (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <HardHat className="w-4 h-4 text-slate-500" />
              <div>
                <div className="text-slate-500 text-[11px]">Contractor / Division</div>
                <div className="font-semibold text-slate-800">
                  {evidence.contractor_name || 'NMC Pavement Maintenance Wing'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <div>
                <div className="text-slate-500 text-[11px]">Material Specification</div>
                <div className="font-semibold text-slate-800">
                  {evidence.asphalt_mix_type || 'Bituminous Concrete (Grade 2)'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <div>
                <div className="text-slate-500 text-[11px]">Inspection Certified At</div>
                <div className="font-semibold text-slate-800 font-mono">
                  {new Date(evidence.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {evidence.inspection_notes && (
              <div className="sm:col-span-3 pt-2 border-t border-slate-200/60 text-slate-600">
                <span className="font-semibold text-slate-800">Supervisory Notes: </span>
                {evidence.inspection_notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RepairComparisonCard;
