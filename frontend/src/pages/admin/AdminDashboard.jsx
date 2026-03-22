import { Suspense, lazy, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import "../student/StudentDashboard.css";
import "../AdminNotifications.css";
import "../AdminUsers.css";
import "../AdminReports.css";
import "../AdminBuildingsPage.css";
import "./AdminDashboard.css";
import "./AdminDashboardOverview.css";
import "./AdminDashboardFinance.css";
import "./AdminDashboardTabs.css";
import { ADMIN_MENU, getAdminTabFromSearch } from "./dashboard/constants";

const OverviewPanel = lazy(() => import("./dashboard/OverviewPanel"));
const UsersPanel = lazy(() => import("./dashboard/UsersPanel"));
const BuildingsPanel = lazy(() => import("./dashboard/BuildingsPanel"));
const ReportsPanel = lazy(() => import("./dashboard/ReportsPanel"));
const FinancePanel = lazy(() => import("./dashboard/FinancePanel"));
const NotificationsPanel = lazy(() => import("./dashboard/NotificationsPanel"));
const SettingsPanel = lazy(() => import("./dashboard/SettingsPanel"));

const PANEL_COMPONENTS = {
    overview: OverviewPanel,
    users: UsersPanel,
    buildings: BuildingsPanel,
    reports: ReportsPanel,
    finance: FinancePanel,
    settings: SettingsPanel,
    notifications: NotificationsPanel,
};

function AdminPanelLoader() {
    return (
        <div className="ad-panel-stack">
            <section className="ad-surface-panel" style={{ minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="ad-empty-inline" style={{ padding: 0 }}>
                    Đang tải nội dung quản trị...
                </div>
            </section>
        </div>
    );
}

export default function AdminDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const [active, setActive] = useState(() => getAdminTabFromSearch(window.location.search));
    const [showChangePw, setShowChangePw] = useState(false);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const initials = (user.username || "AD").slice(0, 2).toUpperCase();

    useEffect(() => {
        setActive(getAdminTabFromSearch(location.search));
    }, [location.search]);

    const handleTabChange = (tabId) => {
        setActive(tabId);
        navigate(`/admin/dashboard?tab=${tabId}`, { replace: true });
    };

    const ActivePanel = PANEL_COMPONENTS[active] || OverviewPanel;

    return (
        <div className="sd-wrapper">
            {/* Sidebar */}
            <aside className="sd-sidebar">
                <div className="sd-sidebar-header">
                    <div className="sd-sidebar-avatar">{initials}</div>
                    <div className="sd-sidebar-name">{user.username || "Admin"}</div>
                    <div className="sd-sidebar-code" style={{ color: "#e8540a", fontWeight: 600, fontSize: 11 }}>🛡️ Quản trị viên</div>
                </div>
                <nav className="sd-menu">
                    {ADMIN_MENU.map(item => (
                        <button
                            key={item.id}
                            className={`sd-menu-item${active === item.id ? " active" : ""}`}
                            onClick={() => handleTabChange(item.id)}
                        >
                            <span className="sd-menu-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                    <button
                        className="sd-menu-item"
                        style={{ marginTop: 8, color: "#e8540a", borderTop: "1px solid #f0e8e4", paddingTop: 12 }}
                        onClick={() => setShowChangePw(true)}
                    >
                        <span className="sd-menu-icon">🔐</span>
                        Đổi mật khẩu
                    </button>
                </nav>
            </aside>

            {/* Content */}
            <main className="sd-content">
                <Suspense fallback={<AdminPanelLoader />}>
                    <ActivePanel />
                </Suspense>
            </main>

            {showChangePw && (
                <ChangePasswordModal onClose={() => setShowChangePw(false)} />
            )}
        </div>
    );
}
