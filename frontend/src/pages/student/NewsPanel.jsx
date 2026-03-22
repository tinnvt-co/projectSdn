import { useEffect, useMemo, useState } from "react";
import { studentApi } from "../../services/studentApi";

const fmtDatetime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};

const TYPE_META = {
    general: { icon: "📢", label: "Thông báo chung" },
    payment_reminder: { icon: "💳", label: "Nhắc thanh toán" },
    maintenance: { icon: "🔧", label: "Bảo trì" },
    announcement: { icon: "📣", label: "Thông báo quan trọng" },
};

const getTypeMeta = (type) => TYPE_META[type] || { icon: "📌", label: "Khác" };

export default function NewsPanel() {
    const [all, setAll] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        studentApi
            .getNews()
            .then((response) => setAll(response.data.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(
        () =>
            all.filter(
                (item) =>
                    !query ||
                    item.title?.toLowerCase().includes(query.toLowerCase()) ||
                    item.message?.toLowerCase().includes(query.toLowerCase())
            ),
        [all, query]
    );

    const handleSearch = (event) => {
        event.preventDefault();
        setQuery(search.trim());
        setSelected(null);
    };

    if (loading) {
        return (
            <div className="sd-loading">
                <div className="sd-spinner" />
                <span>Đang tải...</span>
            </div>
        );
    }

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">🔔 Tin tức & Thông báo</h2>
                <p className="sd-panel-subtitle">Thông báo mới nhất từ Ban quản lý KTX</p>
            </div>

            <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        border: "1.5px solid #e8e8e8",
                        borderRadius: 12,
                        padding: "0 14px",
                        background: "#fff",
                    }}
                >
                    <span style={{ color: "#94a3b8", fontSize: 16 }}>🔎</span>
                    <input
                        style={{
                            border: "none",
                            outline: "none",
                            flex: 1,
                            fontSize: 14,
                            padding: "12px 0",
                            fontFamily: "var(--font-sans)",
                            background: "transparent",
                            color: "#1f2937",
                        }}
                        placeholder="Tìm kiếm thông báo..."
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            if (!event.target.value) {
                                setQuery("");
                                setSelected(null);
                            }
                        }}
                    />
                </div>
                <button
                    type="submit"
                    className="sd-btn-primary"
                    style={{ whiteSpace: "nowrap", paddingInline: 22 }}
                >
                    Tìm kiếm
                </button>
            </form>

            {query && (
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                    {filtered.length > 0
                        ? `Tìm thấy ${filtered.length} kết quả cho "${query}"`
                        : `Không có kết quả cho "${query}"`}
                    {" "}
                    <span
                        style={{ color: "#e8540a", cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => {
                            setQuery("");
                            setSearch("");
                            setSelected(null);
                        }}
                    >
                        Xóa
                    </span>
                </div>
            )}

            {selected ? (
                <div className="sd-card">
                    <button
                        onClick={() => setSelected(null)}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#e8540a",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: 0,
                            marginBottom: 16,
                            fontFamily: "var(--font-sans)",
                        }}
                    >
                        ← Quay lại danh sách
                    </button>

                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                        <span style={{ fontSize: 28 }}>{getTypeMeta(selected.type).icon}</span>
                        <div style={{ minWidth: 0 }}>
                            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>
                                {selected.title}
                            </h3>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    flexWrap: "wrap",
                                    marginTop: 8,
                                    fontSize: 12,
                                    color: "#94a3b8",
                                }}
                            >
                                <span className="sd-badge info">{getTypeMeta(selected.type).label}</span>
                                <span>👤 {selected.senderId?.username || "Ban quản lý"}</span>
                                <span>🕐 {fmtDatetime(selected.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "0 0 16px" }} />
                    <p
                        style={{
                            fontSize: 15,
                            color: "#475569",
                            lineHeight: 1.85,
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {selected.message}
                    </p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="sd-empty">
                    <span className="sd-empty-icon">📭</span>
                    <p className="sd-empty-text">
                        {query ? `Không tìm thấy thông báo nào cho "${query}"` : "Chưa có thông báo nào"}
                    </p>
                </div>
            ) : (
                <div className="sd-list">
                    {filtered.map((item) => {
                        const typeMeta = getTypeMeta(item.type);
                        return (
                            <div key={item._id} className="sd-list-item" onClick={() => setSelected(item)} style={{ cursor: "pointer" }}>
                                <div className="sd-list-icon" style={{ background: "rgba(232,84,10,0.08)" }}>
                                    {typeMeta.icon}
                                </div>
                                <div className="sd-list-body">
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 12,
                                            flexWrap: "wrap",
                                            marginBottom: 6,
                                        }}
                                    >
                                        <div className="sd-list-title">{item.title}</div>
                                        <span className="sd-badge info">{typeMeta.label}</span>
                                    </div>
                                    <div className="sd-list-text" style={{ color: "#64748b" }}>
                                        {item.message}
                                    </div>
                                    <div className="sd-list-meta">
                                        {item.senderId?.username || "Ban quản lý"} · {fmtDatetime(item.createdAt)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
