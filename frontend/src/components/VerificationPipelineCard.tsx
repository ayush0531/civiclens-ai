import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  MapPin,
  FileCheck2,
  Scale
} from 'lucide-react';
import { ReportVerificationStage } from '../types';

interface VerificationPipelineCardProps {
  stages?: ReportVerificationStage[];
  isLoading?: boolean;
}

export const VerificationPipelineCard: React.FC<VerificationPipelineCardProps> = ({
  stages = [],
  isLoading = false,
}) => {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  const getStageIcon = (stageNum: number) => {
    switch (stageNum) {
      case 1:
        return <FileCheck2 className="w-5 h-5" />;
      case 2:
        return <Cpu className="w-5 h-5" />;
      case 3:
        return <Scale className="w-5 h-5" />;
      case 4:
        return <MapPin className="w-5 h-5" />;
      case 5:
        return <Layers className="w-5 h-5" />;
      default:
        return <ShieldCheck className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASSED
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            ADVISORY / WARNING
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5" />
            PROCESSING
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stages || stages.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm text-center">
        <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-800">5-Stage Verification In Queue</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Audit telemetry stages will populate automatically once image quality and geospatial verification conclude.
        </p>
      </div>
    );
  }

  const passedCount = stages.filter((s) => s.status === 'PASSED').length;
  const warningCount = stages.filter((s) => s.status === 'WARNING').length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Civic Lens AI 5-Stage Verification Engine
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                AUDIT TRAIL
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Rigorous multimodal quality, computer vision, geospatial bounds & duplicate screening
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="px-2.5 py-1 rounded-md bg-emerald-100/70 text-emerald-800">
            {passedCount} / 5 Stages Certified
          </span>
          {warningCount > 0 && (
            <span className="px-2.5 py-1 rounded-md bg-amber-100/70 text-amber-800">
              {warningCount} Advisory
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {stages.map((stage) => {
          const isExpanded = expandedStage === stage.stage_number;
          let parsedEvidence: Record<string, any> = {};
          if (stage.evidence_json) {
            try {
              parsedEvidence = JSON.parse(stage.evidence_json);
            } catch {
              parsedEvidence = { raw: stage.evidence_json };
            }
          }

          return (
            <div key={stage.id || stage.stage_number} className="transition-colors hover:bg-slate-50/60">
              <button
                type="button"
                onClick={() => setExpandedStage(isExpanded ? null : stage.stage_number)}
                className="w-full text-left px-5 py-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`mt-0.5 p-1.5 rounded-md ${
                      stage.status === 'PASSED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : stage.status === 'WARNING'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {getStageIcon(stage.stage_number)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Stage {stage.stage_number}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {stage.stage_title}
                      </span>
                      {getStatusBadge(stage.status)}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">{stage.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                  {stage.confidence_score !== undefined && stage.confidence_score !== null && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold hidden sm:inline-block">
                      Conf: {(stage.confidence_score * 100).toFixed(0)}%
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-4 pt-1 bg-slate-50/50 text-xs border-t border-slate-100">
                  <div className="p-3 rounded-lg bg-white border border-slate-200/80 shadow-xs space-y-2">
                    <div>
                      <span className="font-semibold text-slate-800">Verification Summary: </span>
                      <span className="text-slate-600">{stage.summary}</span>
                    </div>

                    {stage.failure_reason && (
                      <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                        <span className="font-bold">Failure Notice: </span>
                        {stage.failure_reason}
                      </div>
                    )}

                    {Object.keys(parsedEvidence).length > 0 && (
                      <div>
                        <div className="font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                          <span>Technical Telemetry Evidence:</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Executed {new Date(stage.executed_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] bg-slate-50 p-2.5 rounded border border-slate-200/60">
                          {Object.entries(parsedEvidence).map(([key, value]) => {
                            if (key === 'bounding_boxes' || typeof value === 'object') {
                              return null; // hide nested complex structures
                            }
                            return (
                              <div key={key} className="flex justify-between gap-2 overflow-hidden">
                                <span className="text-slate-500 truncate">{key}:</span>
                                <span className="font-semibold text-slate-800 truncate">
                                  {String(value)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VerificationPipelineCard;
