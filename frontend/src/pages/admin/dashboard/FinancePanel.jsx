import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { StatCard, fmtOverviewTime } from "./shared";

const FIN_TYPE_LABELS = { room_fee: "Phí phòng", electricity: "Điện", violation_fine: "Phí vi phạm", damage_compensation: "Bồi thường", other: "Khác" };
const FIN_TYPE_COLORS = { room_fee: "#6366f1", electricity: "#f59e0b", violation_fine: "#ef4444", damage_compensation: "#ec4899", other: "#94a3b8" };
const fmtMoney = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";

function FinancePanel() {
    const [overview, setOverview] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
    const [byType, setByType] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    const [invoiceStatus, setInvoiceStatus] = useState("");
    const [alertMsg, setAlertMsg] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        api.get("/finance/summary")
            .then(r => {
                const d = r.data.data;
                setOverview(d.overview);
                setMonthlyData(d.monthlyData || []);
                setByType(d.byType || []);
                setInvoices(d.recentInvoices || []);
                setLastUpdated(new Date().toISOString());
            })
            .catch(() => setAlertMsg("Không thể tải dữ liệu tài chính"))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (loading) return;
        setInvoiceLoading(true);
        const params = invoiceStatus ? { status: invoiceStatus } : {};
        api.get("/finance/summary", { params })
            .then(r => {
                setInvoices(r.data.data?.recentInvoices || []);
                setLastUpdated(new Date().toISOString());
            })
            .catch(() => { })
            .finally(() => setInvoiceLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoiceStatus]);

    if (loading) return <div style={{ textAlign: "center", padding: "60px", color: "#bbb" }}><div className="ab-spinner" /><p>Đang tải...</p></div>;

    const ov = overview || {};
    const maxRev = Math.max(...monthlyData.map(m => m.revenue), 1);

    const STATUS_FILTERS = [
        { value: "", label: "Tất cả", color: "#64748b" },
        { value: "paid", label: "Đã thanh toán", color: "#22c55e" },
        { value: "unpaid", label: "Chưa thanh toán", color: "#ef4444" },
        { value: "partial", label: "Một phần", color: "#f59e0b" },
        { value: "overdue", label: "Quá hạn", color: "#dc2626" },
    ];
    const activeStatusLabel = STATUS_FILTERS.find((item) => item.value === invoiceStatus)?.label || "Tất cả";
    const financeSignals = [
        { label: "Đã thanh toán", count: ov.paidCount, color: "#22c55e", val: "paid", note: "Khoản thu đã khép sổ" },
        { label: "Chưa thanh toán", count: ov.unpaidCount, color: "#ef4444", val: "unpaid", note: "Cần nhắc đôn đốc" },
        { label: "Một phần", count: ov.partialCount, color: "#f59e0b", val: "partial", note: "Đang thu dang dở" },
        { label: "Quá hạn", count: ov.overdueCount, color: "#dc2626", val: "overdue", note: "Ưu tiên xử lý ngay" },
    ];

    return (
        <div className="ad-panel-stack">
            <section className="ad-section-hero ad-section-hero-finance">
                <div className="ad-section-copy">
                    <span className="ad-section-eyebrow">Finance Console</span>
                    <h2 className="ad-section-title">💰 Báo cáo tài chính</h2>
                    <p className="ad-section-subtitle">
                        Theo dõi doanh thu, công nợ và trạng thái hóa đơn trong một dashboard có cùng ngôn ngữ thiết kế với các tab admin khác.
                    </p>
                    <div className="ad-section-pills">
                        <span className="ad-section-pill neutral">Bộ lọc hóa đơn: {activeStatusLabel}</span>
                        <span className="ad-section-pill neutral">Cập nhật: {fmtOverviewTime(lastUpdated)}</span>
                        <span className={`ad-section-pill ${Number(ov.unpaidAmount || 0) > 0 ? "danger" : "success"}`}>
                            {Number(ov.unpaidAmount || 0) > 0 ? `Còn ${fmtMoney(ov.unpaidAmount)} chưa thu` : "Không còn công nợ tồn"}
                        </span>
                    </div>
                </div>
                <div className="ad-section-actions">
                    <button type="button" className="ad-hero-btn primary" onClick={() => navigate("/admin/dashboard?tab=settings")}>
                        Cài đặt & gửi bill
                    </button>
                    <button type="button" className="ad-hero-btn" onClick={() => setInvoiceStatus("")}>
                        Xem tất cả hóa đơn
                    </button>
                </div>
            </section>

            {alertMsg && <div className="ab-alert error" style={{ marginBottom: 16 }}>{alertMsg}</div>}

            <div className="ad-stats-grid">
                <StatCard
                    icon="💵"
                    label="Đã thu về"
                    value={fmtMoney(ov.totalRevenue)}
                    meta={`${ov.paidCount || 0} hóa đơn đã thanh toán`}
                    color="#22c55e"
                />
                <StatCard
                    icon="⚠️"
                    label="Chưa thu"
                    value={fmtMoney(ov.unpaidAmount)}
                    meta={`${ov.overdueCount || 0} hóa đơn quá hạn`}
                    color="#ef4444"
                />
                <StatCard
                    icon="📊"
                    label="Tổng hóa đơn"
                    value={ov.totalInvoices || 0}
                    meta={`${ov.partialCount || 0} hóa đơn thanh toán một phần`}
                    color="#6366f1"
                />
                <StatCard
                    icon="🎯"
                    label="Tỷ lệ thu"
                    value={`${ov.collectionRate || 0}%`}
                    meta={`Tổng giá trị phải thu: ${fmtMoney(ov.totalBilled)}`}
                    color="#f59e0b"
                />
            </div>

            <div className="ad-fin-status-grid">
                {financeSignals.map((item) => (
                    <button
                        key={item.val}
                        type="button"
                        className={`ad-fin-status-card${invoiceStatus === item.val ? " active" : ""}`}
                        style={{ "--ad-tone": item.color, "--ad-tone-soft": item.color + "14", "--ad-tone-border": item.color + "33" }}
                        onClick={() => setInvoiceStatus((prev) => prev === item.val ? "" : item.val)}
                        title="Click để lọc hóa đơn"
                    >
                        <div className="ad-fin-status-top">
                            <span className="ad-fin-status-label">{item.label}</span>
                            <span className="ad-fin-status-pill">{invoiceStatus === item.val ? "Đang xem" : "Lọc"}</span>
                        </div>
                        <strong className="ad-fin-status-value">{item.count || 0}</strong>
                        <span className="ad-fin-status-note">{item.note}</span>
                    </button>
                ))}
            </div>

            <div className="ad-finance-layout">
                <section className="ad-surface-panel">
                    <div className="ad-surface-head">
                        <div>
                            <h3 className="ad-surface-title">Doanh thu 12 tháng gần nhất</h3>
                            <p className="ad-surface-text">Theo dõi xu hướng thu về theo tháng để nhận ra giai đoạn tăng giảm rất nhanh.</p>
                        </div>
                    </div>
                    <div className="ad-fin-chart">
                        {monthlyData.map(m => {
                            const pct = Math.round((m.revenue / maxRev) * 100);
                            return (
                                <div key={`${m.year}-${m.month}`} className="ad-fin-bar-item">
                                    <div className="ad-fin-bar-value">
                                        {m.revenue > 0 ? (m.revenue / 1e6).toFixed(1) + "M" : ""}
                                    </div>
                                    <div
                                        title={`${m.label}: ${fmtMoney(m.revenue)}`}
                                        className="ad-fin-bar"
                                        style={{ height: `${Math.max(pct, 3)}%`, background: pct > 0 ? "linear-gradient(180deg,#2563eb,#60a5fa)" : "#e5e7eb" }}
                                    />
                                    <div className="ad-fin-bar-label">{m.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="ad-surface-panel">
                    <div className="ad-surface-head">
                        <div>
                            <h3 className="ad-surface-title">Phân loại doanh thu</h3>
                            <p className="ad-surface-text">So sánh nhanh tỷ trọng doanh thu theo từng loại hóa đơn trong toàn hệ thống.</p>
                        </div>
                    </div>
                    {byType.length > 0 ? (
                        <div className="ad-fin-breakdown">
                            {byType.map(t => {
                                const col = FIN_TYPE_COLORS[t.type] || "#94a3b8";
                                const pct = ov.totalBilled > 0 ? Math.round((t.totalBilled / ov.totalBilled) * 100) : 0;
                                return (
                                    <div key={t.type} className="ad-fin-breakdown-row">
                                        <div className="ad-fin-breakdown-label">{t.label}</div>
                                        <div className="ad-fin-progress">
                                            <div className="ad-fin-progress-fill" style={{ width: `${pct}%`, background: col }} />
                                        </div>
                                        <div className="ad-fin-breakdown-amount">{fmtMoney(t.totalBilled)}</div>
                                        <div className="ad-fin-breakdown-percent" style={{ color: col }}>{pct}%</div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="ad-empty-inline">Chưa có dữ liệu phân loại doanh thu.</div>
                    )}
                </section>
            </div>

            <section className="ad-surface-panel">
                <div className="ad-fin-table-header">
                    <div>
                        <h3 className="ad-surface-title">
                            Hóa đơn {invoiceStatus ? `— ${activeStatusLabel}` : "gần nhất"}
                            <span className="ad-surface-count">({invoices.length})</span>
                        </h3>
                        <p className="ad-surface-text">Dùng các chip trạng thái để đi thẳng tới nhóm hóa đơn admin cần theo dõi.</p>
                    </div>
                    <div className="ad-filter-pills">
                        {STATUS_FILTERS.map(f => (
                            <button
                                key={f.value || "all"}
                                type="button"
                                className={`ad-filter-pill${invoiceStatus === f.value ? " active" : ""}`}
                                style={{ "--ad-pill-color": f.color, "--ad-pill-bg": f.color + "12" }}
                                onClick={() => setInvoiceStatus(f.value)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="sd-table-wrap ad-finance-table-wrap">
                    {invoiceLoading && (
                        <div className="ad-surface-overlay">
                            <div className="ab-spinner" />
                        </div>
                    )}
                    {invoices.length === 0 && !invoiceLoading ? (
                        <div className="ad-empty-inline">
                            🎉 Không có hóa đơn nào {invoiceStatus ? `với trạng thái "${activeStatusLabel}"` : ""}
                        </div>
                    ) : (
                        <table className="sd-table">
                            <thead>
                                <tr><th>Mã HD</th><th>Sinh viên</th><th>Loại</th><th>Số tiền</th><th>Trạng thái</th></tr>
                            </thead>
                            <tbody>
                                {invoices.map(inv => (
                                    <tr key={inv._id}>
                                        <td style={{ fontFamily: "monospace", fontSize: 11 }}>{inv.invoiceCode}</td>
                                        <td>{inv.studentId?.fullName || "—"}<br /><span style={{ fontSize: 11, color: "#999" }}>{inv.studentId?.studentCode}</span></td>
                                        <td><span style={{ fontSize: 11, background: (FIN_TYPE_COLORS[inv.type] || "#94a3b8") + "20", color: FIN_TYPE_COLORS[inv.type] || "#94a3b8", padding: "2px 8px", borderRadius: 10 }}>{FIN_TYPE_LABELS[inv.type] || inv.type}</span></td>
                                        <td style={{ fontWeight: 700 }}>{fmtMoney(inv.amount)}</td>
                                        <td>
                                            <span className={`sd-badge ${inv.status === "paid" ? "approved" : inv.status === "unpaid" || inv.status === "overdue" ? "rejected" : "pending"}`}>
                                                {{ paid: "Đã TT", unpaid: "Chưa TT", overdue: "Quá hạn", partial: "Một phần" }[inv.status] || inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
        </div>
    );
}

export default FinancePanel;
