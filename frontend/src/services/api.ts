import {
  AuthResponse,
  User,
  RoadDamageReport,
  ReportDetail,
  PublicTrackReport,
  QuickInspectResult,
  ExternalReferencePayload,
  NMCIntegrationSpec,
  MapMarkerItem,
  SpatialCluster,
  OverviewStats,
  AnalyticsTrends,
  AuditLogItem,
  AIAnalysis,
  ModelEvaluationData,
  PriorityPolicyData
} from '../types';

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL || '';
const API_BASE = VITE_API_URL ? `${VITE_API_URL.replace(/\/$/, '')}/api/v1` : '/api/v1';

export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (VITE_API_URL) {
    return `${VITE_API_URL.replace(/\/$/, '')}${cleanPath}`;
  }
  return cleanPath;
};

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('civiclens_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers = new Headers(options.headers || {});

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `Request failed (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  // --- Auth Endpoints ---
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(data: { name: string; email: string; password: string; role?: string; department?: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // --- Reports Endpoints ---
  async getReports(params?: {
    category?: string;
    severity_level?: string;
    workflow_status?: string;
    search?: string;
    is_duplicate?: boolean;
    my_reports_only?: boolean;
    sort_by?: string;
    order?: string;
    page?: number;
    limit?: number;
  }): Promise<RoadDamageReport[]> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, String(val));
        }
      });
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<RoadDamageReport[]>(`/reports${qs}`);
  }

  async getReport(id: number): Promise<ReportDetail> {
    return this.request<ReportDetail>(`/reports/${id}`);
  }

  async trackReport(identifier: string): Promise<PublicTrackReport> {
    return this.request<PublicTrackReport>(`/reports/track/${encodeURIComponent(identifier.trim())}`);
  }

  async recordExternalReference(id: number, data: ExternalReferencePayload): Promise<ReportDetail> {
    return this.request<ReportDetail>(`/reports/${id}/external-reference`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getComplaintSummaryText(id: number): Promise<string> {
    const res = await fetch(`${API_BASE}/reports/${id}/summary-text`);
    if (!res.ok) throw new Error('Failed to download complaint summary');
    return res.text();
  }

  async getNMCIntegrationSpec(): Promise<NMCIntegrationSpec> {
    return this.request<NMCIntegrationSpec>('/reports/nmc/integration-spec');
  }

  async createReport(formData: FormData): Promise<ReportDetail> {
    return this.request<ReportDetail>('/reports', {
      method: 'POST',
      body: formData,
    });
  }

  async updateReport(id: number, data: { title?: string; description?: string; road_classification?: string }): Promise<RoadDamageReport> {
    return this.request<RoadDamageReport>(`/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteReport(id: number): Promise<void> {
    return this.request<void>(`/reports/${id}`, {
      method: 'DELETE',
    });
  }

  async linkDuplicate(id: number, targetReportId: number): Promise<ReportDetail> {
    return this.request<ReportDetail>(`/reports/${id}/link-duplicate`, {
      method: 'POST',
      body: JSON.stringify({ target_report_id: targetReportId }),
    });
  }

  // --- AI Analysis & Lab ---
  async quickInspectImage(file: File): Promise<QuickInspectResult> {
    const formData = new FormData();
    formData.append('image', file);
    return this.request<QuickInspectResult>('/ai/quick-inspect', {
      method: 'POST',
      body: formData,
    });
  }

  async runAnalysis(id: number): Promise<AIAnalysis> {
    return this.request<AIAnalysis>(`/reports/${id}/analyze`, {
      method: 'POST',
    });
  }

  async getModelEvaluation(): Promise<ModelEvaluationData> {
    return this.request<ModelEvaluationData>('/ai/evaluation');
  }

  async getAIStatus(): Promise<any> {
    return this.request('/ai/status');
  }

  async setAIMode(mode: 'REAL' | 'DEMO'): Promise<any> {
    return this.request('/ai/mode', {
      method: 'POST',
      body: JSON.stringify({ mode }),
    });
  }

  // --- Workflow & Assignments ---
  async assignReport(id: number, data: { assigned_to_id: number; notes?: string; priority_level?: string }): Promise<any> {
    return this.request(`/reports/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async transitionStatus(id: number, data: { new_status: string; notes?: string }): Promise<ReportDetail> {
    return this.request<ReportDetail>(`/reports/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resolveReport(id: number, formData: FormData): Promise<ReportDetail> {
    return this.request<ReportDetail>(`/reports/${id}/resolve`, {
      method: 'POST',
      body: formData,
    });
  }

  // --- Geospatial Map & Clusters ---
  async getMapMarkers(params?: { category?: string; severity_level?: string; workflow_status?: string }): Promise<MapMarkerItem[]> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) query.set(k, v);
      });
    }
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<MapMarkerItem[]>(`/map/reports${qs}`);
  }

  async getSpatialClusters(radiusMeters: number = 450.0, minPoints: number = 2): Promise<SpatialCluster[]> {
    return this.request<SpatialCluster[]>(`/map/clusters?radius_meters=${radiusMeters}&min_points=${minPoints}`);
  }

  // --- Analytics & KPIs ---
  async getOverviewStats(): Promise<OverviewStats> {
    return this.request<OverviewStats>('/analytics/overview');
  }

  async getAnalyticsTrends(): Promise<AnalyticsTrends> {
    return this.request<AnalyticsTrends>('/analytics/trends');
  }

  // --- Admin & Policy Governance ---
  async getAllUsers(): Promise<User[]> {
    return this.request<User[]>('/admin/users');
  }

  async updateUserRole(id: number, data: { role: string; is_active?: boolean; department?: string }): Promise<User> {
    return this.request<User>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getPriorityPolicy(): Promise<PriorityPolicyData> {
    return this.request<PriorityPolicyData>('/admin/priority-policy');
  }

  async updatePriorityPolicy(weights: Record<string, number>): Promise<any> {
    return this.request('/admin/priority-policy', {
      method: 'PUT',
      body: JSON.stringify(weights),
    });
  }

  async reseedDatabase(): Promise<any> {
    return this.request('/admin/reseed', {
      method: 'POST',
    });
  }

  async getSystemStatus(): Promise<any> {
    return this.request('/admin/system-status');
  }

  // --- Audit Trails ---
  async getAuditLogs(action?: string, limit: number = 50): Promise<AuditLogItem[]> {
    const query = new URLSearchParams({ limit: String(limit) });
    if (action) query.set('action', action);
    return this.request<AuditLogItem[]>(`/audit-logs?${query.toString()}`);
  }

  // --- NMC Integration & Municipal Operations ---
  async submitToNMC(id: number, idempotencyKey?: string, notes?: string): Promise<ReportDetail> {
    const query = new URLSearchParams();
    if (idempotencyKey) query.set('idempotency_key', idempotencyKey);
    if (notes) query.set('notes', notes);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<ReportDetail>(`/reports/${id}/submit-nmc${qs}`, {
      method: 'POST',
    });
  }

  async verifyRepair(id: number, fileOrFormData: File | FormData, notes?: string): Promise<any> {
    let body: FormData;
    if (fileOrFormData instanceof FormData) {
      body = fileOrFormData;
    } else {
      body = new FormData();
      body.append('after_image', fileOrFormData);
      if (notes) body.append('inspection_notes', notes);
    }
    return this.request(`/reports/${id}/verify-repair`, {
      method: 'POST',
      body,
    });
  }

  async reopenComplaint(
    id: number, 
    dataOrFormData: { reason: string; comments?: string; citizen_name?: string } | FormData
  ): Promise<ReportDetail> {
    let body: FormData;
    if (dataOrFormData instanceof FormData) {
      body = dataOrFormData;
    } else {
      body = new FormData();
      body.append('reason', dataOrFormData.reason);
      if (dataOrFormData.comments) body.append('comments', dataOrFormData.comments);
      if (dataOrFormData.citizen_name) body.append('citizen_name', dataOrFormData.citizen_name);
    }
    return this.request<ReportDetail>(`/reports/${id}/reopen`, {
      method: 'POST',
      body,
    });
  }

  async parseNLReport(text: string): Promise<any> {
    return this.request('/ai/parse-nl-report', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getNagpurWards(): Promise<any[]> {
    return this.request<any[]>('/map/wards');
  }

  async getNMCConfig(): Promise<any> {
    return this.request('/admin/nmc/config');
  }

  async updateNMCConfig(data: any): Promise<any> {
    return this.request('/admin/nmc/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getNMCHealth(): Promise<any> {
    return this.request('/admin/nmc/health');
  }

  async getNMCTransactions(limit: number = 50): Promise<any[]> {
    return this.request<any[]>(`/admin/nmc/transactions?limit=${limit}`);
  }
}

export const api = new ApiClient();
