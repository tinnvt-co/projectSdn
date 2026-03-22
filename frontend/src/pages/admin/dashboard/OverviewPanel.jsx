import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { StatCard, QuickLink } from "./cards";
import { OVERVIEW_EMPTY_STATS } from "./constants";
import { fmtOverviewMoney, fmtOverviewTime } from "./formatters";

function OverviewPanel() {
    const [stats, setStats] = useState(OVERVIEW_EMPTY_STATS);
    const [overviewState, setOverviewState] = useState({
        status: "loading",
        lastUpdated: null,
        missing: [],
    });
    const navigate = useNavigate();

    const loadOverview = useCallback(async ({ silent = false } = {}) => {
        if (!silent) {
            setOverviewState((prev) => ({
                ...prev,
                status: "loading",
                missing: [],
            }));
        }

        const [usersResult, buildingsResult, reportsResult, financeResult, settingsResult] = await Promise.allSettled([
            api.get("/users"),
            api.get("/buildings"),
            api.get("/reports", { params: { status: "pending" } }),
            api.get("/finance/summary"),
            api.get("/settings/registration-open"),
        ]);

        const nextStats = { ...OVERVIEW_EMPTY_STATS };
        const missing = [];

        if (usersResult.status === "fulfilled") {
            const userList = usersResult.value.data.users || [];
            nextStats.totalUsers = userList.length;
            nextStats.totalStudents = userList.filter((item) => item.role === "student").length;
        } else {
            missing.push("tài khoản");
        }

        if (buildingsResult.status === "fulfilled") {
            const buildingList = buildingsResult.value.data.data || [];
            nextStats.totalBuildings = buildingList.length;
            nextStats.activeBuildings = buildingList.filter((item) => item.status === "active").length;
        } else {
            missing.push("tòa nhà");
        }

        if (reportsResult.status === "fulfilled") {
            const reportList = reportsResult.value.data.reports || [];
            nextStats.pendingReports = reportList.length;
        } else {
            missing.push("báo cáo");
        }

        if (financeResult.status === "fulfilled") {
            const overview = financeResult.value.data.data?.overview || {};
            nextStats.unpaidAmount = overview.unpaidAmount ?? 0;
            nextStats.collectionRate = overview.collectionRate ?? 0;
            nextStats.totalInvoices = overview.totalInvoices ?? 0;
        } else {
            missing.push("tài chính");
        }

        if (settingsResult.status === "fulfilled") {
            nextStats.registrationOpen = Boolean(settingsResult.value.data.data?.isOpen);
        } else {
            missing.push("cài đặt");
        }

        setStats(nextStats);
        setOverviewState({
            status: missing.length === 5 ? "error" : missing.length > 0 ? "partial" : "ready",
            lastUpdated: new Date().toISOString(),
            missing,
        });
    }, []);

    useEffect(() => {
        loadOverview();
    }, [loadOverview]);

    const initialLoading = overviewState.status === "loading" && !overviewState.lastUpdated;
    const isRefreshing = overviewState.status === "loading" && !!overviewState.lastUpdated;
    const focusCards = [
        {
            label: "Công nợ cần xử lý",
            value: fmtOverviewMoney(stats.unpaidAmount),
            caption: "Theo dõi doanh thu chưa thu",
            tone: "danger",
            action: () => navigate("/admin/dashboard?tab=finance"),
        },
        {
            label: "Báo cáo chờ duyệt",
            value: stats.pendingReports ?? "—",
            caption: "Ưu tiên xử lý phản hồi từ quản lý",
            tone: "warning",
            action: () => navigate("/admin/dashboard?tab=reports"),
        },
        {
            label: "Cấu hình đăng ký phòng",
            value: stats.registrationOpen === null ? "—" : stats.registrationOpen ? "Đang mở" : "Đang khóa",
            caption: "Kiểm soát luồng đăng ký của sinh viên",
            tone: stats.registrationOpen ? "success" : "neutral",
            action: () => navigate("/admin/dashboard?tab=settings"),
        },
    ];

    return (
        <>
            <div className="sd-panel-header" style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                    <h2 className="sd-panel-title">🛡️ Tổng quan hệ thống</h2>
                    <p className="sd-panel-subtitle">Bảng điều hành trung tâm cho admin ký túc xá</p>
                </div>
                <button
                    type="button"
                    className="ad-refresh-btn"
                    onClick={() => loadOverview({ silent: false })}
                    disabled={isRefreshing}
                >
                    {isRefreshing ? "Đang cập nhật..." : "Làm mới dữ liệu"}
                </button>
            </div>

            <div className="ad-overview-shell">
                <section className="ad-overview-hero">
                    <div className="ad-overview-eyebrow">Admin Command Center</div>
                    <h3 className="ad-overview-title">Điều hành KTX trên một màn hình rõ ràng và dễ ra quyết định</h3>
                    <p className="ad-overview-description">
                        Theo dõi dữ liệu vận hành, truy cập nhanh các tác vụ quan trọng và nắm ngay những đầu việc admin cần xử lý trong ngày.
                    </p>

                    <div className="ad-overview-pills">
                        <span className={`ad-overview-pill ${stats.registrationOpen ? "success" : "danger"}`}>
                            {stats.registrationOpen === null ? "Chưa rõ trạng thái đăng ký" : stats.registrationOpen ? "Đang mở đăng ký phòng" : "Đang khóa đăng ký phòng"}
                        </span>
                        <span className="ad-overview-pill neutral">
                            Tổng hóa đơn: {stats.totalInvoices ?? "—"}
                        </span>
                        <span className="ad-overview-pill neutral">
                            Cập nhật lúc: {fmtOverviewTime(overviewState.lastUpdated)}
                        </span>
                    </div>

                    <div className="ad-overview-actions">
                        <button type="button" className="ad-hero-btn primary" onClick={() => navigate("/admin/dashboard?tab=finance")}>
                            Xem tài chính
                        </button>
                        <button type="button" className="ad-hero-btn" onClick={() => navigate("/admin/dashboard?tab=settings")}>
                            Cài đặt & gửi bill
                        </button>
                        <button type="button" className="ad-hero-btn" onClick={() => navigate("/admin/dashboard?tab=reports")}>
                            Duyệt báo cáo
                        </button>
                    </div>
                </section>

                <aside className="ad-focus-grid">
                    {focusCards.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            className={`ad-focus-card ${item.tone}`}
                            onClick={item.action}
                        >
                            <span className="ad-focus-label">{item.label}</span>
                            <span className="ad-focus-value">{item.value}</span>
                            <span className="ad-focus-caption">{item.caption}</span>
                        </button>
                    ))}
                </aside>
            </div>

            {overviewState.status === "partial" && (
                <div className="ad-overview-banner warning">
                    Một phần dữ liệu chưa tải được: {overviewState.missing.join(", ")}. Dashboard vẫn hiển thị phần còn lại để bạn tiếp tục làm việc.
                </div>
            )}

            {overviewState.status === "error" && (
                <div className="ad-overview-banner error">
                    Không thể tải dữ liệu tổng quan. Bạn có thể thử làm mới hoặc chuyển thẳng đến từng mục để kiểm tra chi tiết.
                </div>
            )}

            <div className="ad-stats-grid">
                <StatCard
                    icon="👥"
                    label="Tổng người dùng"
                    value={stats.totalUsers}
                    meta={`${stats.totalStudents ?? "—"} sinh viên`}
                    color="#e8540a"
                    loading={initialLoading}
                />
                <StatCard
                    icon="🏢"
                    label="Tòa nhà"
                    value={stats.totalBuildings}
                    meta={`${stats.activeBuildings ?? "—"} tòa đang hoạt động`}
                    color="#16a34a"
                    loading={initialLoading}
                />
                <StatCard
                    icon="📑"
                    label="Báo cáo chờ"
                    value={stats.pendingReports}
                    meta="Cần admin duyệt"
                    color="#d97706"
                    loading={initialLoading}
                />
                <StatCard
                    icon="💸"
                    label="Công nợ chưa thu"
                    value={fmtOverviewMoney(stats.unpaidAmount)}
                    meta="Tổng số cần theo dõi"
                    color="#dc2626"
                    loading={initialLoading}
                />
                <StatCard
                    icon="📊"
                    label="Tỷ lệ thu"
                    value={stats.collectionRate === null ? "—" : `${stats.collectionRate}%`}
                    meta={`${stats.totalInvoices ?? "—"} hóa đơn toàn hệ thống`}
                    color="#2563eb"
                    loading={initialLoading}
                />
                <StatCard
                    icon="⚙️"
                    label="Đăng ký phòng"
                    value={stats.registrationOpen === null ? "—" : stats.registrationOpen ? "Mở" : "Khóa"}
                    meta="Trạng thái vận hành hiện tại"
                    color={stats.registrationOpen ? "#22c55e" : "#64748b"}
                    loading={initialLoading}
                />
            </div>

            <div className="sd-panel-header" style={{ marginTop: 32, marginBottom: 12 }}>
                <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>⚡ Truy cập nhanh</h3>
                    <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Đi thẳng đến 6 khu vực admin bạn thao tác thường xuyên nhất.</p>
                </div>
            </div>
            <div className="ad-quick-grid">
                <QuickLink
                    icon="👥"
                    label="Quản lý tài khoản"
                    caption="Tạo, khóa và phân quyền người dùng"
                    href="/admin/dashboard?tab=users"
                    accent="#e8540a"
                />
                <QuickLink
                    icon="🏢"
                    label="Quản lý KTX"
                    caption="Theo dõi tòa nhà, phòng và trạng thái sử dụng"
                    href="/admin/dashboard?tab=buildings"
                    accent="#16a34a"
                />
                <QuickLink
                    icon="💰"
                    label="Quản lý tài chính"
                    caption="Xem doanh thu, công nợ và hóa đơn gần nhất"
                    href="/admin/dashboard?tab=finance"
                    accent="#2563eb"
                />
                <QuickLink
                    icon="⚙️"
                    label="Cài đặt & gửi bill"
                    caption="Cập nhật giá và phát hành hóa đơn nhanh"
                    href="/admin/dashboard?tab=settings"
                    accent="#7c3aed"
                />
                <QuickLink
                    icon="🔔"
                    label="Gửi thông báo"
                    caption="Soạn thông báo cho sinh viên và quản lý"
                    href="/admin/dashboard?tab=notifications"
                    accent="#0f766e"
                />
                <QuickLink
                    icon="📑"
                    label="Xem báo cáo"
                    caption="Duyệt phản hồi và xử lý báo cáo tồn đọng"
                    href="/admin/dashboard?tab=reports"
                    accent="#d97706"
                />
            </div>
        </>
    );
}

/* Users helpers */

export default OverviewPanel;
