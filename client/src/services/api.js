import axios from "axios";
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post("/api/auth/login", credentials),
  getMe: () => api.get("/api/auth/me"),
  register: (payload) => api.post("api/auth/register", payload),
  resetPassword: (data) => api.post("/api/auth/reset-password", data),
  changePassword: (data) => api.post("/api/auth/change-password", data),
  forgotPassword: (data) => api.post("/api/auth/forgot-password", data),
};

export const patientsAPI = {
  getPatients: (params) => api.get("/api/patients", { params }),
  getPatient: (id) => api.get(`/api/patients/${id}`),
  createPatient: (data) => api.post("/api/patients", data),
  updatePatient: (id, data) => api.put(`/api/patients/${id}`, data),
  getMedicalHistory: (id, params) =>
    api.get(`/api/patients/${id}/medical-history`, { params }),
  checkRelationPatient: (id) => api.get(`/api/patients/${id}/relations`),
  archivePatient: (id) => api.put(`/api/patients/archive/${id}`),
  handleDelete: (id) => api.delete(`/api/patients/${id}`),
  handleUnArchive: (id, data) => api.put(`/api/patients/unArchive/${id}`, data),
};

export const appointmentsAPI = {
  getDailyAppointments: (params) =>
    api.get("/api/appointments/daily", { params }),
  addAppointment: (data) => api.post("/api/appointments", data),
  updateAppointmentStatus: (id, status) =>
    api.put(`/api/appointments/${id}/status`, { status }),
  removeAppointment: (id) => api.delete(`/api/appointments/${id}`),
  getAppointmentStats: (params) =>
    api.get("/api/appointments/stats", { params }),
};

export const medicalRecordsAPI = {

  getAll: (params) => api.get("/api/medical-records", { params }),
  getPendingMedicalExaminations: ()=> api.get('/api/medical-records/pending-medical-examinations'), 
  createMedicalRecord: (data) => api.post("/api/medical-records", data),
  getMedicalRecordSummary: () => api.get('/api/medical-records/summary'), 
  getMedicalRecordByMedicine: (id) =>
    api.get(`/api/medical-records/by-medicine/${id}`),
  getMedicalRecord: (id) => api.get(`/api/medical-records/${id}`),
  getPatientMedicalRecords: (patientId, params) =>
    api.get(`/api/medical-records/patient/${patientId}`, { params }),
  updateRecord: (id, data) => api.put(`/api/medical-records/${id}`, data),
  getPreviewBeforeCreateINV: (id) =>
    api.get(`/api/medical-records/${id}/preview`),
  deleteMedicalRecord: (id) => api.delete(`/api/medical-records/${id}`),
};

export const medicinesAPI = {
  getMedicines: (params) => api.get("/api/medicines", { params }),
  getAvailableMedicines: (params) =>
    api.get("/api/medicines/available-medicines", { params }),
  getMedicine: (id, params) =>
    api.get(`/api/medicines/${id}`, {
      params: params,
    }),
  createMedicine: (data) => api.post("/api/medicines", data),
  updateMedicine: (id, data) => api.put(`/api/medicines/${id}`, data),
  deleteMedicine: (id) => api.delete(`/api/medicines/${id}`),
};

export const diseasesAPI = {
  getDiseases: (params) => api.get("/api/diseases", { params }),
  getDisease: (id) => api.get(`/api/diseases/${id}`),
  createDisease: (data) => api.post("/api/diseases", data),
  updateDisease: (id, data) => api.put(`/api/diseases/${id}`, data),
  deleteDisease: (id) => api.delete(`/api/diseases/${id}`),
};

export const unitsAPI = {
  getUnits: (params) => api.get("/api/units", { params }),
  createUnit: (data) => api.post("/api/units", data),
  updateUnit: (id, data) => api.put(`/api/units/${id}`, data),
  deleteUnit: (id) => api.delete(`/api/units/${id}`),
};

export const usageMethodsAPI = {
  getUsageMethods: (params) => api.get("/api/usage-methods", { params }),
  createUsageMethod: (data) => api.post("/api/usage-methods", data),
  updateUsageMethod: (id, data) => api.put(`/api/usage-methods/${id}`, data),
  deleteUsageMethod: (id) => api.delete(`/api/usage-methods/${id}`),
};

export const invoicesAPI = {
  getInvoices: (params) => api.get("/api/invoices", { params }),

  getInvoice: (id) => api.get(`/api/invoices/${id}`),
    getStats: (params) => api.get("/api/invoices/stats", { params }),
  getInvoiceBasic: (id) => api.get(`api/invoices/basic/${id}`),
  createInvoice: (data) => api.post("/api/invoices", data),
  payInvoice: (id) => api.put(`/api/invoices/${id}/pay`),
  getInvoiceByMedicalRecord: (id) =>
    api.get(`/api/invoices/by-medical-record/${id}`),
  deleteInvoice: (id) => api.delete(`/api/invoices/${id}`),
};

export const settingsAPI = {
  getSettings: () => api.get("/api/settings"),
  updateSettings: (data) => api.put("/api/settings", data),
  getSetting: (key) => api.get(`/api/settings/${key}`),
  updateSetting: (id, data) => api.put(`/api/settings/${id}`, data),
};

export const reportsAPI = {
  getRevenueReport: (params) => api.get("/api/reports/revenue", { params }),
  getMedicineUsageReport: (params) =>
    api.get("/api/reports/medicine-usage", { params }),
  getPatientStatsReport: (params) =>
    api.get("/api/reports/patient-stats", { params }),
  getDashboardStats: (params) => api.get("/api/reports/dashboard", { params }),
  getMonthlyRevenueReports: (params) => api.get("/api/reports/months/revenue/available", { params }), 
  getMonthlyUsageMedicineReports: (params) => api.get('/api/reports/months/usage-medicines/available', {params}), 
  getCustomRevenueReport: (params) => api.get("/api/reports/range", { params }),
// Trong file services/api.js hoặc reportsAPI
getMedicineUsageReportPeriod: (id, queryParams = {}) =>
  api.get(`/api/reports/medicine-usage/period/${id}`, { params: queryParams }),
};

export const usersAPI = {
  getUsers: (params) => api.get("/api/users", { params }),
  getUser: (id) => api.get(`/api/users/${id}`),
  createUser: (data) => api.post("/api/users", data),
  updateUser: (id, data) => api.put(`/api/users/${id}`, data),
  resetPassword: (id, data) => api.put(`/api/users/${id}/password`, data),
  deleteUser: (id) => api.delete(`/api/users/${id}`),
};

export const importReceiptsAPI = {
  getImportReceipts: (params) => api.get("/api/import-receipts", { params }),
  getImportReceipt: (id) => api.get(`/api/import-receipts/${id}`),
  createImportReceipt: (data) => api.post("/api/import-receipts", data),
  updateImportReceipt: (id, data) =>
    api.put(`/api/import-receipts/${id}`, data),
  deleteImportReceipt: (id) => api.delete(`/api/import-receipts/${id}`),
};

export const rolesAPI = {
  getRoles: () => api.get("/api/roles"),
};
 
export const DashboardAPI = {
  getDashboardAdminSummary: (params) => api.get('/api/dashboards/admin/summary', { params } ),
  getDashboardReceptionistSummary: (params) =>
    api.get('/api/dashboards/receptionist/summary', { params }),
  getDashboardDoctorSummary: (params) => api.get('/api/dashboards/doctor/summary', {params})
}; 

export const BatchesAPI = {
  updateNote: (id, data) => api.put(`/api/batches/${id}`, data)
}
export default api;
