import {
  AuthResponse,
  User,
  RoadDamageReport,
  ReportDetail,
  MapMarkerItem,
  SpatialCluster,
  OverviewStats,
  AnalyticsTrends,
  AuditLogItem,
  AIAnalysis,
  ModelEvaluationData,
  PriorityPolicyData
} from '../types';

const API_BASE = '/api/v1';

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
}

export const api = new ApiClient();
