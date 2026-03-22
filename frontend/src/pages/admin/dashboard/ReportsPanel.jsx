import { useCallback, useEffect, useState } from "react";
import api from "../../../services/api";
import { StatCard } from "./cards";
import { R_TYPE_COLORS, R_TYPE_LABELS } from "./reports/constants";
import RDetailModal from "./reports/RDetailModal";
import RReviewModal from "./reports/RReviewModal";

function ReportsPanel() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("pending");
    const [filterType, setFilterType] = useState("");
    const [selected, setSelected] = useState(null);
    const [modal, setModal] = useState(null);
    const [alert, setAlert] = useState({ type: "", msg: "" });

    const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert({ type: "", msg: "" }), 4000); };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { status: tab };
            if (filterType) params.type = filterType;
            const { data } = await api.get("/reports", { params });
            setReports(data.reports || []);
        } catch { showAlert("error", "Không thể tải danh sách báo cáo"); }
        finally { setLoading(false); }
    }, [tab, filterType]);

    useEffect(() => { load(); }, [load]);

    const closeModal = () => { setSelected(null); setModal(null); };
    const pending = reports.filter(r => r.status === "pending").length;
    const reviewedCount = reports.filter(r => r.status === "reviewed").length;
    const maintenanceCount = reports.filter(r => r.type === "maintenance").length;
    const incidentCount = reports.filter(r => r.type === "incident").length;
    const repliedCount = reports.filter(r => !!r.adminReview?.note).length;
    const activeTabLabel = tab === "pending" ? "Hàng chờ duyệt" : "Kho đã duyệt";
    const activeTypeLabel = filterType ? (R_TYPE_LABELS[filterType] || filterType) : "Tất cả loại báo cáo";

    return (
        <div className="ad-panel-stack">
            <section className="ad-section-hero ad-section-hero-reports">
                <div className="ad-section-copy">
                    <span className="ad-section-eyebrow">Report Review Queue</span>
                    <h2 className="ad-section-title">📑 Duyệt báo cáo</h2>
                    <p className="ad-section-subtitle">
                        Xem xét nhanh báo cáo từ quản lý, nhận diện sự cố ưu tiên và giữ luồng phản hồi của admin nhất quán.
                    </p>
                    <div className="ad-section-pills">
                        <span className="ad-section-pill neutral">Tab hiện tại: {activeTabLabel}</span>
                        <span className="ad-section-pill neutral">Lọc loại: {activeTypeLabel}</span>
                        <span className={`ad-section-pill ${tab === "pending" ? "danger" : "success"}`}>
                            {tab === "pending" ? `${reports.length} báo cáo đang chờ duyệt` : `${reports.length} báo cáo đã xử lý`}
                        </span>
                    </div>
                </div>
                <div className="ad-section-actions">
                    <button type="button" className={`ad-hero-btn ${tab === "pending" ? "primary" : ""}`} onClick={() => setTab("pending")}>
                        Chờ duyệt
                    </button>
                    <button type="button" className={`ad-hero-btn ${tab === "reviewed" ? "primary" : ""}`} onClick={() => setTab("reviewed")}>
                        Đã duyệt
                    </button>
                    {filterType && (
                        <button type="button" className="ad-hero-btn" onClick={() => setFilterType("")}>
                            Bỏ lọc loại
                        </button>
                    )}
                </div>
            </section>

            {alert.msg && (
                <div className={`ar-alert ${alert.type}`} style={{ marginBottom: 16 }}>
                    {alert.type === "success" ? "✓" : "⚠️"} {alert.msg}
                </div>
            )}

            <div className="ad-stats-grid">
                <StatCard
                    icon="🗂️"
                    label="Đang hiển thị"
                    value={reports.length}
                    meta={activeTabLabel}
                    color="#d97706"
                    loading={loading}
                />
                <StatCard
                    icon="⚠️"
                    label="Sự cố"
                    value={incidentCount}
                    meta="Cần ưu tiên kiểm tra"
                    color="#dc2626"
                    loading={loading}
                />
                <StatCard
                    icon="🔧"
                    label="Bảo trì"
                    value={maintenanceCount}
                    meta="Vấn đề hạ tầng và phòng ở"
                    color="#2563eb"
                    loading={loading}
                />
                <StatCard
                    icon="💬"
                    label="Đã phản hồi"
                    value={repliedCount}
                    meta={`${reviewedCount} báo cáo ở trạng thái reviewed`}
                    color="#16a34a"
                    loading={loading}
                />
            </div>

            <div className="ad-toolbar-shell">
                <div className="ad-toolbar-copy">
                    <h3 className="ad-toolbar-title">Bộ lọc hàng chờ</h3>
                    <p className="ad-toolbar-text">
                        Chọn trạng thái xử lý và loại báo cáo để admin nhìn đúng nhóm công việc cần ưu tiên.
                    </p>
                </div>
                <div className="ad-toolbar-controls">
                    <div className="ar-tabs">
                        <button className={`ar-tab ${tab === "pending" ? "active" : ""}`} onClick={() => setTab("pending")}>
                            ⏳ Chờ duyệt {pending > 0 && <span className="ar-badge">{pending}</span>}
                        </button>
                        <button className={`ar-tab ${tab === "reviewed" ? "active" : ""}`} onClick={() => setTab("reviewed")}>✅ Đã duyệt</button>
                    </div>
                    <select className="ar-select ad-select-enhanced" value={filterType} onChange={e => setFilterType(e.target.value)}>
                        <option value="">Tất cả loại</option>
                        <option value="general">Tổng quát</option>
                        <option value="maintenance">Bảo trì</option>
                        <option value="incident">Sự cố</option>
                        <option value="monthly">Hàng tháng</option>
                    </select>
                </div>
            </div>

            <div className="ad-context-line">
                <p className="ad-context-text">Danh sách hiện có {reports.length} báo cáo theo bộ lọc đang áp dụng.</p>
                <p className="ad-context-text">Ưu tiên: bắt đầu từ báo cáo sự cố hoặc các mục trong trạng thái chờ duyệt.</p>
            </div>

            <div className="ad-surface-panel">
                <div className="ad-surface-head">
                    <div>
                        <h3 className="ad-surface-title">Danh sách báo cáo</h3>
                        <p className="ad-surface-text">Tổng hợp theo thứ tự để admin duyệt, xem chi tiết hoặc phản hồi ngay trong cùng luồng công việc.</p>
                    </div>
                </div>

                <div className="ar-list">
                    {loading ? (
                        <div className="ar-empty">Đang tải...</div>
                    ) : reports.length === 0 ? (
                        <div className="ar-empty">{tab === "pending" ? "🎉 Không có báo cáo nào chờ duyệt!" : "Chưa có báo cáo nào được duyệt"}</div>
                    ) : (
                        reports.map(r => {
                            const col = R_TYPE_COLORS[r.type] || "#6366f1";
                            return (
                                <div key={r._id} className="ar-row ad-report-row">
                                    <div className="ar-row-accent" style={{ background: col }} />
                                    <div className="ar-row-body">
                                        <div className="ar-row-top">
                                            <span className="ar-type" style={{ background: col + "20", color: col, border: `1px solid ${col}40` }}>{R_TYPE_LABELS[r.type]}</span>
                                            <span className="ar-sender">👤 {r.managerId?.username} &nbsp;·&nbsp; 🏢 {r.buildingId?.name}</span>
                                            <span className="ar-date">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</span>
                                        </div>
                                        <h3 className="ar-row-title">{r.title}</h3>
                                        <p className="ar-row-preview">{r.content?.slice(0, 120)}{r.content?.length > 120 ? "..." : ""}</p>
                                        {r.adminReview?.note && <div className="ar-note">💬 Phản hồi: {r.adminReview.note}</div>}
                                    </div>
                                    <div className="ar-row-actions">
                                        <button className="btn-view" onClick={() => { setSelected(r); setModal("detail"); }}>👁️ Xem</button>
                                        {r.status === "pending" && (
                                            <button className="btn-approve" onClick={() => { setSelected(r); setModal("review"); }}>✅ Duyệt</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {modal === "review" && selected && (
                <RReviewModal
                    report={selected}
                    onClose={closeModal}
                    onSuccess={() => { closeModal(); load(); showAlert("success", "Đã duyệt báo cáo thành công!"); }}
                    onError={msg => showAlert("error", msg)}
                />
            )}
            {modal === "detail" && selected && (
                <RDetailModal report={selected} onClose={closeModal} />
            )}
        </div>
    );
}

export default ReportsPanel;
