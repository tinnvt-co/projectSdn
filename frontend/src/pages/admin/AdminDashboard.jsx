import { useEffect, useState } from "react";
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
import OverviewPanel from "./dashboard/OverviewPanel";
import UsersPanel from "./dashboard/UsersPanel";
import BuildingsPanel from "./dashboard/BuildingsPanel";
import ReportsPanel from "./dashboard/ReportsPanel";
import FinancePanel from "./dashboard/FinancePanel";
import NotificationsPanel from "./dashboard/NotificationsPanel";
import SettingsPanel from "./dashboard/SettingsPanel";

const MENU = [
    { id: "overview", icon: "🛡️", label: "Tổng quan" },
    { id: "users", icon: "👥", label: "Tài khoản" },
    { id: "buildings", icon: "🏢", label: "Tòa nhà & Phòng" },
    { id: "reports", icon: "📑", label: "Báo cáo" },
    { id: "finance", icon: "💰", label: "Tài chính" },
    { id: "settings", icon: "⚙️", label: "Cài đặt & Bill" },
    { id: "notifications", icon: "🔔", label: "Thông báo" },
];

const ADMIN_TABS = new Set(MENU.map((item) => item.id));

function getAdminTabFromSearch(search) {
    const params = new URLSearchParams(search);
    const tab = params.get("tab");
    return ADMIN_TABS.has(tab) ? tab : "overview";
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
            {/* Sidebar */}
            <aside className="sd-sidebar">
                <div className="sd-sidebar-header">
                    <div className="sd-sidebar-avatar">{initials}</div>
                    <div className="sd-sidebar-name">{user.username || "Admin"}</div>
                    <div className="sd-sidebar-code" style={{ color: "#e8540a", fontWeight: 600, fontSize: 11 }}>🛡️ Quản trị viên</div>
                </div>
                <nav className="sd-menu">
                    {MENU.map(item => (
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
                {panels[active]}
            </main>

            {showChangePw && (
                <ChangePasswordModal onClose={() => setShowChangePw(false)} />
            )}
        </div>
    );
}
