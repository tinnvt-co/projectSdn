import { useNavigate } from "react-router-dom";

const OVERVIEW_EMPTY_STATS = {
    totalUsers: null,
    totalStudents: null,
    totalBuildings: null,
    activeBuildings: null,
    pendingReports: null,
    unpaidAmount: null,
    collectionRate: null,
    totalInvoices: null,
    registrationOpen: null,
};

const fmtOverviewMoney = (value) => {
    if (value === null || value === undefined) return "—";
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
};

const fmtOverviewTime = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
    });
};

function StatCard({ icon, label, value, meta, color = "#e8540a", loading = false }) {
    return (
        <div className={`ad-stat-card${loading ? " is-loading" : ""}`}>
            <div className="ad-stat-icon" style={{ background: color + "18" }}>{icon}</div>
            <div className="ad-stat-copy">
                <div className="ad-stat-label">{label}</div>
                {loading ? (
                    <>
                        <div className="ad-skeleton ad-skeleton-value" />
                        <div className="ad-skeleton ad-skeleton-text" />
                    </>
                ) : (
                    <>
                        <div className="ad-stat-num" style={{ color }}>{value ?? "—"}</div>
                        <div className="ad-stat-meta">{meta || " "}</div>
                    </>
                )}
            </div>
        </div>
    );
}

function QuickLink({ icon, label, caption, href, accent = "#e8540a" }) {
    const navigate = useNavigate();
    return (
        <button
            className="ad-quick-link"
            onClick={() => navigate(href)}
            style={{ "--ad-accent": accent }}
        >
            <span className="ad-quick-icon">{icon}</span>
            <span className="ad-quick-title">{label}</span>
            <span className="ad-quick-caption">{caption}</span>
            <span className="ad-quick-arrow">→</span>
        </button>
    );
}

/* Panels */

export {
    OVERVIEW_EMPTY_STATS,
    QuickLink,
    StatCard,
    fmtOverviewMoney,
    fmtOverviewTime,
};
