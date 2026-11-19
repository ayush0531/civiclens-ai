export type UserRole = 'citizen' | 'authority' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type DamageCategory = 
  | 'Pothole'
  | 'Longitudinal crack'
  | 'Transverse crack'
  | 'Alligator cracking'
  | 'Surface deterioration'
  | 'Other / uncertain'
  | 'Unanalyzed';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'PENDING';

export type WorkflowStatus = 
  | 'SAVED'
  | 'SUBMITTED'
  | 'AWAITING_OFFICIAL_REGISTRATION'
  | 'OFFICIAL_REFERENCE_RECORDED'
  | 'MONITORING'
  | 'UNDER_REVIEW'
  | 'ACTION_PLANNED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED_INTERNAL'
  | 'REJECTED';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

export interface AIAnalysis {
  id: number;
  report_id: number;
  model_identifier: string;
  model_version: string;
  inference_mode: string;
  predicted_classes: string[];
  confidence_scores: number[];
  bounding_boxes: BoundingBox[];
  severity_breakdown: Record<string, any>;
  analysis_metadata?: Record<string, any>;
  inference_duration_ms: number;
  is_demo_result: boolean;
  disclaimer: string;
  created_at: string;
}

export interface MaintenanceAssignment {
  id: number;
  report_id: number;
  assigned_by_id: number;
  assigned_by_name?: string | null;
  assigned_to_id: number;
  assigned_to_name?: string | null;
  notes?: string | null;
  priority_level: string;
  assignment_status: string;
  target_completion_date?: string | null;
  assigned_at: string;
  completed_at?: string | null;
}

export interface StatusHistoryItem {
  id: number;
  report_id: number;
  previous_status: string;
  new_status: string;
  changed_by_name?: string | null;
  changed_by_role?: string | null;
  notes?: string | null;
  timestamp: string;
}

export interface DuplicateCandidate {
  candidate_report_id: number;
  reference_number: string;
  title: string;
  distance_meters: number;
  days_ago: number;
  visual_similarity: number;
  match_score: number;
  is_probable_duplicate: boolean;
  category: string;
  workflow_status: string;
}

export interface RoadDamageReport {
  id: number;
  reference_number: string;
  reporter_id?: number | null;
  reporter_name?: string | null;
  reporter_contact?: string | null;
  title: string;
  description?: string | null;
  image_path: string;
  annotated_image_path?: string | null;
  latitude: number;
  longitude: number;
  address_text?: string | null;
  landmark?: string | null;
  area_locality?: string | null;
  city?: string | null;
  incident_date?: string | null;
  road_classification: string;
  predicted_damage_category: DamageCategory;
  prediction_confidence: number;
  severity_score: number;
  severity_level: SeverityLevel;
  priority_score: number;
  workflow_status: WorkflowStatus;
  assigned_authority_id?: number | null;
  assigned_authority_name?: string | null;
  duplicate_reference_id?: number | null;
  is_duplicate: boolean;
  duplicate_confidence: number;
  external_submission_status?: string | null;
  external_submission_label?: string | null;
  internal_status_label?: string | null;
  official_portal_url?: string | null;
  pwd_toll_free_number?: string | null;
  pwd_portal_url?: string | null;
  external_reference_id?: string | null;
  external_reference_notes?: string | null;
  external_reference_recorded_at?: string | null;
  road_jurisdiction?: string | null;
  is_demo_data: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicTrackReport {
  id: number;
  reference_number: string;
  title: string;
  description?: string | null;
  image_path: string;
  annotated_image_path?: string | null;
  latitude: number;
  longitude: number;
  address_text?: string | null;
  landmark?: string | null;
  area_locality?: string | null;
  city?: string | null;
  road_classification: string;
  road_jurisdiction?: string | null;
  predicted_damage_category: DamageCategory;
  prediction_confidence: number;
  severity_score: number;
  severity_level: SeverityLevel;
  priority_score: number;
  workflow_status: WorkflowStatus;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  resolution_notes?: string | null;
  resolution_image_path?: string | null;
  status_history: StatusHistoryItem[];
  analyses: AIAnalysis[];
  external_reference_id?: string | null;
  external_reference_notes?: string | null;
  external_reference_recorded_at?: string | null;
  external_submission_status: string;
  external_submission_label?: string;
  internal_status_label?: string;
  official_portal_url?: string;
  pwd_toll_free_number?: string;
  pwd_portal_url?: string;
  external_submission_notice: string;
}

export interface NMCIntegrationSpec {
  current_mode: string;
  is_direct_api_active: boolean;
  reason: string;
  requirements_for_real_integration: string[];
  official_portal_url: string;
  pwd_helpline: string;
}

export interface ExternalReferencePayload {
  external_reference_id: string;
  notes?: string;
  road_jurisdiction?: string;
}

export interface QuickInspectResult {
  predicted_damage_category: string;
  prediction_confidence: number;
  severity_score: number;
  severity_level: SeverityLevel;
  severity_breakdown: Record<string, any>;
  bounding_boxes: BoundingBox[];
  annotated_image_path: string;
  inference_duration_ms: number;
  inference_mode: string;
  model_identifier: string;
  is_demo_result: boolean;
  disclaimer: string;
}

export interface ReportDetail extends RoadDamageReport {
  analyses: AIAnalysis[];
  assignments: MaintenanceAssignment[];
  status_history: StatusHistoryItem[];
  resolution_notes?: string | null;
  resolution_image_path?: string | null;
  resolved_at?: string | null;
  priority_breakdown?: Record<string, any>;
  duplicate_candidates?: DuplicateCandidate[];
}

export interface MapMarkerItem {
  id: number;
  reference_number: string;
  title: string;
  latitude: number;
  longitude: number;
  address_text?: string | null;
  predicted_damage_category: string;
  severity_score: number;
  severity_level: string;
  priority_score: number;
  workflow_status: string;
  image_path: string;
  created_at: string;
}

export interface SpatialCluster {
  cluster_id: number;
  area_name: string;
  centroid_latitude: number;
  centroid_longitude: number;
  radius_meters: number;
  report_count: number;
  average_severity: number;
  hazard_level: string;
  dominant_category: string;
  report_ids: number[];
  reference_numbers: string[];
}

export interface OverviewStats {
  total_reports: number;
  pending_review: number;
  assigned_count: number;
  in_progress_count: number;
  resolved_count: number;
  rejected_count: number;
  critical_severity_count: number;
  average_resolution_hours: number;
  ai_inference_mode: string;
  ai_model_name: string;
}

export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export interface SeverityStat {
  level: string;
  count: number;
  color: string;
}

export interface HotspotArea {
  area_name: string;
  report_count: number;
  average_severity: number;
  latitude: number;
  longitude: number;
}

export interface MonthlyTrend {
  month: string;
  submitted: number;
  resolved: number;
}

export interface AnalyticsTrends {
  categories: CategoryStat[];
  severities: SeverityStat[];
  hotspots: HotspotArea[];
  monthly_trends: MonthlyTrend[];
  priority_distribution: { range: string; count: number }[];
}

export interface AuditLogItem {
  id: number;
  actor_id?: number | null;
  actor_name?: string | null;
  action: string;
  target_type: string;
  target_id: string;
  metadata_json?: string | null;
  ip_address?: string | null;
  timestamp: string;
}

export interface PerClassMetric {
  class_name: string;
  code: string;
  samples: number;
  precision: number;
  recall: number;
  f1_score: number;
  map_50: number;
}

export interface ModelEvaluationData {
  evaluation_status?: string;
  evaluation_notice?: string;
  model_metadata: {
    architecture: string;
    framework: string;
    weights_file: string;
    dataset_name: string;
    dataset_size_images: number;
    validation_size_images: number;
    input_resolution: string;
    quantization: string;
    training_epochs: number;
    batch_size: number;
    evaluation_date: string;
  };
  overall_metrics: {
    map_50: number;
    map_50_95: number;
    precision: number;
    recall: number;
    f1_score: number;
    mean_latency_ms: number;
    p90_latency_ms: number;
    p99_latency_ms: number;
    fps_cpu: number;
    model_size_mb: number;
  };
  per_class_metrics: PerClassMetric[];
  confusion_matrix: {
    classes: string[];
    matrix: number[][];
  };
  training_history: {
    epoch: number;
    box_loss: number;
    cls_loss: number;
    map_50: number;
  }[];
}

export interface PriorityPolicyData {
  policy: Record<string, number>;
  weights_description: Record<string, string>;
}
