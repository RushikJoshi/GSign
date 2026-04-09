import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { ROLES } from "./constants/roles";
import { useAuth } from "./context/AuthContext";
import CompanyAdminDashboard from "./pages/CompanyAdminDashboard";
import HistoryPage from "./pages/HistoryPage";
import Login from "./pages/Login";
import SigningWorkspace from "./pages/SigningWorkspace";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import Unauthorized from "./pages/Unauthorized";
import UserDashboard from "./pages/UserDashboard";
import NewRequest from "./pages/request/NewRequest";
import Settings from "./pages/Settings";
import PublicSigningPage from "./pages/PublicSigningPage";
import TemplatesList from "./pages/templates/TemplatesList";
import CreateTemplate from "./pages/templates/CreateTemplate";
import UseTemplate from "./pages/templates/UseTemplate";
import PreviewTemplate from "./pages/templates/PreviewTemplate";
import SignYourself from "./pages/request/SignYourself";

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isAuthReady } = useAuth();
  if (!isAuthReady) {
    return null;
  }

  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

const RoleHomeRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === ROLES.SUPERADMIN) {
    return <Navigate to="/super-admin" replace />;
  }

  if ([ROLES.ADMIN, ROLES.HR].includes(user.role)) {
    return <Navigate to="/company-admin" replace />;
  }

  return <Navigate to="/my-documents" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<RoleHomeRedirect />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.SUPERADMIN]} />}>
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]} />}>
          <Route path="/company-admin" element={<CompanyAdminDashboard />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/request/new" element={<NewRequest />} />
          <Route path="/request/sign-yourself" element={<SignYourself />} />
          <Route path="/templates" element={<TemplatesList />} />
          <Route path="/templates/create" element={<CreateTemplate />} />
          <Route path="/templates/:id/edit" element={<CreateTemplate />} />
          <Route path="/templates/:id/preview" element={<PreviewTemplate />} />
          <Route path="/templates/:id/use" element={<UseTemplate />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE, ROLES.HR, ROLES.ADMIN]} />}>
          <Route path="/my-documents" element={<UserDashboard />} />
          <Route path="/my-documents/:documentId/sign" element={<SigningWorkspace />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="/public-sign/:token" element={<PublicSigningPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
