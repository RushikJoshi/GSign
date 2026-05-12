import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let accessToken = localStorage.getItem("sf_access_token") || "";

export const setAccessToken = (token) => {
  accessToken = token || "";
  if (token) {
    localStorage.setItem("sf_access_token", token);
  } else {
    localStorage.removeItem("sf_access_token");
  }
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAccessToken("");
      localStorage.removeItem("sf_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (payload) => api.post("/api/auth/login", payload),
  register: (payload) => api.post("/api/auth/register", payload),
  me: () => api.get("/api/auth/me"),
  updateProfile: (payload) => api.patch("/api/auth/update-profile", payload),
  logout: () => api.post("/api/auth/logout"),
};

export const superAdminApi = {
  getCompanies: () => api.get("/api/super-admin/companies"),
  createCompany: (payload) => api.post("/api/super-admin/companies", payload),
  updateCompany: (companyId, payload) => api.patch(`/api/super-admin/companies/${companyId}`, payload),
  getUsers: () => api.get("/api/super-admin/users"),
  getDocuments: () => api.get("/api/super-admin/documents"),
};

export const companyAdminApi = {
  getUsers: () => api.get("/api/company-admin/users"),
  createUser: (payload) => api.post("/api/company-admin/users", payload),
  uploadDocument: (formData) =>
    api.post("/api/company-admin/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getDocuments: () => api.get("/api/company-admin/documents"),
  createWorkflow: (payload) => api.post("/api/company-admin/workflows", payload),
  getWorkflows: () => api.get("/api/company-admin/workflows"),
};

export const dmsApi = {
  getDocuments: (params = {}) => api.get("/api/dms/documents", { params }),
  getTimeline: (documentId) => api.get(`/api/dms/documents/${documentId}/timeline`),
  getAuditTrail: (documentId) => api.get(`/api/dms/documents/${documentId}/audit-trail`),
  uploadDocument: (formData) =>
    api.post("/api/dms/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateFields: (documentId, payload) => api.patch(`/api/dms/documents/${documentId}/fields`, payload),
  addSigners: (documentId, payload) => api.post(`/api/dms/documents/${documentId}/signers`, payload),
  runReminders: () => api.post("/api/dms/reminders/run"),
  startSigningFlow: (documentId) => api.post(`/api/dms/documents/${documentId}/start-signing`),
  signedPdfUrl: (documentId) => `${API_BASE_URL}/api/dms/documents/${documentId}/signed-pdf`,
  certificateUrl: (documentId) => `${API_BASE_URL}/api/dms/documents/${documentId}/certificate`,
};

export const userApi = {
  getAssignedDocuments: () => api.get("/api/user/documents/assigned"),
  signDocument: (documentId, payload) => api.post(`/api/user/documents/${documentId}/sign`, payload),
  getSigningWorkspace: (documentId) => api.get(`/api/user/documents/${documentId}/workspace`),
  submitSigningFields: (documentId, payload) => api.post(`/api/user/documents/${documentId}/submit-fields`, payload),
  assignedPdfUrl: (documentId) => `${API_BASE_URL}/api/user/documents/${documentId}/file`,
};

export const uploadApi = {
  uploadFile: (formData) => api.post("/api/upload", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  uploadContent: (payload) => api.post("/api/upload/content", payload),
};

export const signingApi = {
  getDocument: (token) => api.get(`/api/signing/document/${token}`),
  sendOTP: (payload) => api.post("/api/signing/send-otp", payload),
  verifyOTP: (payload) => api.post("/api/signing/verify-otp", payload),
  signDocument: (payload) => api.post("/api/signing/sign-document", payload),
  uploadSelfie: (payload) => api.post("/api/signing/upload-selfie", payload),
  previewUrl: (token) => `${API_BASE_URL}/api/signing/document/${token}/preview`,
};

export const templateApi = {
  getTemplates: (params = {}) => api.get("/api/templates", { params }),
  getTemplate: (id) => api.get(`/api/templates/${id}`),
  createTemplate: (formData) =>
    api.post("/api/templates", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateFields: (id, payload) => api.patch(`/api/templates/${id}/fields`, payload),
  deleteTemplate: (id) => api.delete(`/api/templates/${id}`),
  duplicateTemplate: (id) => api.post(`/api/templates/${id}/duplicate`),
  toggleSignForm: (id, payload) => api.patch(`/api/templates/${id}/toggle-signform`, payload),
  templateFileUrl: (id) => `${API_BASE_URL}/api/templates/${id}/file`,
};

export default api;
