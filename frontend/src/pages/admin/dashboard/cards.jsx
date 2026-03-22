import { useNavigate } from "react-router-dom";

export function StatCard({ icon, label, value, meta, color = "#e8540a", loading = false }) {
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

export function QuickLink({ icon, label, caption, href, accent = "#e8540a" }) {
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
