import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import NotificationBell from "./NotificationBell";
import "./Header.css";

const ROLE_HOME = {
    admin: "/admin/dashboard",
    manager: "/manager/dashboard",
    student: "/student/dashboard",
};

const NAV_LINKS = {
    admin: [
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Tài khoản", href: "/admin/dashboard?tab=users" },
        { label: "Báo cáo", href: "/admin/dashboard?tab=reports" },
        { label: "Thông báo", href: "/admin/dashboard?tab=notifications" },
    ],
    manager: [
        { label: "Dashboard", href: "/manager/dashboard" },
        { label: "Yêu cầu", href: "/manager/requests" },
        { label: "Báo cáo", href: "/manager/reports" },
    ],
    student: [{ label: "Dashboard", href: "/student/dashboard" }],
};

const ROLE_META = {
    admin: { label: "Admin", color: "#6366f1" },
    manager: { label: "Manager", color: "#22c55e" },
    student: { label: "Student", color: "#0ea5e9" },
};

function isActiveLink(location, href) {
    return `${location.pathname}${location.search}` === href;
}

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const HIDDEN_PATHS = ["/login", "/forgot-password"];
    const isHidden = HIDDEN_PATHS.some((path) => location.pathname.startsWith(path));

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) {
            setUser(null);
            setMenuOpen(false);
            return;
        }

        try {
            setUser(JSON.parse(stored));
        } catch {
            setUser(null);
        }

        setMenuOpen(false);
    }, [location.pathname, location.search]);

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout").catch(() => {});
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login", { replace: true });
        }
    };

    if (isHidden) return null;

    const navLinks = user ? NAV_LINKS[user.role] || [] : [];
    const roleMeta = user ? ROLE_META[user.role] : null;
    const homeHref = user ? ROLE_HOME[user.role] || "/" : "/";

    return (
        <header className="site-header">
            <div className="site-header-inner">
                <button
                    className="header-logo"
                    onClick={() => navigate(homeHref)}
                    aria-label="Trang chủ ký túc xá"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                    <div className="header-logo-icon">
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                            <rect width="36" height="36" rx="8" fill="#e8540a" />
                            <path d="M8 10h12v3H11v3h8v3h-8v7H8V10z" fill="#fff" />
                            <path d="M21 10h7v3h-4v3h4v3h-4v7h-3V10z" fill="#fff" opacity="0.7" />
                        </svg>
                    </div>
                    <div className="header-logo-text">
                        <span className="header-logo-main">On campus</span>
                        <span className="header-logo-sub">Dormitory</span>
                    </div>
                </button>

                {user && (
                    <nav className="header-nav" aria-label="Điều hướng chính">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className={`header-nav-link${isActiveLink(location, link.href) ? " active" : ""}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                )}

                <div className="header-actions">
                    {user ? (
                        <>
                            {user.role === "student" && <NotificationBell />}

                            <div className="header-user">
                                <div
                                    className="header-avatar"
                                    style={{ background: roleMeta?.color || "#e8540a" }}
                                    title={user.name || user.email}
                                >
                                    {(user.name || user.email || "U")[0].toUpperCase()}
                                </div>
                                <div className="header-user-info">
                                    <span className="header-user-name">
                                        {user.name || user.email?.split("@")[0] || "Người dùng"}
                                    </span>
                                    {roleMeta && (
                                        <span
                                            className="header-role-badge"
                                            style={{ background: roleMeta.color + "22", color: roleMeta.color }}
                                        >
                                            {roleMeta.label}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <button
                                className="header-logout-btn"
                                onClick={handleLogout}
                                title="Đăng xuất"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                <span>Đăng xuất</span>
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="header-login-btn">
                            Đăng nhập
                        </Link>
                    )}

                    {user && (
                        <button
                            className={`header-hamburger${menuOpen ? " open" : ""}`}
                            onClick={() => setMenuOpen((value) => !value)}
                            aria-label="Mở menu"
                        >
                            <span />
                            <span />
                            <span />
                        </button>
                    )}
                </div>
            </div>

            {user && menuOpen && (
                <div className="header-mobile-menu">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            to={link.href}
                            className={`header-mobile-link${isActiveLink(location, link.href) ? " active" : ""}`}
                            onClick={() => setMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <button className="header-mobile-logout" onClick={handleLogout}>
                        Đăng xuất
                    </button>
                </div>
            )}
        </header>
    );
}
