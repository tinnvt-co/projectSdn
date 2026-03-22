import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import "../student/StudentDashboard.css"; // reuse same CSS variables
import "./AdminDashboard.css";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import "../AdminNotifications.css";
import "../AdminUsers.css";
import "../AdminReports.css";
import "../AdminBuildingsPage.css";

/* â”€â”€ tiny sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€ Users helpers â”€â”€ */
const U_ROLE_LABELS = { admin: "Admin", manager: "Quáº£n lÃ½", student: "Sinh viÃªn" };
const U_ROLE_COLORS = { admin: "#f59e0b", manager: "#6366f1", student: "#22c55e" };
const U_DEFAULT_PERMS = {
    admin: ["manage_users", "manage_students", "manage_buildings", "manage_rooms", "manage_settings", "view_revenue", "approve_reports", "assign_permissions", "send_notifications", "view_room_list", "view_unpaid_students"],
    manager: ["manage_requests", "send_reports", "send_notifications", "view_room_list", "view_unpaid_students"],
    student: ["submit_requests", "register_room", "make_payment", "view_own_history", "view_room_list"],
};
const U_PERM_LABELS = {
    manage_users: "Quáº£n lÃ½ ngÆ°á»i dÃ¹ng", manage_students: "Quáº£n lÃ½ sinh viÃªn",
    manage_buildings: "Quáº£n lÃ½ tÃ²a nhÃ ", manage_rooms: "Quáº£n lÃ½ phÃ²ng",
    manage_settings: "CÃ i Ä‘áº·t há»‡ thá»‘ng", view_revenue: "Xem doanh thu",
    approve_reports: "Duyá»‡t bÃ¡o cÃ¡o", assign_permissions: "Cáº¥p quyá»n",
    send_notifications: "Gá»­i thÃ´ng bÃ¡o", view_room_list: "Xem danh sÃ¡ch phÃ²ng",
    view_unpaid_students: "Xem SV chÆ°a Ä‘Ã³ng tiá»n",
    manage_requests: "Quáº£n lÃ½ yÃªu cáº§u", send_reports: "Gá»­i bÃ¡o cÃ¡o",
    submit_requests: "Gá»­i yÃªu cáº§u", register_room: "ÄÄƒng kÃ½ phÃ²ng",
    make_payment: "Thanh toÃ¡n", view_own_history: "Xem lá»‹ch sá»­ cÃ¡ nhÃ¢n",
};

function UCreateModal({ onClose, onSuccess, onError }) {
    const [form, setForm] = useState({ username: "", password: "", email: "", phone: "", role: "student", fullName: "", studentCode: "", gender: "male", dateOfBirth: "", faculty: "", major: "", classCode: "", academicYear: "" });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setErr("");
        try { await api.post("/users", form); onSuccess(); }
        catch (error) { const m = error.response?.data?.message || "Táº¡o tháº¥t báº¡i"; setErr(m); onError(m); }
        finally { setLoading(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box wide" onClick={e => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
                <div className="modal-header"><h2>âž• Táº¡o tÃ i khoáº£n má»›i</h2><button className="modal-close" onClick={onClose}>âœ•</button></div>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#e8540a", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>ThÃ´ng tin tÃ i khoáº£n</p>
                    <div className="form-row"><label>Username <span className="req">*</span></label><input name="username" placeholder="Nháº­p username" value={form.username} onChange={hc} required /></div>
                    <div className="form-row"><label>Email <span className="req">*</span></label><input name="email" type="email" placeholder="Nháº­p email" value={form.email} onChange={hc} required /></div>
                    <div className="form-row"><label>Máº­t kháº©u <span className="req">*</span></label><input name="password" type="password" placeholder="Ãt nháº¥t 6 kÃ½ tá»±" value={form.password} onChange={hc} required /></div>
                    <div className="form-row"><label>Sá»‘ Ä‘iá»‡n thoáº¡i</label><input name="phone" placeholder="Nháº­p SÄT (tuá»³ chá»n)" value={form.phone} onChange={hc} /></div>
                    <div className="form-row"><label>Role <span className="req">*</span></label>
                        <select name="role" value={form.role} onChange={hc}>
                            <option value="student">Sinh viÃªn</option>
                            <option value="manager">Quáº£n lÃ½</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    {form.role === "student" && (
                        <>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#e8540a", textTransform: "uppercase", letterSpacing: "0.5px", margin: "8px 0 0" }}>ThÃ´ng tin sinh viÃªn</p>
                            <div className="form-row"><label>Há» vÃ  tÃªn <span className="req">*</span></label><input name="fullName" placeholder="Nguyá»…n VÄƒn A" value={form.fullName} onChange={hc} required /></div>
                            <div className="form-row"><label>MÃ£ sinh viÃªn</label><input name="studentCode" placeholder="VD: SE180001" value={form.studentCode} onChange={hc} /></div>
                            <div className="form-row"><label>Giá»›i tÃ­nh</label><select name="gender" value={form.gender} onChange={hc}><option value="male">Nam</option><option value="female">Ná»¯</option></select></div>
                            <div className="form-row"><label>NgÃ y sinh</label><input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={hc} /></div>
                            <div className="form-row"><label>Khoa</label><input name="faculty" placeholder="VD: CÃ´ng nghá»‡ thÃ´ng tin" value={form.faculty} onChange={hc} /></div>
                            <div className="form-row"><label>ChuyÃªn ngÃ nh</label><input name="major" placeholder="VD: Ká»¹ thuáº­t pháº§n má»m" value={form.major} onChange={hc} /></div>
                            <div className="form-row"><label>Lá»›p</label><input name="classCode" placeholder="VD: SE1801" value={form.classCode} onChange={hc} /></div>
                            <div className="form-row"><label>NÄƒm há»c</label><input name="academicYear" placeholder="VD: 2024" value={form.academicYear} onChange={hc} /></div>
                        </>
                    )}
                    {err && <div className="modal-err">âš ï¸ {err}</div>}
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Há»§y</button>
                        <button type="submit" className="btn-submit" disabled={loading}>{loading ? "Äang táº¡o..." : "Táº¡o tÃ i khoáº£n"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function UPermModal({ user, onClose, onSuccess, onError }) {
    const allPerms = U_DEFAULT_PERMS[user.role] || [];
    const [sel, setSel] = useState(new Set(user.permissions || []));
    const [loading, setLoading] = useState(false);
    const toggle = (p) => setSel(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });
    const handleSave = async () => {
        setLoading(true);
        try { await api.put(`/users/${user._id}`, { permissions: [...sel] }); onSuccess(); }
        catch (err) { onError(err.response?.data?.message || "Cáº­p nháº­t tháº¥t báº¡i"); }
        finally { setLoading(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2>ðŸ”‘ PhÃ¢n quyá»n â€” {user.username}</h2><button className="modal-close" onClick={onClose}>âœ•</button></div>
                <p className="perm-desc">Role: <strong>{U_ROLE_LABELS[user.role]}</strong></p>
                <div className="perm-list">
                    {allPerms.map(p => (
                        <label key={p} className={`perm-item ${sel.has(p) ? "checked" : ""}`}>
                            <input type="checkbox" checked={sel.has(p)} onChange={() => toggle(p)} />
                            <span className="perm-name">{U_PERM_LABELS[p] || p}</span>
                            <span className="perm-key">{p}</span>
                        </label>
                    ))}
                </div>
                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose}>Há»§y</button>
                    <button className="btn-submit" onClick={handleSave} disabled={loading}>{loading ? "Äang lÆ°u..." : `LÆ°u quyá»n (${sel.size})`}</button>
                </div>
            </div>
        </div>
    );
}

function UsersPanel() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [modal, setModal] = useState(null);
    const [selected, setSelected] = useState(null);
    const [alert, setAlert] = useState({ type: "", msg: "" });

    const showAlert = (type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert({ type: "", msg: "" }), 4000); };

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (roleFilter) params.role = roleFilter;
            if (search) params.search = search;
            const { data } = await api.get("/users", { params });
            setUsers(data.users || []);
        } catch { showAlert("error", "KhÃ´ng thá»ƒ táº£i danh sÃ¡ch ngÆ°á»i dÃ¹ng"); }
        finally { setLoading(false); }
    }, [roleFilter, search]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const handleDelete = async (u) => {
        if (!window.confirm(`XÃ³a tÃ i khoáº£n "${u.username}"? KhÃ´ng thá»ƒ hoÃ n tÃ¡c.`)) return;
        try { await api.delete(`/users/${u._id}`); showAlert("success", "ÄÃ£ xÃ³a tÃ i khoáº£n"); loadUsers(); }
        catch (err) { showAlert("error", err.response?.data?.message || "XÃ³a tháº¥t báº¡i"); }
    };

    const handleToggle = async (u) => {
        try { await api.put(`/users/${u._id}`, { isActive: !u.isActive }); showAlert("success", u.isActive ? "ÄÃ£ vÃ´ hiá»‡u hÃ³a" : "ÄÃ£ kÃ­ch hoáº¡t"); loadUsers(); }
        catch (err) { showAlert("error", err.response?.data?.message || "Cáº­p nháº­t tháº¥t báº¡i"); }
    };

    return (
        <>
            <div className="sd-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h2 className="sd-panel-title">ðŸ‘¥ Quáº£n lÃ½ tÃ i khoáº£n</h2>
                    <p className="sd-panel-subtitle">Táº¡o, chá»‰nh sá»­a vÃ  cáº¥p quyá»n cho ngÆ°á»i dÃ¹ng</p>
                </div>
                <button className="btn-create" onClick={() => setModal("create")}>+ Táº¡o tÃ i khoáº£n</button>
            </div>

            {alert.msg && (
                <div className={`au-alert ${alert.type}`} style={{ marginBottom: 16 }}>
                    {alert.type === "success" ? "âœ…" : "âš ï¸"} {alert.msg}
                </div>
            )}

            <div className="au-filters" style={{ marginBottom: 16 }}>
                <input className="au-search" placeholder="ðŸ” TÃ¬m theo username hoáº·c email..." value={search} onChange={e => setSearch(e.target.value)} />
                <select className="au-role-filter" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                    <option value="">Táº¥t cáº£ role</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Quáº£n lÃ½</option>
                    <option value="student">Sinh viÃªn</option>
                </select>
            </div>

            <div className="au-table-wrap">
                {loading ? (
                    <div className="au-loading">Äang táº£i...</div>
                ) : users.length === 0 ? (
                    <div className="au-empty">KhÃ´ng tÃ¬m tháº¥y tÃ i khoáº£n nÃ o</div>
                ) : (
                    <table className="au-table">
                        <thead>
                            <tr>
                                <th>NgÆ°á»i dÃ¹ng</th><th>Role</th><th>Tráº¡ng thÃ¡i</th><th>PhÃ¢n quyá»n</th><th>HÃ nh Ä‘á»™ng</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id}>
                                    <td>
                                        <div className="user-info">
                                            <div className="user-avatar" style={{ background: U_ROLE_COLORS[u.role] }}>{u.username[0].toUpperCase()}</div>
                                            <div><div className="user-name">{u.username}</div><div className="user-email">{u.email}</div></div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="role-badge" style={{ background: U_ROLE_COLORS[u.role] + "22", color: U_ROLE_COLORS[u.role], border: `1px solid ${U_ROLE_COLORS[u.role]}44` }}>
                                            {U_ROLE_LABELS[u.role]}
                                        </span>
                                    </td>
                                    <td>
                                        <button className={`status-toggle ${u.isActive ? "active" : "inactive"}`} onClick={() => handleToggle(u)}>
                                            {u.isActive ? "âœ… Hoáº¡t Ä‘á»™ng" : "â›” Bá»‹ khÃ³a"}
                                        </button>
                                    </td>
                                    <td>
                                        <span className="perm-count">{u.permissions?.length || 0} quyá»n</span>
                                        <button className="btn-perm" onClick={() => { setSelected(u); setModal("perm"); }}>Chá»‰nh sá»­a</button>
                                    </td>
                                    <td><button className="btn-del" onClick={() => handleDelete(u)}>ðŸ—‘ï¸ XÃ³a</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modal === "create" && (
                <UCreateModal
                    onClose={() => setModal(null)}
                    onSuccess={() => { setModal(null); loadUsers(); showAlert("success", "Táº¡o tÃ i khoáº£n thÃ nh cÃ´ng"); }}
                    onError={msg => showAlert("error", msg)}
                />
            )}
            {modal === "perm" && selected && (
                <UPermModal
                    user={selected}
                    onClose={() => { setModal(null); setSelected(null); }}
                    onSuccess={() => { setModal(null); setSelected(null); loadUsers(); showAlert("success", "Cáº­p nháº­t quyá»n thÃ nh cÃ´ng"); }}
                    onError={msg => showAlert("error", msg)}
                />
            )}
        </>
    );
}

/* â”€â”€ Buildings helpers â”€â”€ */
const B_fmtNum = (n) => Number(n || 0).toLocaleString("vi-VN");
const B_ROOM_STATUS = { available: "CÃ²n chá»—", partial: "CÃ²n chá»—", full: "Háº¿t chá»—", maintenance: "Báº£o trÃ¬" };
const B_TYPE_LABEL = { standard: "TiÃªu chuáº©n", vip: "VIP", premium: "Premium" };
const B_occColor = (pct) => pct < 50 ? "#16a34a" : pct < 100 ? "#f59e0b" : "#dc2626";

function BBuildingCard({ building, onEdit, onDelete, onAddRoom, showAlert }) {
    const [open, setOpen] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [loadingR, setLoadingR] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const loadRooms = useCallback(async () => {
        if (loaded) return;
        setLoadingR(true);
        try { const r = await api.get(`/buildings/${building._id}/rooms`); setRooms(r.data.data); setLoaded(true); }
        catch { showAlert("error", "KhÃ´ng thá»ƒ táº£i phÃ²ng"); }
        finally { setLoadingR(false); }
    }, [building._id, loaded, showAlert]);

    const refreshRooms = async () => {
        setLoaded(false);
        const r = await api.get(`/buildings/${building._id}/rooms`);
        setRooms(r.data.data); setLoaded(true);
    };

    const handleDeleteRoom = async (room) => {
        if (!window.confirm(`XÃ³a phÃ²ng ${room.roomNumber}?`)) return;
        try { await api.delete(`/rooms/${room._id}`); showAlert("success", `ÄÃ£ xÃ³a phÃ²ng ${room.roomNumber}`); refreshRooms(); }
        catch (err) { showAlert("error", err.response?.data?.message || "XÃ³a phÃ²ng tháº¥t báº¡i"); }
    };

    const handleToggle = () => { const next = !open; setOpen(next); if (next) loadRooms(); };

    return (
        <div className={`ab-building-card ${open ? "expanded" : ""}`}>
            <div className="ab-building-header" onClick={handleToggle}>
                <div className="ab-building-icon">ðŸ¢</div>
                <div className="ab-building-info">
                    <div className="ab-building-name">{building.name}</div>
                    <div className="ab-building-meta">
                        ðŸ“ {building.address || "â€”"} &nbsp;Â·&nbsp; ðŸ¬ {building.totalFloors} táº§ng &nbsp;Â·&nbsp; ðŸ‘¤ {building.managerId?.username || "ChÆ°a cÃ³ manager"}
                    </div>
                </div>
                <div className="ab-building-right">
                    <span className={`ab-status-badge ${building.status}`}>
                        {building.status === "active" ? "Hoáº¡t Ä‘á»™ng" : building.status === "maintenance" ? "Báº£o trÃ¬" : "Táº¡m Ä‘Ã³ng"}
                    </span>
                    <button className="ab-btn-edit" onClick={e => { e.stopPropagation(); onEdit(building); }}>âœï¸ Sá»­a</button>
                    <button className="ab-btn-del" onClick={e => { e.stopPropagation(); onDelete(building); }}>ðŸ—‘ï¸</button>
                    <span className={`ab-chevron ${open ? "open" : ""}`}>â„</span>
                </div>
            </div>
            {open && (
                <div className="ab-rooms-section">
                    <div className="ab-rooms-header">
                        <span className="ab-rooms-title">Danh sÃ¡ch phÃ²ng {loaded ? `(${rooms.length})` : ""}</span>
                        <button className="ab-btn-add-room" onClick={() => onAddRoom(building, refreshRooms)}>ï¼‹ ThÃªm phÃ²ng</button>
                    </div>
                    {loadingR ? (
                        <div className="ab-rooms-loading"><span className="ab-spinner" />Äang táº£i phÃ²ng...</div>
                    ) : rooms.length === 0 ? (
                        <div className="ab-rooms-empty">ðŸ›¢ ChÆ°a cÃ³ phÃ²ng nÃ o â€” nháº¥n "ThÃªm phÃ²ng" Ä‘á»ƒ táº¡o</div>
                    ) : (
                        <div className="ab-rooms-grid">
                            {rooms.map(room => {
                                const pct = Math.round((room.currentOccupancy / room.maxOccupancy) * 100);
                                return (
                                    <div key={room._id} className="ab-room-card">
                                        <div className="ab-room-top">
                                            <span className="ab-room-num">P.{room.roomNumber}</span>
                                            <span className={`ab-room-status ${room.status}`}>{B_ROOM_STATUS[room.status] || room.status}</span>
                                        </div>
                                        <div className="ab-room-info">Táº§ng {room.floor} Â· {B_TYPE_LABEL[room.type] || room.type}</div>
                                        <div className="ab-room-occupancy">
                                            <div className="ab-room-occ-bar" style={{ width: `${pct}%`, background: B_occColor(pct) }} />
                                        </div>
                                        <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>{room.currentOccupancy}/{room.maxOccupancy} ngÆ°á»i</div>
                                        <div className="ab-room-price">{B_fmtNum(room.pricePerTerm)}Ä‘/ká»³</div>
                                        <div className="ab-room-actions">
                                            <button className="ab-btn-room-del" onClick={() => handleDeleteRoom(room)}>ðŸ—‘ï¸ XÃ³a</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function BBuildingModal({ building, onClose, onSuccess }) {
    const isEdit = !!building;
    const [form, setForm] = useState({
        name: building?.name || "",
        address: building?.address || "",
        totalFloors: building?.totalFloors || "",
        description: building?.description || "",
        status: building?.status || "active",
        managerId: building?.managerId?._id || building?.managerId || "",
    });
    const [managers, setManagers] = useState([]);
    const [loadingMgr, setLoadingMgr] = useState(true);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    useEffect(() => {
        api.get("/users", { params: { role: "manager" } })
            .then(r => setManagers(r.data.users || []))
            .catch(() => { })
            .finally(() => setLoadingMgr(false));
    }, []);

    const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async () => {
        if (!form.name || !form.totalFloors) { setErr("Vui lÃ²ng nháº­p tÃªn vÃ  sá»‘ táº§ng"); return; }
        setLoading(true); setErr("");
        try {
            const payload = { ...form, managerId: form.managerId || null };
            if (isEdit) await api.put(`/buildings/${building._id}`, payload);
            else await api.post("/buildings", payload);
            onSuccess();
        } catch (e) { setErr(e.response?.data?.message || "Thao tÃ¡c tháº¥t báº¡i"); }
        setLoading(false);
    };

    const selectedMgr = managers.find(m => m._id === form.managerId);

    return (
        <div className="ab-overlay" onClick={onClose}>
            <div className="ab-modal" onClick={e => e.stopPropagation()}>
                <div className="ab-modal-title">{isEdit ? "âœï¸ Sá»­a tÃ²a nhÃ " : "ðŸ¢ Táº¡o tÃ²a nhÃ  má»›i"}</div>
                <div className="ab-modal-grid">
                    <div className="ab-field"><label className="ab-label">TÃªn tÃ²a nhÃ  *</label><input className="ab-input" name="name" placeholder="VD: TÃ²a A1" value={form.name} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">Sá»‘ táº§ng *</label><input className="ab-input" name="totalFloors" type="number" min="1" placeholder="VD: 6" value={form.totalFloors} onChange={hc} /></div>
                    <div className="ab-field full"><label className="ab-label">Äá»‹a chá»‰</label><input className="ab-input" name="address" placeholder="Äá»‹a chá»‰ tÃ²a nhÃ " value={form.address} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">Tráº¡ng thÃ¡i</label>
                        <select className="ab-select" name="status" value={form.status} onChange={hc}>
                            <option value="active">Hoáº¡t Ä‘á»™ng</option>
                            <option value="maintenance">Báº£o trÃ¬</option>
                            <option value="inactive">Táº¡m Ä‘Ã³ng</option>
                        </select>
                    </div>

                    {/* Manager picker */}
                    <div className="ab-field">
                        <label className="ab-label">ðŸ‘¤ Quáº£n lÃ½ phá»¥ trÃ¡ch</label>
                        {loadingMgr ? (
                            <div style={{ fontSize: 13, color: "#94a3b8", padding: "8px 0" }}>Äang táº£i danh sÃ¡ch quáº£n lÃ½...</div>
                        ) : (
                            <select className="ab-select" name="managerId" value={form.managerId} onChange={hc}>
                                <option value="">â€” ChÆ°a phÃ¢n cÃ´ng â€”</option>
                                {managers.map(m => (
                                    <option key={m._id} value={m._id}>{m.username} ({m.email})</option>
                                ))}
                            </select>
                        )}
                        {selectedMgr && (
                            <div style={{ marginTop: 6, fontSize: 12, color: "#6366f1", display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                    {selectedMgr.username[0].toUpperCase()}
                                </div>
                                <span>ÄÃ£ chá»n: <strong>{selectedMgr.username}</strong> â€” {selectedMgr.email}</span>
                                <button type="button" onClick={() => setForm(p => ({ ...p, managerId: "" }))}
                                    style={{ marginLeft: "auto", background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>
                                    âœ• XÃ³a phÃ¢n quyá»n
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="ab-field full"><label className="ab-label">MÃ´ táº£</label><textarea className="ab-textarea" name="description" placeholder="MÃ´ táº£ thÃªm..." value={form.description} onChange={hc} /></div>
                </div>
                {err && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 10 }}>âš ï¸ {err}</div>}
                <div className="ab-modal-actions">
                    <button className="ab-btn-cancel" onClick={onClose}>Há»§y</button>
                    <button className="ab-btn-confirm" onClick={handleSubmit} disabled={loading}>{loading ? "Äang lÆ°u..." : isEdit ? "Cáº­p nháº­t" : "Táº¡o tÃ²a nhÃ "}</button>
                </div>
            </div>
        </div>
    );
}


function BRoomModal({ building, onClose, onSuccess }) {
    const [form, setForm] = useState({ roomNumber: "", floor: "", type: "standard", maxOccupancy: "4", pricePerTerm: "", status: "available", description: "" });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleSubmit = async () => {
        if (!form.roomNumber || !form.floor || !form.pricePerTerm) { setErr("Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§: sá»‘ phÃ²ng, táº§ng, giÃ¡/ká»³"); return; }
        setLoading(true); setErr("");
        try { await api.post(`/buildings/${building._id}/rooms`, form); onSuccess(); }
        catch (e) { setErr(e.response?.data?.message || "Táº¡o phÃ²ng tháº¥t báº¡i"); }
        setLoading(false);
    };
    return (
        <div className="ab-overlay" onClick={onClose}>
            <div className="ab-modal" onClick={e => e.stopPropagation()}>
                <div className="ab-modal-title">ðŸ›¢ ThÃªm phÃ²ng â€” {building.name}</div>
                <div className="ab-modal-grid">
                    <div className="ab-field"><label className="ab-label">Sá»‘ phÃ²ng *</label><input className="ab-input" name="roomNumber" placeholder="VD: 101" value={form.roomNumber} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">Táº§ng *</label><input className="ab-input" name="floor" type="number" min="1" placeholder="VD: 1" value={form.floor} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">Loáº¡i phÃ²ng</label>
                        <select className="ab-select" name="type" value={form.type} onChange={hc}>
                            <option value="standard">TiÃªu chuáº©n</option>
                            <option value="vip">VIP</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>
                    <div className="ab-field"><label className="ab-label">Sá»©c chá»©a tá»‘i Ä‘a</label><input className="ab-input" name="maxOccupancy" type="number" min="1" value={form.maxOccupancy} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">GiÃ¡ / ká»³ (Ä‘á»“ng) *</label><input className="ab-input" name="pricePerTerm" type="number" min="0" placeholder="VD: 1500000" value={form.pricePerTerm} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">Tráº¡ng thÃ¡i</label>
                        <select className="ab-select" name="status" value={form.status} onChange={hc}>
                            <option value="available">CÃ²n chá»—</option>
                            <option value="maintenance">Báº£o trÃ¬</option>
                        </select>
                    </div>
                    <div className="ab-field full"><label className="ab-label">MÃ´ táº£ / tiá»‡n nghi</label><textarea className="ab-textarea" name="description" placeholder="VD: PhÃ²ng cÃ³ Ä‘iá»u hÃ²a, tá»§ Ä‘á»“..." value={form.description} onChange={hc} /></div>
                </div>
                {err && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 10 }}>âš ï¸ {err}</div>}
                <div className="ab-modal-actions">
                    <button className="ab-btn-cancel" onClick={onClose}>Há»§y</button>
                    <button className="ab-btn-confirm" onClick={handleSubmit} disabled={loading}>{loading ? "Äang táº¡o..." : "Táº¡o phÃ²ng"}</button>
                </div>
            </div>
        </div>
    );
}

function BuildingsPanel() {
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState(null);
    const [modal, setModal] = useState(null);

    const showAlert = useCallback((type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 4000); }, []);

    const load = useCallback(() => {
        setLoading(true);
        api.get("/buildings")
            .then(r => setBuildings(r.data.data || []))
            .catch(() => showAlert("error", "KhÃ´ng thá»ƒ táº£i danh sÃ¡ch tÃ²a nhÃ "))
            .finally(() => setLoading(false));
    }, [showAlert]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (building) => {
        if (!window.confirm(`XÃ³a tÃ²a nhÃ  "${building.name}"?`)) return;
        try { await api.delete(`/buildings/${building._id}`); showAlert("success", `ÄÃ£ xÃ³a tÃ²a nhÃ  ${building.name}`); load(); }
        catch (err) { showAlert("error", err.response?.data?.message || "XÃ³a tháº¥t báº¡i"); }
    };

    return (
        <>
            <div className="sd-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h2 className="sd-panel-title">ðŸ¢ Quáº£n lÃ½ TÃ²a nhÃ  &amp; PhÃ²ng</h2>
                    <p className="sd-panel-subtitle">Táº¡o vÃ  quáº£n lÃ½ tÃ²a nhÃ , phÃ²ng á»Ÿ KTX</p>
                </div>
                <button className="ab-btn-create" onClick={() => setModal({ type: "building" })}>ï¼‹ Táº¡o tÃ²a nhÃ </button>
            </div>

            {alert && <div className={`ab-alert ${alert.type}`} style={{ marginBottom: 16 }}>{alert.type === "success" ? "âœ…" : "âŒ"} {alert.msg}</div>}

            {/* Stats */}
            <div className="ab-stats" style={{ marginBottom: 16 }}>
                <div className="ab-stat"><div className="ab-stat-num">{buildings.length}</div><div className="ab-stat-label">TÃ²a nhÃ </div></div>
                <div className="ab-stat"><div className="ab-stat-num">{buildings.filter(b => b.status === "active").length}</div><div className="ab-stat-label">Äang hoáº¡t Ä‘á»™ng</div></div>
                <div className="ab-stat"><div className="ab-stat-num">{buildings.filter(b => b.status === "maintenance").length}</div><div className="ab-stat-label">Äang báº£o trÃ¬</div></div>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "60px", color: "#bbb" }}><span className="ab-spinner" />Äang táº£i...</div>
            ) : buildings.length === 0 ? (
                <div className="ab-empty-page"><span className="ab-empty-icon">ðŸ—ï¸</span><p>ChÆ°a cÃ³ tÃ²a nhÃ  nÃ o. Nháº¥n "+Táº¡o tÃ²a nhÃ " Ä‘á»ƒ báº¯t Ä‘áº§u!</p></div>
            ) : (
                <div className="ab-building-list">
                    {buildings.map(b => (
                        <BBuildingCard
                            key={b._id}
                            building={b}
                            onEdit={building => setModal({ type: "building-edit", data: building })}
                            onDelete={handleDelete}
                            onAddRoom={(building, refresh) => setModal({ type: "room", data: building, onRoomSuccess: refresh })}
                            showAlert={showAlert}
                        />
                    ))}
                </div>
            )}

            {modal?.type === "building" && (
                <BBuildingModal building={null} onClose={() => setModal(null)} onSuccess={() => { setModal(null); showAlert("success", "Táº¡o tÃ²a nhÃ  thÃ nh cÃ´ng!"); load(); }} />
            )}
            {modal?.type === "building-edit" && (
                <BBuildingModal building={modal.data} onClose={() => setModal(null)} onSuccess={() => { setModal(null); showAlert("success", "Cáº­p nháº­t tÃ²a nhÃ  thÃ nh cÃ´ng!"); load(); }} />
            )}
            {modal?.type === "room" && (
                <BRoomModal
                    building={modal.data}
                    onClose={() => setModal(null)}
                    onSuccess={() => { setModal(null); showAlert("success", "Táº¡o phÃ²ng thÃ nh cÃ´ng!"); if (modal.onRoomSuccess) modal.onRoomSuccess(); }}
                />
            )}
        </>
    );
}

/* â”€â”€ Reports helpers â”€â”€ */
const R_TYPE_LABELS = { general: "ðŸ“‹ Tá»•ng quÃ¡t", maintenance: "ðŸ”§ Báº£o trÃ¬", incident: "âš ï¸ Sá»± cá»‘", monthly: "ðŸ“… HÃ ng thÃ¡ng" };
const R_TYPE_COLORS = { general: "#6366f1", maintenance: "#f59e0b", incident: "#ef4444", monthly: "#22c55e" };

function RReviewModal({ report, onClose, onSuccess, onError }) {
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const handleSubmit = async e => {
        e.preventDefault(); setLoading(true);
        try { await api.put(`/reports/${report._id}/review`, { note }); onSuccess(); }
        catch (err) { onError(err.response?.data?.message || "Duyá»‡t tháº¥t báº¡i"); }
        finally { setLoading(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2>âœ… Duyá»‡t bÃ¡o cÃ¡o</h2><button className="modal-close" onClick={onClose}>âœ•</button></div>
                <div className="review-preview">
                    <div className="rp-row"><span className="rp-label">TiÃªu Ä‘á»</span><span className="rp-val">{report.title}</span></div>
                    <div className="rp-row"><span className="rp-label">NgÆ°á»i gá»­i</span><span className="rp-val">{report.managerId?.username} Â· {report.buildingId?.name}</span></div>
                    <div className="rp-row"><span className="rp-label">Ná»™i dung</span><span className="rp-val content-preview">{report.content}</span></div>
                </div>
                <form onSubmit={handleSubmit} className="review-form">
                    <div className="form-row"><label>Ghi chÃº pháº£n há»“i (tuá»³ chá»n)</label>
                        <textarea rows={4} placeholder="Nháº­p pháº£n há»“i gá»­i láº¡i cho quáº£n lÃ½..." value={note} onChange={e => setNote(e.target.value)} />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Há»§y</button>
                        <button type="submit" className="btn-approve-modal" disabled={loading}>{loading ? "Äang duyá»‡t..." : "âœ… XÃ¡c nháº­n duyá»‡t"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function RDetailModal({ report, onClose }) {
    const col = R_TYPE_COLORS[report.type] || "#6366f1";
    const isPending = report.status === "pending";
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box wide" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2>ðŸ“„ Chi tiáº¿t bÃ¡o cÃ¡o</h2><button className="modal-close" onClick={onClose}>âœ•</button></div>
                <div className="detail-grid">
                    <div className="detail-item"><span className="d-label">Loáº¡i</span><span className="d-val"><span style={{ background: col + "20", color: col, padding: "3px 10px", borderRadius: 20, fontSize: 13 }}>{R_TYPE_LABELS[report.type]}</span></span></div>
                    <div className="detail-item"><span className="d-label">Tráº¡ng thÃ¡i</span><span className={`d-badge ${isPending ? "pending" : "reviewed"}`}>{isPending ? "â³ Chá» duyá»‡t" : "âœ… ÄÃ£ duyá»‡t"}</span></div>
                    <div className="detail-item"><span className="d-label">NgÆ°á»i gá»­i</span><span className="d-val">{report.managerId?.username}</span></div>
                    <div className="detail-item"><span className="d-label">TÃ²a nhÃ </span><span className="d-val">{report.buildingId?.name} â€” {report.buildingId?.address}</span></div>
                    <div className="detail-item"><span className="d-label">NgÃ y gá»­i</span><span className="d-val">{new Date(report.createdAt).toLocaleString("vi-VN")}</span></div>
                </div>
                <div className="detail-content-box"><span className="d-label">Ná»™i dung bÃ¡o cÃ¡o</span><p>{report.content}</p></div>
                {report.adminReview?.note && (
                    <div className="detail-admin-note">
                        <span className="d-label">ðŸ’¬ Pháº£n há»“i tá»« Admin</span>
                        <p>{report.adminReview.note}</p>
                        <span className="note-meta">â€” {report.adminReview.reviewedBy?.username} | {new Date(report.adminReview.reviewedAt).toLocaleString("vi-VN")}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

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
        } catch { showAlert("error", "KhÃ´ng thá»ƒ táº£i danh sÃ¡ch bÃ¡o cÃ¡o"); }
        finally { setLoading(false); }
    }, [tab, filterType]);

    useEffect(() => { load(); }, [load]);

    const closeModal = () => { setSelected(null); setModal(null); };
    const pending = reports.filter(r => r.status === "pending").length;

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">ðŸ“‘ Duyá»‡t bÃ¡o cÃ¡o</h2>
                <p className="sd-panel-subtitle">Xem xÃ©t vÃ  pháº£n há»“i bÃ¡o cÃ¡o tá»« quáº£n lÃ½</p>
            </div>

            {alert.msg && (
                <div className={`ar-alert ${alert.type}`} style={{ marginBottom: 16 }}>
                    {alert.type === "success" ? "âœ…" : "âš ï¸"} {alert.msg}
                </div>
            )}

            <div className="ar-toolbar" style={{ marginBottom: 16 }}>
                <div className="ar-tabs">
                    <button className={`ar-tab ${tab === "pending" ? "active" : ""}`} onClick={() => setTab("pending")}>
                        â³ Chá» duyá»‡t {pending > 0 && <span className="ar-badge">{pending}</span>}
                    </button>
                    <button className={`ar-tab ${tab === "reviewed" ? "active" : ""}`} onClick={() => setTab("reviewed")}>âœ… ÄÃ£ duyá»‡t</button>
                </div>
                <select className="ar-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="">Táº¥t cáº£ loáº¡i</option>
                    <option value="general">Tá»•ng quÃ¡t</option>
                    <option value="maintenance">Báº£o trÃ¬</option>
                    <option value="incident">Sá»± cá»‘</option>
                    <option value="monthly">HÃ ng thÃ¡ng</option>
                </select>
            </div>

            <div className="ar-list">
                {loading ? (
                    <div className="ar-empty">Äang táº£i...</div>
                ) : reports.length === 0 ? (
                    <div className="ar-empty">{tab === "pending" ? "ðŸŽ‰ KhÃ´ng cÃ³ bÃ¡o cÃ¡o nÃ o chá» duyá»‡t!" : "ChÆ°a cÃ³ bÃ¡o cÃ¡o nÃ o Ä‘Æ°á»£c duyá»‡t"}</div>
                ) : (
                    reports.map(r => {
                        const col = R_TYPE_COLORS[r.type] || "#6366f1";
                        return (
                            <div key={r._id} className="ar-row">
                                <div className="ar-row-accent" style={{ background: col }} />
                                <div className="ar-row-body">
                                    <div className="ar-row-top">
                                        <span className="ar-type" style={{ background: col + "20", color: col, border: `1px solid ${col}40` }}>{R_TYPE_LABELS[r.type]}</span>
                                        <span className="ar-sender">ðŸ‘¤ {r.managerId?.username} &nbsp;Â·&nbsp; ðŸ¢ {r.buildingId?.name}</span>
                                        <span className="ar-date">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</span>
                                    </div>
                                    <h3 className="ar-row-title">{r.title}</h3>
                                    <p className="ar-row-preview">{r.content?.slice(0, 120)}{r.content?.length > 120 ? "..." : ""}</p>
                                    {r.adminReview?.note && <div className="ar-note">ðŸ’¬ Pháº£n há»“i: {r.adminReview.note}</div>}
                                </div>
                                <div className="ar-row-actions">
                                    <button className="btn-view" onClick={() => { setSelected(r); setModal("detail"); }}>ðŸ‘ï¸ Xem</button>
                                    {r.status === "pending" && (
                                        <button className="btn-approve" onClick={() => { setSelected(r); setModal("review"); }}>âœ… Duyá»‡t</button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {modal === "review" && selected && (
                <RReviewModal
                    report={selected}
                    onClose={closeModal}
                    onSuccess={() => { closeModal(); load(); showAlert("success", "ÄÃ£ duyá»‡t bÃ¡o cÃ¡o thÃ nh cÃ´ng!"); }}
                    onError={msg => showAlert("error", msg)}
                />
            )}
            {modal === "detail" && selected && (
                <RDetailModal report={selected} onClose={closeModal} />
            )}
        </>
    );
}

const AN_TYPE_OPTIONS = [
    { value: "general", label: "ðŸ“¢ ThÃ´ng bÃ¡o chung" },
    { value: "payment_reminder", label: "ðŸ’³ Nháº¯c thanh toÃ¡n" },
    { value: "maintenance", label: "ðŸ”§ Báº£o trÃ¬" },
    { value: "announcement", label: "ðŸ“£ Quan trá»ng" },
];

const AN_TYPE_ICONS = { general: "ðŸ“¢", payment_reminder: "ðŸ’³", maintenance: "ðŸ”§", announcement: "ðŸ“£" };

function formatDate(d) {
    return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const AN_INIT_FORM = { title: "", message: "", type: "general", receiverType: "role", targetRole: "student", receiverIds: [] };

/* â”€â”€ Finance Panel â”€â”€ */
const FIN_TYPE_LABELS = { room_fee: "PhÃ­ phÃ²ng", electricity: "Äiá»‡n", violation_fine: "PhÃ­ vi pháº¡m", damage_compensation: "Bá»“i thÆ°á»ng", other: "KhÃ¡c" };
const FIN_TYPE_COLORS = { room_fee: "#6366f1", electricity: "#f59e0b", violation_fine: "#ef4444", damage_compensation: "#ec4899", other: "#94a3b8" };
const fmtMoney = (n) => Number(n || 0).toLocaleString("vi-VN") + "Ä‘";

function FinancePanel() {
    const [overview, setOverview] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
    const [byType, setByType] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    const [invoiceStatus, setInvoiceStatus] = useState(""); // "" = all
    const [alertMsg, setAlertMsg] = useState("");

    // Load overview + chart data once
    useEffect(() => {
        setLoading(true);
        api.get("/finance/summary")
            .then(r => {
                const d = r.data.data;
                setOverview(d.overview);
                setMonthlyData(d.monthlyData || []);
                setByType(d.byType || []);
                setInvoices(d.recentInvoices || []);
            })
            .catch(() => setAlertMsg("KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u tÃ i chÃ­nh"))
            .finally(() => setLoading(false));
    }, []);

    // Reload only invoices when filter changes (skip initial load)
    const isFirstRender = useCallback(() => { }, []);
    useEffect(() => {
        if (loading) return; // wait for initial load
        setInvoiceLoading(true);
        const params = invoiceStatus ? { status: invoiceStatus } : {};
        api.get("/finance/summary", { params })
            .then(r => setInvoices(r.data.data?.recentInvoices || []))
            .catch(() => { })
            .finally(() => setInvoiceLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoiceStatus]);

    if (loading) return <div style={{ textAlign: "center", padding: "60px", color: "#bbb" }}><div className="ab-spinner" /><p>Äang táº£i...</p></div>;

    const ov = overview || {};
    const maxRev = Math.max(...monthlyData.map(m => m.revenue), 1);

    const STATUS_FILTERS = [
        { value: "", label: "Táº¥t cáº£", color: "#64748b" },
        { value: "paid", label: "ÄÃ£ thanh toÃ¡n", color: "#22c55e" },
        { value: "unpaid", label: "ChÆ°a thanh toÃ¡n", color: "#ef4444" },
        { value: "partial", label: "Má»™t pháº§n", color: "#f59e0b" },
        { value: "overdue", label: "QuÃ¡ háº¡n", color: "#dc2626" },
    ];

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">ðŸ’° BÃ¡o cÃ¡o TÃ i chÃ­nh</h2>
                <p className="sd-panel-subtitle">Tá»•ng há»£p doanh thu vÃ  hÃ³a Ä‘Æ¡n toÃ n há»‡ thá»‘ng</p>
            </div>

            {alertMsg && <div className="ab-alert error" style={{ marginBottom: 16 }}>{alertMsg}</div>}

            {/* Overview stats */}
            <div className="ad-stats-grid" style={{ marginBottom: 24 }}>
                <div className="ad-stat-card">
                    <div className="ad-stat-icon" style={{ background: "#22c55e18" }}>ðŸ’µ</div>
                    <div>
                        <div className="ad-stat-num" style={{ color: "#22c55e" }}>{fmtMoney(ov.totalRevenue)}</div>
                        <div className="sd-stat-label">ÄÃ£ thu vá»</div>
                    </div>
                </div>
                <div className="ad-stat-card">
                    <div className="ad-stat-icon" style={{ background: "#ef444418" }}>âš ï¸</div>
                    <div>
                        <div className="ad-stat-num" style={{ color: "#ef4444" }}>{fmtMoney(ov.unpaidAmount)}</div>
                        <div className="sd-stat-label">ChÆ°a thu</div>
                    </div>
                </div>
                <div className="ad-stat-card">
                    <div className="ad-stat-icon" style={{ background: "#6366f118" }}>ðŸ“Š</div>
                    <div>
                        <div className="ad-stat-num" style={{ color: "#6366f1" }}>{ov.totalInvoices || 0}</div>
                        <div className="sd-stat-label">Tá»•ng hÃ³a Ä‘Æ¡n</div>
                    </div>
                </div>
                <div className="ad-stat-card">
                    <div className="ad-stat-icon" style={{ background: "#f59e0b18" }}>ðŸŽ¯</div>
                    <div>
                        <div className="ad-stat-num" style={{ color: "#f59e0b" }}>{ov.collectionRate || 0}%</div>
                        <div className="sd-stat-label">Tá»· lá»‡ thu</div>
                    </div>
                </div>
            </div>

            {/* Invoice status breakdown â€” click to filter */}
            <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                {[
                    { label: "ÄÃ£ thanh toÃ¡n", count: ov.paidCount, color: "#22c55e", val: "paid" },
                    { label: "ChÆ°a thanh toÃ¡n", count: ov.unpaidCount, color: "#ef4444", val: "unpaid" },
                    { label: "Thanh toÃ¡n má»™t pháº§n", count: ov.partialCount, color: "#f59e0b", val: "partial" },
                    { label: "QuÃ¡ háº¡n", count: ov.overdueCount, color: "#dc2626", val: "overdue" },
                ].map(s => (
                    <div
                        key={s.label}
                        onClick={() => setInvoiceStatus(prev => prev === s.val ? "" : s.val)}
                        title="Click Ä‘á»ƒ lá»c hÃ³a Ä‘Æ¡n"
                        style={{
                            flex: "1 1 130px", borderRadius: 10, padding: "12px 16px", textAlign: "center",
                            cursor: "pointer", transition: "all .2s",
                            background: invoiceStatus === s.val ? s.color : s.color + "12",
                            border: `2px solid ${invoiceStatus === s.val ? s.color : s.color + "40"}`,
                            color: invoiceStatus === s.val ? "#fff" : "inherit",
                        }}
                    >
                        <div style={{ fontSize: 22, fontWeight: 800, color: invoiceStatus === s.val ? "#fff" : s.color }}>{s.count || 0}</div>
                        <div style={{ fontSize: 12, marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Monthly bar chart */}
            <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#444", marginBottom: 12 }}>ðŸ“… Doanh thu 12 thÃ¡ng gáº§n nháº¥t</h3>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 140, overflowX: "auto", paddingBottom: 8 }}>
                    {monthlyData.map(m => {
                        const pct = Math.round((m.revenue / maxRev) * 100);
                        return (
                            <div key={`${m.year}-${m.month}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 48, flex: 1 }}>
                                <div style={{ fontSize: 9, color: "#888", marginBottom: 3, whiteSpace: "nowrap" }}>
                                    {m.revenue > 0 ? (m.revenue / 1e6).toFixed(1) + "M" : ""}
                                </div>
                                <div title={`${m.label}: ${fmtMoney(m.revenue)}`} style={{ width: "100%", maxWidth: 40, height: `${Math.max(pct, 3)}%`, background: pct > 0 ? "linear-gradient(180deg,#6366f1,#818cf8)" : "#e5e7eb", borderRadius: "4px 4px 0 0", transition: "height .3s" }} />
                                <div style={{ fontSize: 9, color: "#888", marginTop: 4, transform: "rotate(-30deg)", transformOrigin: "top left", whiteSpace: "nowrap", paddingTop: 8 }}>{m.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* By type */}
            {byType.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#444", marginBottom: 12 }}>ðŸ·ï¸ PhÃ¢n loáº¡i doanh thu</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {byType.map(t => {
                            const col = FIN_TYPE_COLORS[t.type] || "#94a3b8";
                            const pct = ov.totalBilled > 0 ? Math.round((t.totalBilled / ov.totalBilled) * 100) : 0;
                            return (
                                <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 110, fontSize: 12, color: "#555", flexShrink: 0 }}>{t.label}</div>
                                    <div style={{ flex: 1, height: 10, background: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
                                        <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 5 }} />
                                    </div>
                                    <div style={{ width: 90, fontSize: 11, color: "#777", textAlign: "right", flexShrink: 0 }}>{fmtMoney(t.totalBilled)}</div>
                                    <div style={{ width: 36, fontSize: 11, color: col, fontWeight: 700, flexShrink: 0 }}>{pct}%</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent invoices with filter */}
            <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#444", margin: 0 }}>
                        ðŸ“œ HÃ³a Ä‘Æ¡n {invoiceStatus ? `â€” ${STATUS_FILTERS.find(f => f.value === invoiceStatus)?.label}` : "gáº§n nháº¥t"}
                        <span style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8", marginLeft: 6 }}>({invoices.length})</span>
                    </h3>
                    {/* Filter pills */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {STATUS_FILTERS.map(f => (
                            <button
                                key={f.value}
                                onClick={() => setInvoiceStatus(f.value)}
                                style={{
                                    padding: "4px 12px", fontSize: 12, borderRadius: 20, cursor: "pointer", border: "1.5px solid",
                                    borderColor: invoiceStatus === f.value ? f.color : "#e2e8f0",
                                    background: invoiceStatus === f.value ? f.color : "#f8fafc",
                                    color: invoiceStatus === f.value ? "#fff" : "#555",
                                    fontWeight: invoiceStatus === f.value ? 700 : 400,
                                    transition: "all .15s",
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="sd-table-wrap" style={{ position: "relative" }}>
                    {invoiceLoading && (
                        <div style={{ position: "absolute", inset: 0, background: "#fff9", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, borderRadius: 8 }}>
                            <div className="ab-spinner" />
                        </div>
                    )}
                    {invoices.length === 0 && !invoiceLoading ? (
                        <div style={{ textAlign: "center", padding: 32, color: "#94a3b8", fontSize: 14 }}>
                            ðŸŽ‰ KhÃ´ng cÃ³ hÃ³a Ä‘Æ¡n nÃ o {invoiceStatus ? `vá»›i tráº¡ng thÃ¡i "${STATUS_FILTERS.find(f => f.value === invoiceStatus)?.label}"` : ""}
                        </div>
                    ) : (
                        <table className="sd-table">
                            <thead>
                                <tr><th>MÃ£ HD</th><th>Sinh viÃªn</th><th>Loáº¡i</th><th>Sá»‘ tiá»n</th><th>Tráº¡ng thÃ¡i</th></tr>
                            </thead>
                            <tbody>
                                {invoices.map(inv => (
                                    <tr key={inv._id}>
                                        <td style={{ fontFamily: "monospace", fontSize: 11 }}>{inv.invoiceCode}</td>
                                        <td>{inv.studentId?.fullName || "â€”"}<br /><span style={{ fontSize: 11, color: "#999" }}>{inv.studentId?.studentCode}</span></td>
                                        <td><span style={{ fontSize: 11, background: (FIN_TYPE_COLORS[inv.type] || "#94a3b8") + "20", color: FIN_TYPE_COLORS[inv.type] || "#94a3b8", padding: "2px 8px", borderRadius: 10 }}>{FIN_TYPE_LABELS[inv.type] || inv.type}</span></td>
                                        <td style={{ fontWeight: 700 }}>{fmtMoney(inv.amount)}</td>
                                        <td>
                                            <span className={`sd-badge ${inv.status === "paid" ? "approved" : inv.status === "unpaid" || inv.status === "overdue" ? "rejected" : "pending"}`}>
                                                {{ paid: "ÄÃ£ TT", unpaid: "ChÆ°a TT", overdue: "QuÃ¡ háº¡n", partial: "Má»™t pháº§n" }[inv.status] || inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}

function NotificationsPanel() {
    const [form, setForm] = useState(AN_INIT_FORM);
    const [sending, setSending] = useState(false);
    const [alert, setAlert] = useState({ type: "", msg: "" });
    const [sentList, setSentList] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [activeTab, setActiveTab] = useState("send");
    // Individual recipient state
    const [searchRole, setSearchRole] = useState("student");
    const [userSearch, setUserSearch] = useState("");
    const [userResults, setUserResults] = useState([]);
    const [userSearching, setUserSearching] = useState(false);
    const [receiverIds, setReceiverIds] = useState([]); // [{_id, username, email}]

    const showAlert = (type, msg) => {
        setAlert({ type, msg });
        setTimeout(() => setAlert({ type: "", msg: "" }), 4000);
    };

    // Live search users by role
    useEffect(() => {
        if (!userSearch.trim()) { setUserResults([]); return; }
        const timer = setTimeout(async () => {
            setUserSearching(true);
            try {
                const { data } = await api.get("/users", { params: { role: searchRole, search: userSearch } });
                setUserResults(data.users || []);
            } catch { setUserResults([]); }
            finally { setUserSearching(false); }
        }, 300);
        return () => clearTimeout(timer);
    }, [userSearch, searchRole]);

    const loadSentList = useCallback(async () => {
        setLoadingList(true);
        try {
            const { data } = await api.get("/notifications/sent?limit=30");
            setSentList(data.data || []);
        } catch { /* silent */ } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => { loadSentList(); }, [loadSentList]);

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSend = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.message.trim()) {
            showAlert("error", "Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ tiÃªu Ä‘á» vÃ  ná»™i dung");
            return;
        }
        if (form.receiverType === "individual" && receiverIds.length === 0) {
            showAlert("error", "Vui lÃ²ng chá»n Ã­t nháº¥t má»™t ngÆ°á»i nháº­n");
            return;
        }
        setSending(true);
        try {
            const payload = { ...form, receiverIds: receiverIds.map(u => u._id) };
            const { data } = await api.post("/notifications/send", payload);
            showAlert("success", data.message || "Gá»­i thÃ´ng bÃ¡o thÃ nh cÃ´ng!");
            setForm(AN_INIT_FORM);
            setReceiverIds([]);
            setUserSearch("");
            setUserResults([]);
            loadSentList();
            setActiveTab("history");
        } catch (err) {
            showAlert("error", err.response?.data?.message || "Gá»­i tháº¥t báº¡i");
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">ðŸ”” ThÃ´ng bÃ¡o</h2>
                <p className="sd-panel-subtitle">Gá»­i thÃ´ng bÃ¡o Ä‘áº¿n sinh viÃªn vÃ  quáº£n lÃ½</p>
            </div>

            {/* Alert */}
            {alert.msg && (
                <div className={`an-alert ${alert.type}`} style={{ marginBottom: 16 }}>
                    {alert.type === "success" ? "âœ…" : "âš ï¸"} {alert.msg}
                </div>
            )}

            {/* Tabs */}
            <div className="an-tabs" style={{ marginBottom: 20 }}>
                <button className={`an-tab ${activeTab === "send" ? "active" : ""}`} onClick={() => setActiveTab("send")}>
                    âœ‰ï¸ Soáº¡n thÃ´ng bÃ¡o
                </button>
                <button className={`an-tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
                    ðŸ“‹ Lá»‹ch sá»­ gá»­i {sentList.length > 0 && <span className="an-tab-count">{sentList.length}</span>}
                </button>
            </div>

            {/* Tab: Soáº¡n thÃ´ng bÃ¡o */}
            {activeTab === "send" && (
                <div className="an-send-panel" style={{ maxWidth: "100%" }}>
                    <form className="an-form" onSubmit={handleSend}>
                        {/* Loáº¡i thÃ´ng bÃ¡o */}
                        <div className="an-field">
                            <label className="an-label">Loáº¡i thÃ´ng bÃ¡o</label>
                            <div className="an-type-grid">
                                {AN_TYPE_OPTIONS.map((t) => (
                                    <label key={t.value} className={`an-type-card ${form.type === t.value ? "selected" : ""}`}>
                                        <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={handleChange} />
                                        {t.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Äá»‘i tÆ°á»£ng nháº­n */}
                        <div className="an-field">
                            <label className="an-label">Gá»­i Ä‘áº¿n</label>
                            <div className="an-receiver-row">
                                <select name="receiverType" value={form.receiverType} onChange={e => {
                                    handleChange(e);
                                    setReceiverIds([]);
                                    setUserSearch("");
                                    setUserResults([]);
                                }} className="an-select">
                                    <option value="role">Theo nhÃ³m ngÆ°á»i dÃ¹ng</option>
                                    <option value="individual">CÃ¡ nhÃ¢n</option>
                                </select>
                                {form.receiverType === "role" && (
                                    <select name="targetRole" value={form.targetRole} onChange={handleChange} className="an-select">
                                        <option value="student">ðŸŽ“ Táº¥t cáº£ sinh viÃªn</option>
                                        <option value="manager">ðŸ“‹ Táº¥t cáº£ quáº£n lÃ½</option>
                                        <option value="all">ðŸ‘¥ Táº¥t cáº£ ngÆ°á»i dÃ¹ng</option>
                                    </select>
                                )}
                            </div>

                            {/* Individual: role selector + search */}
                            {form.receiverType === "individual" && (
                                <div style={{ marginTop: 10 }}>
                                    {/* Role filter for search */}
                                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                        <select className="an-select" value={searchRole} onChange={e => { setSearchRole(e.target.value); setUserSearch(""); setUserResults([]); }}>
                                            <option value="student">ðŸŽ“ Sinh viÃªn</option>
                                            <option value="manager">ðŸ¢ Quáº£n lÃ½</option>
                                            <option value="admin">ðŸ›¡ï¸ Admin</option>
                                        </select>
                                    </div>

                                    {/* Search input */}
                                    <div style={{ position: "relative" }}>
                                        <input
                                            className="an-input"
                                            placeholder="ðŸ” TÃ¬m username hoáº·c email..."
                                            value={userSearch}
                                            onChange={e => setUserSearch(e.target.value)}
                                        />
                                        {userSearching && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#888" }}>Äang tÃ¬m...</span>}
                                        {userResults.length > 0 && (
                                            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px #0002", zIndex: 100, maxHeight: 220, overflowY: "auto" }}>
                                                {userResults.map(u => (
                                                    <div
                                                        key={u._id}
                                                        onClick={() => {
                                                            if (!receiverIds.find(r => r._id === u._id)) {
                                                                setReceiverIds(prev => [...prev, u]);
                                                            }
                                                            setUserSearch("");
                                                            setUserResults([]);
                                                        }}
                                                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}
                                                        onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                                        onMouseLeave={e => e.currentTarget.style.background = ""}
                                                    >
                                                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                                                            {u.username[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{u.username}</div>
                                                            <div style={{ fontSize: 11, color: "#888" }}>{u.email}</div>
                                                        </div>
                                                        {receiverIds.find(r => r._id === u._id) && <span style={{ marginLeft: "auto", color: "#22c55e", fontSize: 16 }}>âœ“</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected tags */}
                                    {receiverIds.length > 0 && (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                                            {receiverIds.map(u => (
                                                <span key={u._id} style={{ display: "flex", alignItems: "center", gap: 5, background: "#6366f115", border: "1px solid #6366f130", borderRadius: 20, padding: "4px 10px", fontSize: 12, color: "#6366f1" }}>
                                                    ðŸ‘¤ {u.username}
                                                    <button type="button" onClick={() => setReceiverIds(prev => prev.filter(r => r._id !== u._id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, padding: 0, lineHeight: 1 }}>Ã—</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {receiverIds.length === 0 && <p style={{ fontSize: 12, color: "#e8540a", marginTop: 6 }}>âš ï¸ ChÆ°a chá»n ngÆ°á»i nháº­n nÃ o</p>}
                                </div>
                            )}

                            <p className="an-receiver-hint">
                                ðŸ“¤ Sáº½ gá»­i tá»›i: <strong>
                                    {form.receiverType === "role"
                                        ? (form.targetRole === "all" ? "Táº¥t cáº£ ngÆ°á»i dÃ¹ng" : form.targetRole === "student" ? "Táº¥t cáº£ sinh viÃªn" : "Táº¥t cáº£ quáº£n lÃ½")
                                        : receiverIds.length > 0 ? `${receiverIds.length} ngÆ°á»i Ä‘Ã£ chá»n` : "ChÆ°a chá»n"}
                                </strong>
                            </p>
                        </div>

                        {/* TiÃªu Ä‘á» */}
                        <div className="an-field">
                            <label className="an-label">TiÃªu Ä‘á» <span className="req">*</span></label>
                            <input className="an-input" name="title" value={form.title} onChange={handleChange}
                                placeholder="Nháº­p tiÃªu Ä‘á» thÃ´ng bÃ¡o..." maxLength={120} required />
                            <span className="an-char-count">{form.title.length}/120</span>
                        </div>

                        {/* Ná»™i dung */}
                        <div className="an-field">
                            <label className="an-label">Ná»™i dung <span className="req">*</span></label>
                            <textarea className="an-textarea" name="message" value={form.message} onChange={handleChange}
                                placeholder="Nháº­p ná»™i dung thÃ´ng bÃ¡o chi tiáº¿t..." rows={4} maxLength={1000} required />
                            <span className="an-char-count">{form.message.length}/1000</span>
                        </div>

                        {/* Preview */}
                        {(form.title || form.message) && (
                            <div className="an-preview">
                                <p className="an-preview-label">ðŸ‘ï¸ Xem trÆ°á»›c</p>
                                <div className="an-preview-card">
                                    <div className="an-preview-icon">{AN_TYPE_ICONS[form.type]}</div>
                                    <div>
                                        <div className="an-preview-title">{form.title || "TiÃªu Ä‘á»..."}</div>
                                        <div className="an-preview-msg">{form.message || "Ná»™i dung..."}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="an-form-actions">
                            <button type="button" className="an-btn-reset" onClick={() => { setForm(AN_INIT_FORM); setReceiverIds([]); setUserSearch(""); setUserResults([]); }}>ðŸ”„ Äáº·t láº¡i</button>
                            <button type="submit" className="an-btn-send" disabled={sending}>
                                {sending ? <><span className="an-spinner" /> Äang gá»­i...</> : "ðŸ“¤ Gá»­i thÃ´ng bÃ¡o"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tab: Lá»‹ch sá»­ */}
            {activeTab === "history" && (
                <div className="an-history-panel" style={{ maxWidth: "100%" }}>
                    {loadingList ? (
                        <div className="an-history-loading"><div className="an-spinner-lg" /><span>Äang táº£i lá»‹ch sá»­...</span></div>
                    ) : sentList.length === 0 ? (
                        <div className="an-history-empty"><span>ðŸ“­</span><p>ChÆ°a cÃ³ thÃ´ng bÃ¡o nÃ o Ä‘Æ°á»£c gá»­i</p></div>
                    ) : (
                        <div className="an-history-list">
                            {sentList.map((n) => (
                                <div key={n._id} className="an-history-item">
                                    <div className="an-history-icon">{AN_TYPE_ICONS[n.type] || "ðŸ“¢"}</div>
                                    <div className="an-history-content">
                                        <div className="an-history-title">{n.title}</div>
                                        <div className="an-history-msg">{n.message}</div>
                                        <div className="an-history-meta">
                                            <span className="an-history-target">
                                                {n.receiverType === "role"
                                                    ? (n.targetRole === "all" ? "ðŸ‘¥ Táº¥t cáº£" : n.targetRole === "student" ? "ðŸŽ“ Sinh viÃªn" : "ðŸ“‹ Quáº£n lÃ½")
                                                    : "ðŸ‘¤ CÃ¡ nhÃ¢n"}
                                            </span>
                                            <span className="an-history-receivers">{n.receiverIds?.length || 0} ngÆ°á»i nháº­n</span>
                                            <span className="an-history-read">âœ… {n.readBy?.length || 0} Ä‘Ã£ Ä‘á»c</span>
                                            <span className="an-history-date">{formatDate(n.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

/* â”€â”€ Settings Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const INV_TYPE_OPTIONS = [
    { value: "violation_fine", label: "ðŸš« Vi pháº¡m quy cháº¿" },
    { value: "damage_compensation", label: "ðŸ’¥ Bá»“i thÆ°á»ng thiá»‡t háº¡i" },
    { value: "electricity", label: "âš¡ Äiá»‡n vÆ°á»£t trá»™i" },
    { value: "room_fee", label: "ðŸ  PhÃ­ phÃ²ng" },
    { value: "other", label: "ðŸ“„ KhÃ¡c" },
];

const PRICE_CONFIG = [
    { key: "violation_fine_rate", label: "ðŸš« PhÃ­ vi pháº¡m quy cháº¿", unit: "Ä‘á»“ng/láº§n", suffix: "Ä‘", color: "#ef4444" },
    { key: "electricity_excess_rate", label: "âš¡ Äiá»‡n vÆ°á»£t trá»™i", unit: "Ä‘á»“ng/kWh", suffix: "Ä‘", color: "#f59e0b" },
    { key: "damage_compensation_rate", label: "ðŸ’¥ Bá»“i thÆ°á»ng thiá»‡t háº¡i", unit: "Ä‘á»“ng/vá»¥", suffix: "Ä‘", color: "#ec4899" },
    { key: "free_electricity_units", label: "ðŸ’¡ Sá»‘ Ä‘iá»‡n miá»…n phÃ­ má»—i thÃ¡ng", unit: "kWh/phÃ²ng", suffix: "kWh", color: "#22c55e" },
];


function SettingsPanel() {
    const [activeTab, setActiveTab] = useState("prices");
    // Prices state
    const [prices, setPrices] = useState({});
    const [priceLoading, setPriceLoading] = useState(true);
    const [priceSaving, setPriceSaving] = useState(false);
    const [priceAlert, setPriceAlert] = useState({ type: "", msg: "" });
    const showPriceAlert = (type, msg) => { setPriceAlert({ type, msg }); setTimeout(() => setPriceAlert({ type: "", msg: "" }), 4000); };

    // Registration open toggle
    const [regOpen, setRegOpen] = useState(true);
    const [regToggling, setRegToggling] = useState(false);
    const handleToggleReg = async () => {
        setRegToggling(true);
        try {
            await api.put("/settings/registration-open", { isOpen: !regOpen });
            setRegOpen(p => !p);
            showPriceAlert("success", !regOpen ? "ÄÃ£ má»Ÿ Ä‘Äƒng kÃ½ phÃ²ng!" : "ÄÃ£ táº¯t Ä‘Äƒng kÃ½ phÃ²ng!");
        } catch { showPriceAlert("error", "KhÃ´ng thá»ƒ thay Ä‘á»•i tráº¡ng thÃ¡i"); }
        finally { setRegToggling(false); }
    };

    // Bill sender state
    // Táº¡o ká»³ há»c tá»± Ä‘á»™ng tá»« ngÃ y hiá»‡n táº¡i
    const now = new Date();
    const mo = now.getMonth() + 1; // 1-12
    const yr = now.getFullYear();
    const semester = mo <= 3 ? "Spring" : mo <= 8 ? "Summer" : "Fall";
    const autoTermCode = `${semester}${yr}`;
    // Háº¡n thanh toÃ¡n máº·c Ä‘á»‹nh: 2 tuáº§n ká»ƒ tá»« hÃ´m nay
    const twWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const BILL_INIT = { studentSearch: "", selectedStudent: null, type: "violation_fine", amount: "", excessKwh: "", description: "", dueDate: twWeeksLater, termCode: autoTermCode };
    const [bill, setBill] = useState(BILL_INIT);
    const [studentResults, setStudentResults] = useState([]);
    const [studentSearching, setStudentSearching] = useState(false);
    const [billSending, setBillSending] = useState(false);
    const [billAlert, setBillAlert] = useState({ type: "", msg: "" });
    const showBillAlert = (type, msg) => { setBillAlert({ type, msg }); setTimeout(() => setBillAlert({ type: "", msg: "" }), 5000); };

    // Debtor list
    const [debtors, setDebtors] = useState([]);
    const [debtorLoading, setDebtorLoading] = useState(false);

    // Load prices on mount
    useEffect(() => {
        api.get("/settings/prices")
            .then(r => {
                const d = r.data.data;
                const flat = {};
                for (const key of Object.keys(d)) flat[key] = d[key].value;
                setPrices(flat);
            })
            .catch(() => showPriceAlert("error", "KhÃ´ng thá»ƒ táº£i cÃ i Ä‘áº·t giÃ¡"))
            .finally(() => setPriceLoading(false));

        // Load tráº¡ng thÃ¡i Ä‘Äƒng kÃ½ phÃ²ng
        api.get("/settings/registration-open")
            .then(r => setRegOpen(r.data.data.isOpen))
            .catch(() => { });
    }, []);

    // Load debtors when switching to bill tab
    useEffect(() => {
        if (activeTab !== "bill") return;
        setDebtorLoading(true);
        api.get("/invoices/debtors")
            .then(r => setDebtors(r.data.data || []))
            .catch(() => { })
            .finally(() => setDebtorLoading(false));
    }, [activeTab]);

    // Debounced student search
    useEffect(() => {
        if (!bill.studentSearch.trim()) { setStudentResults([]); return; }
        const t = setTimeout(async () => {
            setStudentSearching(true);
            try { const r = await api.get("/invoices/search-students", { params: { q: bill.studentSearch } }); setStudentResults(r.data.data || []); }
            catch { setStudentResults([]); }
            finally { setStudentSearching(false); }
        }, 350);
        return () => clearTimeout(t);
    }, [bill.studentSearch]);

    const handleSavePrices = async () => {
        setPriceSaving(true);
        try {
            await api.put("/settings/prices", prices);
            showPriceAlert("success", "Cáº­p nháº­t giÃ¡ thÃ nh cÃ´ng!");
        } catch { showPriceAlert("error", "LÆ°u tháº¥t báº¡i"); }
        finally { setPriceSaving(false); }
    };

    const handleSendBill = async () => {
        if (!bill.selectedStudent) { showBillAlert("error", "Vui lÃ²ng chá»n sinh viÃªn"); return; }
        if (!bill.dueDate) { showBillAlert("error", "Vui lÃ²ng chá»n háº¡n thanh toÃ¡n"); return; }

        // TÃ­nh sá»‘ tiá»n
        let finalAmount;
        if (bill.type === "electricity") {
            if (!bill.excessKwh || Number(bill.excessKwh) <= 0) { showBillAlert("error", "Vui lÃ²ng nháº­p sá»‘ kWh vÆ°á»£t má»©c há»£p lá»‡"); return; }
            if (!prices.electricity_excess_rate) { showBillAlert("error", "ChÆ°a cÃ³ giÃ¡ Ä‘iá»‡n trong cÃ i Ä‘áº·t"); return; }
            const totalElec = Number(bill.excessKwh) * Number(prices.electricity_excess_rate);
            const occupants = bill.selectedStudent?.currentRoomId?.currentOccupancy || 1;
            finalAmount = Math.ceil(totalElec / occupants); // chia Ä‘á»u, lÃ m trÃ²n lÃªn
        } else {
            if (!bill.amount || Number(bill.amount) <= 0) { showBillAlert("error", "Sá»‘ tiá»n pháº£i lá»›n hÆ¡n 0"); return; }
            finalAmount = Number(bill.amount);
        }
        setBillSending(true);
        try {
            const occupants = bill.selectedStudent?.currentRoomId?.currentOccupancy || 1;
            const { data } = await api.post("/invoices", {
                studentId: bill.selectedStudent._id,
                type: bill.type,
                amount: finalAmount,
                description: bill.description || (
                    bill.type === "electricity"
                        ? `Äiá»‡n vÆ°á»£t má»©c: ${bill.excessKwh} kWh Ã— ${fmtMoney(prices.electricity_excess_rate)}/kWh Ã· ${occupants} ngÆ°á»i = ${fmtMoney(finalAmount)}/ngÆ°á»i`
                        : ""
                ),
                dueDate: bill.dueDate,
                termCode: bill.termCode,
            });
            showBillAlert("success", data.message || "Táº¡o hÃ³a Ä‘Æ¡n thÃ nh cÃ´ng!");
            setBill(BILL_INIT); setStudentResults([]);
            // Reload debtors
            api.get("/invoices/debtors").then(r => setDebtors(r.data.data || []));
        } catch (e) { showBillAlert("error", e.response?.data?.message || "Táº¡o hÃ³a Ä‘Æ¡n tháº¥t báº¡i"); }
        finally { setBillSending(false); }
    };

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">âš™ï¸ CÃ i Ä‘áº·t & Thanh toÃ¡n</h2>
                <p className="sd-panel-subtitle">Quáº£n lÃ½ giÃ¡ dá»‹ch vá»¥ vÃ  gá»­i hÃ³a Ä‘Æ¡n cho sinh viÃªn</p>
            </div>

            {/* Tabs */}
            <div className="an-tabs" style={{ marginBottom: 24 }}>
                <button className={`an-tab ${activeTab === "prices" ? "active" : ""}`} onClick={() => setActiveTab("prices")}>
                    ðŸ’² CÃ i Ä‘áº·t giÃ¡
                </button>
                <button className={`an-tab ${activeTab === "bill" ? "active" : ""}`} onClick={() => setActiveTab("bill")}>
                    ðŸ’» Gá»­i Bill thanh toÃ¡n
                </button>
            </div>

            {/* â”€â”€â”€ Tab: CÃ i Ä‘áº·t giÃ¡ â”€â”€â”€ */}
            {activeTab === "prices" && (
                <div style={{ maxWidth: 640 }}>
                    {priceAlert.msg && (
                        <div className={`an-alert ${priceAlert.type}`} style={{ marginBottom: 16 }}>
                            {priceAlert.type === "success" ? "âœ…" : "âš ï¸"} {priceAlert.msg}
                        </div>
                    )}

                    {priceLoading ? (
                        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}><div className="ab-spinner" /></div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            {/* â”€â”€ Toggle Ä‘Äƒng kÃ½ phÃ²ng â”€â”€ */}
                            <div style={{ background: regOpen ? "#dcfce7" : "#fef2f2", border: `1.5px solid ${regOpen ? "#16a34a40" : "#ef444430"}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                                <span style={{ fontSize: 22 }}>{regOpen ? "ðŸŸ¢" : "ðŸ”´"}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>Cho phÃ©p sinh viÃªn Ä‘Äƒng kÃ½ phÃ²ng</div>
                                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                                        {regOpen ? "Äang má»Ÿ â€” Sinh viÃªn cÃ³ thá»ƒ gá»­i Ä‘Æ¡n Ä‘Äƒng kÃ½" : "Äang táº¯t â€” Sinh viÃªn khÃ´ng thá»ƒ Ä‘Äƒng kÃ½ phÃ²ng"}
                                    </div>
                                </div>
                                <button
                                    onClick={handleToggleReg}
                                    disabled={regToggling}
                                    style={{ padding: "8px 20px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all .2s", background: regOpen ? "#ef4444" : "#16a34a", color: "#fff", opacity: regToggling ? .6 : 1 }}
                                >
                                    {regToggling ? "..." : regOpen ? "ðŸ”´ Táº¯t" : "ðŸŸ¢ Báº­t"}
                                </button>
                            </div>

                            {PRICE_CONFIG.map(cfg => (
                                <div key={cfg.key} style={{ background: cfg.color + "0a", border: `1.5px solid ${cfg.color}30`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 4 }}>{cfg.label}</div>
                                        <div style={{ fontSize: 12, color: "#888" }}>({cfg.unit})</div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <input
                                            type="number" min="0"
                                            value={prices[cfg.key] ?? ""}
                                            onChange={e => setPrices(p => ({ ...p, [cfg.key]: e.target.value }))}
                                            style={{ width: 160, padding: "9px 12px", border: `1.5px solid ${cfg.color}50`, borderRadius: 8, fontSize: 14, fontWeight: 700, color: cfg.color, textAlign: "right", outline: "none" }}
                                        />
                                        <span style={{ fontSize: 13, color: "#666" }}>{cfg.suffix || "Ä‘"}</span>
                                    </div>
                                </div>
                            ))}

                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                                <button
                                    onClick={handleSavePrices}
                                    disabled={priceSaving}
                                    style={{ padding: "10px 28px", background: "linear-gradient(135deg,#6366f1,#818cf8)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                                >
                                    {priceSaving ? <><span className="an-spinner" /> Äang lÆ°u...</> : "ðŸ’¾ LÆ°u cÃ i Ä‘áº·t"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* â”€â”€â”€ Tab: Gá»­i Bill â”€â”€â”€ */}
            {activeTab === "bill" && (
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>

                    {/* Form gá»­i bill */}
                    <div style={{ flex: "1 1 360px" }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#444", marginBottom: 16 }}>ðŸ“ Táº¡o hÃ³a Ä‘Æ¡n má»›i</h3>

                        {billAlert.msg && (
                            <div className={`an-alert ${billAlert.type}`} style={{ marginBottom: 12 }}>
                                {billAlert.type === "success" ? "âœ…" : "âš ï¸"} {billAlert.msg}
                            </div>
                        )}

                        {/* Search student */}
                        <div className="an-field">
                            <label className="an-label">ðŸŽ“ Sinh viÃªn *</label>
                            {bill.selectedStudent ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#6366f110", border: "1.5px solid #6366f140", borderRadius: 8 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                        {bill.selectedStudent.fullName[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 13 }}>{bill.selectedStudent.fullName}</div>
                                        <div style={{ fontSize: 11, color: "#888" }}>MSSV: {bill.selectedStudent.studentCode}</div>
                                    </div>
                                    <button type="button" onClick={() => setBill(p => ({ ...p, selectedStudent: null, studentSearch: "" }))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>Ã—</button>
                                </div>
                            ) : (
                                <div style={{ position: "relative" }}>
                                    <input
                                        className="an-input"
                                        placeholder="ðŸ” TÃ¬m theo tÃªn hoáº·c mÃ£ sinh viÃªn..."
                                        value={bill.studentSearch}
                                        onChange={e => setBill(p => ({ ...p, studentSearch: e.target.value }))}
                                    />
                                    {studentSearching && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#888" }}>Äang tÃ¬m...</span>}
                                    {studentResults.length > 0 && (
                                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px #0002", zIndex: 100, maxHeight: 200, overflowY: "auto" }}>
                                            {studentResults.map(s => (
                                                <div
                                                    key={s._id}
                                                    onClick={() => { setBill(p => ({ ...p, selectedStudent: s, studentSearch: "" })); setStudentResults([]); }}
                                                    style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", flexDirection: "column" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                                    onMouseLeave={e => e.currentTarget.style.background = ""}
                                                >
                                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{s.fullName}</span>
                                                    <span style={{ fontSize: 11, color: "#888" }}>MSSV: {s.studentCode} {!s.currentRoomId ? "âš ï¸ ChÆ°a cÃ³ phÃ²ng" : ""}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Loáº¡i hÃ³a Ä‘Æ¡n */}
                        <div className="an-field">
                            <label className="an-label">Loáº¡i hÃ³a Ä‘Æ¡n *</label>
                            <select className="an-select" value={bill.type} onChange={e => setBill(p => ({ ...p, type: e.target.value }))}>
                                {INV_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>

                        {/* Sá»‘ tiá»n â€” thay Ä‘á»•i theo loáº¡i hÃ³a Ä‘Æ¡n */}
                        {bill.type === "electricity" ? (
                            <div className="an-field">
                                <label className="an-label">âš¡ Sá»‘ kWh vÆ°á»£t má»©c *</label>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <input
                                        className="an-input"
                                        type="number" min="0" step="0.1"
                                        placeholder="VD: 15"
                                        value={bill.excessKwh}
                                        onChange={e => setBill(p => ({ ...p, excessKwh: e.target.value }))}
                                        style={{ flex: 1 }}
                                    />
                                    <span style={{ fontSize: 13, color: "#888", flexShrink: 0 }}>kWh</span>
                                </div>
                                {bill.excessKwh > 0 && prices.electricity_excess_rate ? (() => {
                                    const total = Number(bill.excessKwh) * Number(prices.electricity_excess_rate);
                                    const occ = bill.selectedStudent?.currentRoomId?.currentOccupancy || 1;
                                    const perPerson = Math.ceil(total / occ);
                                    return (
                                        <div style={{ marginTop: 8, padding: "10px 14px", background: "#f59e0b10", border: "1.5px solid #f59e0b30", borderRadius: 8 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: occ > 1 ? 6 : 0 }}>
                                                <span style={{ fontSize: 12, color: "#888" }}>{bill.excessKwh} kWh Ã— {fmtMoney(prices.electricity_excess_rate)}/kWh</span>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{fmtMoney(total)}</span>
                                            </div>
                                            {occ > 1 && (
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f59e0b20", paddingTop: 6 }}>
                                                    <span style={{ fontSize: 12, color: "#16a34a" }}>Ã· {occ} ngÆ°á»i trong phÃ²ng</span>
                                                    <span style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{fmtMoney(perPerson)}/ngÆ°á»i</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })() : bill.excessKwh > 0 && !prices.electricity_excess_rate ? (
                                    <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>âš ï¸ ChÆ°a cÃ i Ä‘áº·t giÃ¡ Ä‘iá»‡n â€” vui lÃ²ng cÃ i Ä‘áº·t trÆ°á»›c</p>
                                ) : null}
                            </div>
                        ) : (
                            <div className="an-field">
                                <label className="an-label">Sá»‘ tiá»n (VND) *</label>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <input
                                        className="an-input"
                                        type="number" min="0"
                                        placeholder="VD: 500000"
                                        value={bill.amount}
                                        onChange={e => setBill(p => ({ ...p, amount: e.target.value }))}
                                    />
                                    {/* Gá»£i Ã½ giÃ¡ Ä‘á»‹nh sáºµn cho vi pháº¡m */}
                                    {bill.type === "violation_fine" && prices.violation_fine_rate && (
                                        <button type="button"
                                            onClick={() => setBill(p => ({ ...p, amount: prices.violation_fine_rate }))}
                                            style={{ whiteSpace: "nowrap", fontSize: 11, padding: "5px 10px", background: "#ef444415", border: "1px solid #ef444430", borderRadius: 6, cursor: "pointer", color: "#ef4444" }}
                                        >= {fmtMoney(prices.violation_fine_rate)}</button>
                                    )}
                                </div>
                                {bill.type === "damage_compensation" && (
                                    <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>ðŸ’¡ Bá»“i thÆ°á»ng thiá»‡t háº¡i â€” nháº­p sá»‘ tiá»n cá»¥ thá»ƒ theo má»©c Ä‘á»™ thiá»‡t háº¡i thá»±c táº¿</p>
                                )}
                            </div>
                        )}

                        {/* MÃ´ táº£ */}
                        <div className="an-field">
                            <label className="an-label">MÃ´ táº£</label>
                            <textarea className="an-textarea" rows={2} placeholder="LÃ½ do / chi tiáº¿t..." value={bill.description} onChange={e => setBill(p => ({ ...p, description: e.target.value }))} />
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                            {/* Háº¡n thanh toÃ¡n */}
                            <div className="an-field" style={{ flex: 1 }}>
                                <label className="an-label">Háº¡n thanh toÃ¡n *</label>
                                <input className="an-input" type="date" value={bill.dueDate}
                                    min={new Date().toISOString().slice(0, 10)}
                                    onChange={e => setBill(p => ({ ...p, dueDate: e.target.value }))} />
                            </div>
                            {/* Ká»³ há»c */}
                            <div className="an-field" style={{ flex: 1 }}>
                                <label className="an-label">Ká»³ há»c</label>
                                <input className="an-input" placeholder="VD: 2024-1" value={bill.termCode} onChange={e => setBill(p => ({ ...p, termCode: e.target.value }))} />
                            </div>
                        </div>

                        <button
                            onClick={handleSendBill}
                            disabled={billSending}
                            style={{ width: "100%", padding: "12px", marginTop: 8, background: "linear-gradient(135deg,#e8540a,#ff7c3a)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                        >
                            {billSending ? <><span className="an-spinner" /> Äang táº¡o...</> : "ðŸ’» Táº¡o & Gá»­i hÃ³a Ä‘Æ¡n"}
                        </button>
                    </div>

                    {/* Danh sÃ¡ch sinh viÃªn cÃ²n ná»£ */}
                    <div style={{ flex: "1 1 300px" }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: "#444", marginBottom: 12 }}>âš ï¸ Sinh viÃªn cÃ²n ná»£ ({debtors.length})</h3>
                        {debtorLoading ? (
                            <div style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}><div className="ab-spinner" /></div>
                        ) : debtors.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 24, color: "#94a3b8", fontSize: 13 }}>ðŸŽ‰ KhÃ´ng cÃ³ sinh viÃªn nÃ o cÃ²n ná»£!</div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 520, overflowY: "auto" }}>
                                {debtors.map(d => (
                                    <div
                                        key={d.studentId}
                                        onClick={() => d.student && setBill(p => ({ ...p, selectedStudent: d.student, studentSearch: "", type: "violation_fine" }))}
                                        style={{ padding: "12px 14px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "border-color .15s" }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = "#e8540a50"}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                                    >
                                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
                                            {d.student?.fullName?.[0] || "?"}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.student?.fullName}</div>
                                            <div style={{ fontSize: 11, color: "#888" }}>MSSV: {d.student?.studentCode}</div>
                                        </div>
                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 800, color: "#ef4444" }}>{fmtMoney(d.totalDebt)}</div>
                                            <div style={{ fontSize: 10, color: "#94a3b8" }}>{d.invoiceCount} hÃ³a Ä‘Æ¡n</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

/* â”€â”€ Main AdminDashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const MENU = [
    { id: "overview", icon: "ðŸ›¡ï¸", label: "Tá»•ng quan" },
    { id: "users", icon: "ðŸ‘¥", label: "TÃ i khoáº£n" },
    { id: "buildings", icon: "ðŸ¢", label: "TÃ²a nhÃ  & PhÃ²ng" },
    { id: "reports", icon: "ðŸ“‘", label: "BÃ¡o cÃ¡o" },
    { id: "finance", icon: "ðŸ’°", label: "TÃ i chÃ­nh" },
    { id: "settings", icon: "âš™ï¸", label: "CÃ i Ä‘áº·t & Bill" },
    { id: "notifications", icon: "ðŸ””", label: "ThÃ´ng bÃ¡o" },
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
            {/* â”€â”€ Sidebar â”€â”€ */}
            <aside className="sd-sidebar">
                <div className="sd-sidebar-header">
                    <div className="sd-sidebar-avatar">{initials}</div>
                    <div className="sd-sidebar-name">{user.username || "Admin"}</div>
                    <div className="sd-sidebar-code" style={{ color: "#e8540a", fontWeight: 600, fontSize: 11 }}>ðŸ›¡ï¸ Quáº£n trá»‹ viÃªn</div>
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
                        <span className="sd-menu-icon">ðŸ”</span>
                        Äá»•i máº­t kháº©u
                    </button>
                </nav>
            </aside>

            {/* â”€â”€ Content â”€â”€ */}
            <main className="sd-content">
                {panels[active]}
            </main>

            {showChangePw && (
                <ChangePasswordModal onClose={() => setShowChangePw(false)} />
            )}
        </div>
    );
}
