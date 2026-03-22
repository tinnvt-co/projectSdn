import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../student/StudentDashboard.css";
import "./AdminDashboard.css";
import "./AdminDashboardOverview.css";
import "./AdminDashboardFinance.css";
import "./AdminDashboardTabs.css";
import "../AdminNotifications.css";
import "../AdminUsers.css";
import "../AdminReports.css";
import "../AdminBuildingsPage.css";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import BuildingsPanel from "./dashboard/BuildingsPanel";
import FinancePanel from "./dashboard/FinancePanel";
import NotificationsPanel from "./dashboard/NotificationsPanel";
import OverviewPanel from "./dashboard/OverviewPanel";
import ReportsPanel from "./dashboard/ReportsPanel";
import SettingsPanel from "./dashboard/SettingsPanel";
import UsersPanel from "./dashboard/UsersPanel";
import { ADMIN_MENU, getAdminTabFromSearch } from "./dashboard/constants";

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
        return {};
    }
}

export default function AdminDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const [active, setActive] = useState(() => getAdminTabFromSearch(location.search));
    const [showChangePw, setShowChangePw] = useState(false);
    const user = useMemo(() => getStoredUser(), [location.pathname, location.search]);

    useEffect(() => {
        setActive(getAdminTabFromSearch(location.search));
    }, [location.search]);

    const initials = (user.username || user.email || "AD").slice(0, 2).toUpperCase();

    const handleSelectTab = (tab) => {
        setActive(tab);
        navigate(tab === "overview" ? "/admin/dashboard" : `/admin/dashboard?tab=${tab}`);
    };

    const panels = {
        overview: <OverviewPanel />,
        users: <UsersPanel />,
        buildings: <BuildingsPanel />,
        reports: <ReportsPanel />,
        finance: <FinancePanel />,
        settings: <SettingsPanel />,
        notifications: <NotificationsPanel />,
    };

    return (
        <div className="sd-wrapper">
            <aside className="sd-sidebar">
                <div className="sd-sidebar-header">
                    <div className="sd-sidebar-avatar">{initials}</div>
                    <div className="sd-sidebar-name">{user.username || "Admin"}</div>
                    <div className="sd-sidebar-code" style={{ color: "#e8540a", fontWeight: 600, fontSize: 11 }}>
                        Quản trị viên
                    </div>
                </div>

                <nav className="sd-menu">
                    {ADMIN_MENU.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`sd-menu-item${active === item.id ? " active" : ""}`}
                            onClick={() => handleSelectTab(item.id)}
                        >
                            <span className="sd-menu-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}

                    <button
                        type="button"
                        className="sd-menu-item"
                        style={{ marginTop: 8, color: "#e8540a", borderTop: "1px solid #f0e8e4", paddingTop: 12 }}
                        onClick={() => setShowChangePw(true)}
                    >
                        <span className="sd-menu-icon">🔐</span>
                        Đổi mật khẩu
                    </button>
                </nav>
            </aside>

            <main className="sd-content">
                {panels[active] || panels.overview}
            </main>

            {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
        </div>
    );
}
