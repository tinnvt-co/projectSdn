import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard"));
const ManagerReportsPage = lazy(() => import("./pages/ManagerReportsPage"));
const ManagerRequestsPage = lazy(() => import("./pages/ManagerRequestsPage"));
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

const DASHBOARD_MAP = {
  admin: "/admin/dashboard",
  manager: "/manager/dashboard",
  student: "/student/dashboard",
};

const PUBLIC_FOOTER_PATHS = new Set(["/", "/login", "/forgot-password"]);

function PrivateRoute({ children, roles }) {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={DASHBOARD_MAP[user.role] || "/login"} replace />;
  }

  return children;
}

function GuestRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (token && user) {
    return <Navigate to={DASHBOARD_MAP[user.role] || "/"} replace />;
  }

  return children;
}

function RouteLoader() {
  return (
    <div
      style={{
        minHeight: "50vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 18px",
          borderRadius: 999,
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          color: "#c2410c",
          fontWeight: 700,
          boxShadow: "0 12px 30px rgba(194, 65, 12, 0.08)",
        }}
      >
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#f97316",
            boxShadow: "0 0 0 6px rgba(249, 115, 22, 0.16)",
          }}
        />
        Đang tải trang...
      </div>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const showFooter = PUBLIC_FOOTER_PATHS.has(location.pathname);

  return (
    <>
      <Header />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPasswordPage />
              </GuestRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute roles={["admin"]}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={<Navigate to="/admin/dashboard?tab=users" replace />}
          />
          <Route
            path="/admin/reports"
            element={<Navigate to="/admin/dashboard?tab=reports" replace />}
          />
          <Route
            path="/admin/notifications"
            element={<Navigate to="/admin/dashboard?tab=notifications" replace />}
          />

          <Route
            path="/manager/dashboard"
            element={
              <PrivateRoute roles={["manager"]}>
                <ManagerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/manager/reports"
            element={
              <PrivateRoute roles={["manager"]}>
                <ManagerReportsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/manager/requests"
            element={
              <PrivateRoute roles={["manager"]}>
                <ManagerRequestsPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/student/*"
            element={
              <PrivateRoute roles={["student"]}>
                <StudentDashboard />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
      {showFooter && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}