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
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ROLES.EMPLOYEE, ROLES.HR, ROLES.ADMIN]} />}>
          <Route path="/my-documents" element={<UserDashboard />} />
          <Route path="/my-documents/:documentId/sign" element={<SigningWorkspace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
