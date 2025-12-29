import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import MainLayout from "./layouts/index";
/* import Dashboard from "./pages/Dashboard"; */
import PatientManagement from "./pages/PatientManagement";
import AppointmentManagement from "./pages/AppointmentManagement";
import MedicalRecordForm from "./pages/MedicalRecordForm";
import MedicalHistory from "./pages/MedicalHistory";
import MedicalHistoryOverview from "./pages/MedicalHistoryOverview";
import MedicalRecordsManagement from "./pages/MedicalRecordsManagement";
import DoctorMedicalHistory from "./pages/DoctorMedicalHistory";
import InvoiceManagement from "./pages/InvoiceManagement";
import InvoiceDetails from "./pages/InvoiceDetails";
import MedicineManagement from "./pages/MedicineManagement/MedicineManagement";
import DiseaseManagement from "./pages/DiseaseManagement";
import UnitManagement from "./pages/UnitManagement";
import UsageMethodManagement from "./pages/UsageMethodManagement";
import UserManagement from "./pages/UserManagement/UserManagement";
import Settings from "./pages/Settings";
import RevenueReport from "./pages/RevenueReport";
import MedicineUsageReport from "./pages/MedicineUsageReport";
import PatientStatsReport from "./pages/PatientStatsReport";
import ReceiptManagement from "./pages/ReceiptManagement";
import Register from "./pages/auth/registers/register";
import ForgotPassword from "./pages/auth/forgot_password/forgot_password";
import ResetPasswordPage from "./pages/auth/reset-new-password/reset_new_password";
import CreateReceiptPage from "./pages/ReceiptManagement/CreateReceiptPage";
import NotFound from "./pages/NotFound";
import CreateMedicalExamination from "./pages/MedicalExamination/CreateMedicalExamination";
import ReceiptDetailPage from "./pages/ReceiptManagement/ReceiptDetailPage";
import MedicalRecordDetail from "./pages/MedicalRecordManagement/medical_record_detail";
import EditReceiptPage from "./pages/ReceiptManagement/EditReceiptPage";
import MedicalRecordsByMedicinePage from "./pages/report/MedicalRecordsByMedicinePage";
import MedicalRecordEdit from "./pages/MedicalRecordManagement/medical_record_edit";
import AdminDashboard from "./pages/DashBoard/AdminDashBoard";
import Dashboard from "./pages/Dashboard";
import DashboardBasedRole from "./pages/DashBoard/DashBoardBasedRole";
import Help from "./pages/help/help";
import Reports from "./pages/report/reports";
import RevenueOverviewReport from "./pages/report/revenue_overview_report";
import MedicineUsageOverviewReport from "./pages/report/medicine_usage_overview_report";
import CustomReportRevenuePage from "./pages/report/CustomReportRevenuePage";
import CustomMedicineUsageReport from "./pages/report/custom_usage_medicine_report";
import CreateInvoicePage from "./pages/invoices/CreateInvoicePage";
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role_name?.toLowerCase() || ""; // tránh undefined

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // tránh redirect sai

  if (!user) {
    return (
      <Routes>
        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Root */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  return (
    <MainLayout>
      <Routes>
        {/*   <Route path="/" element={<Dashboard />} /> */}
        <Route path="/" element={<DashboardBasedRole />} />{" "}
        {/* Vào thẳng Dashboard */}
        <Route path="/dashboard" element={<DashboardBasedRole />} />{" "}
        {/* có thể để cả 2 */}
        {/* Chung */}
        <Route path="/help" element={<Help />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute allowedRoles={["receptionist", "admin"]}>
              <PatientManagement />
            </ProtectedRoute>
          }
        />
        <Route path="/appointments" element={<AppointmentManagement />} />
        <Route
          path="/medical-record/:appointmentId"
          element={
            <ProtectedRoute allowedRoles={["doctor", "admin"]}>
              <MedicalRecordForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medical-history"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <MedicalHistoryOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor-medical-history"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorMedicalHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medical-history/:patientId"
          element={
            <ProtectedRoute allowedRoles={["doctor", "admin"]}>
              <MedicalHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medical-records"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor"]}>
              <MedicalRecordsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medical-record-details/:id"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor"]}>
              <MedicalRecordDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medical-records/edit/:id"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor"]}>
              <MedicalRecordEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medical-new"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor"]}>
              <CreateMedicalExamination />
            </ProtectedRoute>
          }
        />
        <Route
          path="/medical-record/:appointmentId/new"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor"]}>
              <CreateMedicalExamination />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute allowedRoles={["receptionist", "admin"]}>
              <InvoiceManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/:id"
          element={
            <ProtectedRoute allowedRoles={["receptionist", "admin"]}>
              <InvoiceDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path='/invoices/create'
          element={
            <ProtectedRoute allowedRoles={["receptionist", "admin"]}>
              <CreateInvoicePage />
            </ProtectedRoute>
          }

       />
        <Route
          path="/medicines"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <MedicineManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/diseases"
          element={
            <ProtectedRoute allowedRoles={["admin", "doctor"]}>
              <DiseaseManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/units"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UnitManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usage-methods"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UsageMethodManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/custom-revenue"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CustomReportRevenuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report/medicine-usage"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <MedicineUsageReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/medicine-usage/custom"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CustomMedicineUsageReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/revenue-overview"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <RevenueOverviewReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/medicine-usage-overview"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <MedicineUsageOverviewReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/medicine-usage"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <MedicineUsageReport />
            </ProtectedRoute>
          }
        />
        {/*  <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ReportPage />
            </ProtectedRoute>
          }
        /> */}
        <Route
          path="/reports/revenue"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <RevenueReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/patient-stats"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <PatientStatsReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report/medical-record/by-medicine/:medicineId"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <MedicalRecordsByMedicinePage />
            </ProtectedRoute>
          }
        />
        <Route path="/receipts" element={<ReceiptManagement />} />
        <Route
          path="/receipts/new"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CreateReceiptPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receipts/:id/edit"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EditReceiptPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/receipts/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ReceiptDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Navigate to="/" replace />} />
        {/*    <Route path="*" element={<Navigate to="/" replace />} /> */}
      </Routes>
    </MainLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
