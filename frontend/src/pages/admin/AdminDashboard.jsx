import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import "../student/StudentDashboard.css"; // reuse same CSS variables
import "./AdminDashboard.css";
import "./AdminDashboardOverview.css";
import "./AdminDashboardFinance.css";
import "./AdminDashboardTabs.css";
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

/* Users helpers */
const U_ROLE_LABELS = { admin: "Admin", manager: "Quản lý", student: "Sinh viên" };
const U_ROLE_COLORS = { admin: "#f59e0b", manager: "#6366f1", student: "#22c55e" };
const U_DEFAULT_PERMS = {
    admin: ["manage_users", "manage_students", "manage_buildings", "manage_rooms", "manage_settings", "view_revenue", "approve_reports", "assign_permissions", "send_notifications", "view_room_list", "view_unpaid_students"],
    manager: ["manage_requests", "send_reports", "send_notifications", "view_room_list", "view_unpaid_students"],
    student: ["submit_requests", "register_room", "make_payment", "view_own_history", "view_room_list"],
};
const U_PERM_LABELS = {
    manage_users: "Quản lý người dùng", manage_students: "Quản lý sinh viên",
    manage_buildings: "Quản lý tòa nhà", manage_rooms: "Quản lý phòng",
    manage_settings: "Cài đặt hệ thống", view_revenue: "Xem doanh thu",
    approve_reports: "Duyệt báo cáo", assign_permissions: "Cấp quyền",
    send_notifications: "Gửi thông báo", view_room_list: "Xem danh sách phòng",
    view_unpaid_students: "Xem SV chưa đóng tiền",
    manage_requests: "Quản lý yêu cầu", send_reports: "Gửi báo cáo",
    submit_requests: "Gửi yêu cầu", register_room: "Đăng ký phòng",
    make_payment: "Thanh toán", view_own_history: "Xem lịch sử cá nhân",
};

function UCreateModal({ onClose, onSuccess, onError }) {
    const [form, setForm] = useState({ username: "", password: "", email: "", phone: "", role: "student", fullName: "", studentCode: "", gender: "male", dateOfBirth: "", faculty: "", major: "", classCode: "", academicYear: "" });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setErr("");
        try { await api.post("/users", form); onSuccess(); }
        catch (error) { const m = error.response?.data?.message || "Tạo thất bại"; setErr(m); onError(m); }
        finally { setLoading(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box wide" onClick={e => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
                <div className="modal-header"><h2>➕ Tạo tài khoản mới</h2><button className="modal-close" onClick={onClose}>✕</button></div>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#e8540a", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>Thông tin tài khoản</p>
                    <div className="form-row"><label>Username <span className="req">*</span></label><input name="username" placeholder="Nhập username" value={form.username} onChange={hc} required /></div>
                    <div className="form-row"><label>Email <span className="req">*</span></label><input name="email" type="email" placeholder="Nhập email" value={form.email} onChange={hc} required /></div>
                    <div className="form-row"><label>Mật khẩu <span className="req">*</span></label><input name="password" type="password" placeholder="Ít nhất 6 ký tự" value={form.password} onChange={hc} required /></div>
                    <div className="form-row"><label>Số điện thoại</label><input name="phone" placeholder="Nhập SĐT (tùy chọn)" value={form.phone} onChange={hc} /></div>
                    <div className="form-row"><label>Role <span className="req">*</span></label>
                        <select name="role" value={form.role} onChange={hc}>
                            <option value="student">Sinh viên</option>
                            <option value="manager">Quản lý</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    {form.role === "student" && (
                        <>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#e8540a", textTransform: "uppercase", letterSpacing: "0.5px", margin: "8px 0 0" }}>Thông tin sinh viên</p>
                            <div className="form-row"><label>Họ và tên <span className="req">*</span></label><input name="fullName" placeholder="Nguyễn Văn A" value={form.fullName} onChange={hc} required /></div>
                            <div className="form-row"><label>Mã sinh viên</label><input name="studentCode" placeholder="VD: SE180001" value={form.studentCode} onChange={hc} /></div>
                            <div className="form-row"><label>Giới tính</label><select name="gender" value={form.gender} onChange={hc}><option value="male">Nam</option><option value="female">Nữ</option></select></div>
                            <div className="form-row"><label>Ngày sinh</label><input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={hc} /></div>
                            <div className="form-row"><label>Khoa</label><input name="faculty" placeholder="VD: Công nghệ thông tin" value={form.faculty} onChange={hc} /></div>
                            <div className="form-row"><label>Chuyên ngành</label><input name="major" placeholder="VD: Kỹ thuật phần mềm" value={form.major} onChange={hc} /></div>
                            <div className="form-row"><label>Lớp</label><input name="classCode" placeholder="VD: SE1801" value={form.classCode} onChange={hc} /></div>
                            <div className="form-row"><label>Năm học</label><input name="academicYear" placeholder="VD: 2024" value={form.academicYear} onChange={hc} /></div>
                        </>
                    )}
                    {err && <div className="modal-err">⚠️ {err}</div>}
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
                        <button type="submit" className="btn-submit" disabled={loading}>{loading ? "Đang tạo..." : "Tạo tài khoản"}</button>
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
        catch (err) { onError(err.response?.data?.message || "Cập nhật thất bại"); }
        finally { setLoading(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2>🔑 Phân quyền — {user.username}</h2><button className="modal-close" onClick={onClose}>✕</button></div>
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
                    <button className="btn-cancel" onClick={onClose}>Hủy</button>
                    <button className="btn-submit" onClick={handleSave} disabled={loading}>{loading ? "Đang lưu..." : `Lưu quyền (${sel.size})`}</button>
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
        } catch { showAlert("error", "Không thể tải danh sách người dùng"); }
        finally { setLoading(false); }
    }, [roleFilter, search]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const handleDelete = async (u) => {
        if (!window.confirm(`Xóa tài khoản "${u.username}"? Không thể hoàn tác.`)) return;
        try { await api.delete(`/users/${u._id}`); showAlert("success", "Đã xóa tài khoản"); loadUsers(); }
        catch (err) { showAlert("error", err.response?.data?.message || "Xóa thất bại"); }
    };

    const handleToggle = async (u) => {
        try { await api.put(`/users/${u._id}`, { isActive: !u.isActive }); showAlert("success", u.isActive ? "Đã vô hiệu hóa" : "Đã kích hoạt"); loadUsers(); }
        catch (err) { showAlert("error", err.response?.data?.message || "Cập nhật thất bại"); }
    };

    const activeUsers = users.filter((u) => u.isActive).length;
    const managerCount = users.filter((u) => u.role === "manager").length;
    const studentCount = users.filter((u) => u.role === "student").length;
    const adminCount = users.filter((u) => u.role === "admin").length;
    const lockedCount = Math.max(users.length - activeUsers, 0);
    const scopeLabel = roleFilter ? (U_ROLE_LABELS[roleFilter] || roleFilter) : "Tất cả vai trò";
    const searchLabel = search.trim() ? `Từ khóa: "${search.trim()}"` : "Không dùng bộ lọc tìm kiếm";

    return (
        <div className="ad-panel-stack">
            <section className="ad-section-hero ad-section-hero-users">
                <div className="ad-section-copy">
                    <span className="ad-section-eyebrow">User Operations</span>
                    <h2 className="ad-section-title">👥 Quản lý tài khoản</h2>
                    <p className="ad-section-subtitle">
                        Tạo, kích hoạt, khóa và phân quyền người dùng theo cùng một quy chuẩn hiển thị rõ ràng cho admin.
                    </p>
                    <div className="ad-section-pills">
                        <span className="ad-section-pill neutral">Phạm vi: {scopeLabel}</span>
                        <span className="ad-section-pill neutral">{searchLabel}</span>
                        <span className={`ad-section-pill ${lockedCount > 0 ? "danger" : "success"}`}>
                            {lockedCount > 0 ? `${lockedCount} tài khoản đang bị khóa` : "Không có tài khoản bị khóa"}
                        </span>
                    </div>
                </div>
                <div className="ad-section-actions">
                    <button type="button" className="ad-hero-btn primary" onClick={() => setModal("create")}>+ Tạo tài khoản</button>
                </div>
            </section>

            {alert.msg && (
                <div className={`au-alert ${alert.type}`} style={{ marginBottom: 16 }}>
                    {alert.type === "success" ? "✓" : "⚠️"} {alert.msg}
                </div>
            )}

            <div className="ad-stats-grid">
                <StatCard
                    icon="🧭"
                    label="Đang hiển thị"
                    value={users.length}
                    meta={`Bộ lọc hiện tại: ${scopeLabel}`}
                    color="#e8540a"
                    loading={loading}
                />
                <StatCard
                    icon="✅"
                    label="Đang hoạt động"
                    value={activeUsers}
                    meta={`${lockedCount} tài khoản đang bị khóa`}
                    color="#16a34a"
                    loading={loading}
                />
                <StatCard
                    icon="👔"
                    label="Quản lý"
                    value={managerCount}
                    meta={`${adminCount} admin trong danh sách`}
                    color="#6366f1"
                    loading={loading}
                />
                <StatCard
                    icon="🎓"
                    label="Sinh viên"
                    value={studentCount}
                    meta="Nhóm người dùng đông nhất hệ thống"
                    color="#2563eb"
                    loading={loading}
                />
            </div>

            <div className="ad-toolbar-shell">
                <div className="ad-toolbar-copy">
                    <h3 className="ad-toolbar-title">Lọc nhanh và tìm kiếm</h3>
                    <p className="ad-toolbar-text">
                        Thu hẹp đúng nhóm người dùng trước khi cấp quyền, khóa tài khoản hoặc kiểm tra trạng thái.
                    </p>
                </div>
                <div className="ad-toolbar-controls ad-toolbar-controls-wide">
                    <input className="au-search ad-input-enhanced" placeholder="🔍 Tìm theo username hoặc email..." value={search} onChange={e => setSearch(e.target.value)} />
                    <select className="au-role-filter ad-select-enhanced" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                        <option value="">Tất cả role</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Quản lý</option>
                        <option value="student">Sinh viên</option>
                    </select>
                </div>
            </div>

            <div className="ad-context-line">
                <p className="ad-context-text">Hiện đang hiển thị {users.length} tài khoản theo bộ lọc hiện tại.</p>
                <p className="ad-context-text">Mẹo nhỏ: kiểm tra quyền trước khi khóa tài khoản để tránh ảnh hưởng phần việc của nhóm.</p>
            </div>

            <div className="au-table-wrap ad-surface-card">
                {loading ? (
                    <div className="au-loading">Đang tải...</div>
                ) : users.length === 0 ? (
                    <div className="au-empty">Không tìm thấy tài khoản nào</div>
                ) : (
                    <table className="au-table">
                        <thead>
                            <tr>
                                <th>Người dùng</th><th>Role</th><th>Trạng thái</th><th>Phân quyền</th><th>Hành động</th>
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
                                            {u.isActive ? "✅ Hoạt động" : "⛔ Bị khóa"}
                                        </button>
                                    </td>
                                    <td>
                                        <span className="perm-count">{u.permissions?.length || 0} quyền</span>
                                        <button className="btn-perm" onClick={() => { setSelected(u); setModal("perm"); }}>Chỉnh sửa</button>
                                    </td>
                                    <td><button className="btn-del" onClick={() => handleDelete(u)}>🗑️ Xóa</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modal === "create" && (
                <UCreateModal
                    onClose={() => setModal(null)}
                    onSuccess={() => { setModal(null); loadUsers(); showAlert("success", "Tạo tài khoản thành công"); }}
                    onError={msg => showAlert("error", msg)}
                />
            )}
            {modal === "perm" && selected && (
                <UPermModal
                    user={selected}
                    onClose={() => { setModal(null); setSelected(null); }}
                    onSuccess={() => { setModal(null); setSelected(null); loadUsers(); showAlert("success", "Cập nhật quyền thành công"); }}
                    onError={msg => showAlert("error", msg)}
                />
            )}
        </div>
    );
}
const B_fmtNum = (n) => Number(n || 0).toLocaleString("vi-VN");
const B_ROOM_STATUS = { available: "Còn chỗ", partial: "Còn ít chỗ", full: "Hết chỗ", maintenance: "Bảo trì" };
const B_TYPE_LABEL = { standard: "Tiêu chuẩn", vip: "VIP", premium: "Premium" };
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
        catch { showAlert("error", "Không thể tải danh sách phòng"); }
        finally { setLoadingR(false); }
    }, [building._id, loaded, showAlert]);

    const refreshRooms = async () => {
        setLoaded(false);
        const r = await api.get(`/buildings/${building._id}/rooms`);
        setRooms(r.data.data); setLoaded(true);
    };

    const handleDeleteRoom = async (room) => {
        if (!window.confirm(`Xóa phòng ${room.roomNumber}?`)) return;
        try { await api.delete(`/rooms/${room._id}`); showAlert("success", `Đã xóa phòng ${room.roomNumber}`); refreshRooms(); }
        catch (err) { showAlert("error", err.response?.data?.message || "Xóa phòng thất bại"); }
    };

    const handleToggle = () => { const next = !open; setOpen(next); if (next) loadRooms(); };

    return (
        <div className={`ab-building-card ${open ? "expanded" : ""}`}>
            <div className="ab-building-header" onClick={handleToggle}>
                <div className="ab-building-icon">🏢</div>
                <div className="ab-building-info">
                    <div className="ab-building-name">{building.name}</div>
                    <div className="ab-building-meta">
                        📍 {building.address || "—"} &nbsp;·&nbsp; 🏬 {building.totalFloors} tầng &nbsp;·&nbsp; 👤 {building.managerId?.username || "Chưa có quản lý"}
                    </div>
                </div>
                <div className="ab-building-right">
                    <span className={`ab-status-badge ${building.status}`}>
                        {building.status === "active" ? "Hoạt động" : building.status === "maintenance" ? "Bảo trì" : "Tạm đóng"}
                    </span>
                    <button className="ab-btn-edit" onClick={e => { e.stopPropagation(); onEdit(building); }}>✏️ Sửa</button>
                    <button className="ab-btn-del" onClick={e => { e.stopPropagation(); onDelete(building); }}>🗑️</button>
                    <span className={`ab-chevron ${open ? "open" : ""}`}>⏷</span>
                </div>
            </div>
            {open && (
                <div className="ab-rooms-section">
                    <div className="ab-rooms-header">
                        <span className="ab-rooms-title">Danh sách phòng {loaded ? `(${rooms.length})` : ""}</span>
                        <button className="ab-btn-add-room" onClick={() => onAddRoom(building, refreshRooms)}>＋ Thêm phòng</button>
                    </div>
                    {loadingR ? (
                        <div className="ab-rooms-loading"><span className="ab-spinner" />Đang tải phòng...</div>
                    ) : rooms.length === 0 ? (
                        <div className="ab-rooms-empty">Chưa có phòng nào. Nhấn “Thêm phòng” để bắt đầu.</div>
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
                                        <div className="ab-room-info">Tầng {room.floor} · {B_TYPE_LABEL[room.type] || room.type}</div>
                                        <div className="ab-room-occupancy">
                                            <div className="ab-room-occ-bar" style={{ width: `${pct}%`, background: B_occColor(pct) }} />
                                        </div>
                                        <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>{room.currentOccupancy}/{room.maxOccupancy} người</div>
                                        <div className="ab-room-price">{B_fmtNum(room.pricePerTerm)}đ/kỳ</div>
                                        <div className="ab-room-actions">
                                            <button className="ab-btn-room-del" onClick={() => handleDeleteRoom(room)}>🗑️ Xóa</button>
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
        if (!form.name || !form.totalFloors) { setErr("Vui lòng nhập tên tòa nhà và số tầng"); return; }
        setLoading(true); setErr("");
        try {
            const payload = { ...form, managerId: form.managerId || null };
            if (isEdit) await api.put(`/buildings/${building._id}`, payload);
            else await api.post("/buildings", payload);
            onSuccess();
        } catch (e) { setErr(e.response?.data?.message || "Thao tác thất bại"); }
        setLoading(false);
    };

    const selectedMgr = managers.find(m => m._id === form.managerId);

    return (
        <div className="ab-overlay" onClick={onClose}>
            <div className="ab-modal" onClick={e => e.stopPropagation()}>
                <div className="ab-modal-title">{isEdit ? "✏️ Cập nhật tòa nhà" : "🏢 Tạo tòa nhà mới"}</div>
                <div className="ab-modal-grid">
                    <div className="ab-field"><label className="ab-label">Tên tòa nhà *</label><input className="ab-input" name="name" placeholder="VD: Tòa A1" value={form.name} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">Số tầng *</label><input className="ab-input" name="totalFloors" type="number" min="1" placeholder="VD: 6" value={form.totalFloors} onChange={hc} /></div>
                    <div className="ab-field full"><label className="ab-label">Địa chỉ</label><input className="ab-input" name="address" placeholder="Địa chỉ tòa nhà" value={form.address} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">Trạng thái</label>
                        <select className="ab-select" name="status" value={form.status} onChange={hc}>
                            <option value="active">Hoạt động</option>
                            <option value="maintenance">Bảo trì</option>
                            <option value="inactive">Tạm đóng</option>
                        </select>
                    </div>
                    <div className="ab-field">
                        <label className="ab-label">👤 Quản lý phụ trách</label>
                        {loadingMgr ? (
                            <div style={{ fontSize: 13, color: "#94a3b8", padding: "8px 0" }}>Đang tải danh sách quản lý...</div>
                        ) : (
                            <select className="ab-select" name="managerId" value={form.managerId} onChange={hc}>
                                <option value="">— Chưa phân công —</option>
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
                                <span>Đã chọn: <strong>{selectedMgr.username}</strong> — {selectedMgr.email}</span>
                                <button type="button" onClick={() => setForm(p => ({ ...p, managerId: "" }))}
                                    style={{ marginLeft: "auto", background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>
                                    ✕ Bỏ phân công
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="ab-field full"><label className="ab-label">Mô tả</label><textarea className="ab-textarea" name="description" placeholder="Mô tả thêm..." value={form.description} onChange={hc} /></div>
                </div>
                {err && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 10 }}>⚠️ {err}</div>}
                <div className="ab-modal-actions">
                    <button className="ab-btn-cancel" onClick={onClose}>Hủy</button>
                    <button className="ab-btn-confirm" onClick={handleSubmit} disabled={loading}>{loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo tòa nhà"}</button>
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
        if (!form.roomNumber || !form.floor || !form.pricePerTerm) { setErr("Vui lòng nhập đầy đủ số phòng, tầng và giá mỗi kỳ"); return; }
        setLoading(true); setErr("");
        try { await api.post(`/buildings/${building._id}/rooms`, form); onSuccess(); }
        catch (e) { setErr(e.response?.data?.message || "Tạo phòng thất bại"); }
        setLoading(false);
    };
    return (
        <div className="ab-overlay" onClick={onClose}>
            <div className="ab-modal" onClick={e => e.stopPropagation()}>
                <div className="ab-modal-title">🛏 Thêm phòng — {building.name}</div>
                <div className="ab-modal-grid">
                    <div className="ab-field"><label className="ab-label">Số phòng *</label><input className="ab-input" name="roomNumber" placeholder="VD: 101" value={form.roomNumber} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">Tầng *</label><input className="ab-input" name="floor" type="number" min="1" placeholder="VD: 1" value={form.floor} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">Loại phòng</label>
                        <select className="ab-select" name="type" value={form.type} onChange={hc}>
                            <option value="standard">Tiêu chuẩn</option>
                            <option value="vip">VIP</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>
                    <div className="ab-field"><label className="ab-label">Sức chứa tối đa</label><input className="ab-input" name="maxOccupancy" type="number" min="1" value={form.maxOccupancy} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">Giá / kỳ (đồng) *</label><input className="ab-input" name="pricePerTerm" type="number" min="0" placeholder="VD: 1500000" value={form.pricePerTerm} onChange={hc} /></div>
                    <div className="ab-field"><label className="ab-label">Trạng thái</label>
                        <select className="ab-select" name="status" value={form.status} onChange={hc}>
                            <option value="available">Còn chỗ</option>
                            <option value="maintenance">Bảo trì</option>
                        </select>
                    </div>
                    <div className="ab-field full"><label className="ab-label">Mô tả / tiện nghi</label><textarea className="ab-textarea" name="description" placeholder="VD: Phòng có điều hòa, tủ đồ..." value={form.description} onChange={hc} /></div>
                </div>
                {err && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 10 }}>⚠️ {err}</div>}
                <div className="ab-modal-actions">
                    <button className="ab-btn-cancel" onClick={onClose}>Hủy</button>
                    <button className="ab-btn-confirm" onClick={handleSubmit} disabled={loading}>{loading ? "Đang tạo..." : "Tạo phòng"}</button>
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
            .catch(() => showAlert("error", "Không thể tải danh sách tòa nhà"))
            .finally(() => setLoading(false));
    }, [showAlert]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (building) => {
        if (!window.confirm(`Xóa tòa nhà "${building.name}"?`)) return;
        try { await api.delete(`/buildings/${building._id}`); showAlert("success", `Đã xóa tòa nhà ${building.name}`); load(); }
        catch (err) { showAlert("error", err.response?.data?.message || "Xóa thất bại"); }
    };

    const activeBuildings = buildings.filter((b) => b.status === "active").length;
    const maintenanceBuildings = buildings.filter((b) => b.status === "maintenance").length;
    const inactiveBuildings = buildings.filter((b) => b.status === "inactive").length;
    const assignedManagers = buildings.filter((b) => !!b.managerId).length;
    const totalFloors = buildings.reduce((sum, b) => sum + Number(b.totalFloors || 0), 0);

    return (
        <div className="ad-panel-stack">
            <section className="ad-section-hero ad-section-hero-buildings">
                <div className="ad-section-copy">
                    <span className="ad-section-eyebrow">Dormitory Assets</span>
                    <h2 className="ad-section-title">🏢 Quản lý tòa nhà & phòng</h2>
                    <p className="ad-section-subtitle">
                        Theo dõi hạ tầng KTX theo cùng một nhịp thiết kế với dashboard admin: rõ số liệu, rõ trạng thái và dễ thao tác khi cần cập nhật.
                    </p>
                    <div className="ad-section-pills">
                        <span className="ad-section-pill neutral">Tổng tòa nhà: {buildings.length}</span>
                        <span className="ad-section-pill neutral">Quản lý đã phân công: {assignedManagers}/{buildings.length || 0}</span>
                        <span className={`ad-section-pill ${maintenanceBuildings > 0 ? "danger" : "success"}`}>
                            {maintenanceBuildings > 0 ? `${maintenanceBuildings} tòa đang bảo trì` : "Không có tòa nào cần bảo trì"}
                        </span>
                    </div>
                </div>
                <div className="ad-section-actions">
                    <button className="ad-hero-btn primary" onClick={() => setModal({ type: "building" })}>＋ Tạo tòa nhà</button>
                </div>
            </section>

            {alert && <div className={`ab-alert ${alert.type}`} style={{ marginBottom: 0 }}>{alert.type === "success" ? "✓" : "⚠️"} {alert.msg}</div>}

            <div className="ad-stats-grid">
                <StatCard icon="🏢" label="Tòa nhà" value={buildings.length} meta={`${totalFloors} tầng trên toàn hệ thống`} color="#e8540a" loading={loading} />
                <StatCard icon="🟢" label="Đang hoạt động" value={activeBuildings} meta={`${assignedManagers} tòa đã có quản lý phụ trách`} color="#16a34a" loading={loading} />
                <StatCard icon="🛠️" label="Bảo trì" value={maintenanceBuildings} meta="Những khu vực cần theo dõi kỹ hơn" color="#d97706" loading={loading} />
                <StatCard icon="⏸️" label="Tạm đóng" value={inactiveBuildings} meta="Khu vực chưa mở cho vận hành" color="#64748b" loading={loading} />
            </div>

            <div className="ad-context-line">
                <p className="ad-context-text">Nhấn vào từng tòa nhà để xem danh sách phòng và thao tác ở cùng một nơi.</p>
                <p className="ad-context-text">Mẹo nhanh: nên phân công quản lý trước khi mở tòa để tránh thiếu đầu mối vận hành.</p>
            </div>

            {loading ? (
                <div className="ad-surface-panel">
                    <div className="ad-empty-inline"><span className="ab-spinner" />Đang tải danh sách tòa nhà...</div>
                </div>
            ) : buildings.length === 0 ? (
                <div className="ad-surface-panel">
                    <div className="ab-empty-page"><span className="ab-empty-icon">🏗️</span><p>Chưa có tòa nhà nào. Nhấn “Tạo tòa nhà” để bắt đầu thiết lập KTX.</p></div>
                </div>
            ) : (
                <div className="ad-surface-panel">
                    <div className="ad-surface-head">
                        <div>
                            <h3 className="ad-surface-title">Danh mục tòa nhà</h3>
                            <p className="ad-surface-text">Mở từng thẻ để kiểm tra phòng, thêm phòng mới hoặc cập nhật trạng thái vận hành.</p>
                        </div>
                    </div>
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
                </div>
            )}

            {modal?.type === "building" && (
                <BBuildingModal building={null} onClose={() => setModal(null)} onSuccess={() => { setModal(null); showAlert("success", "Tạo tòa nhà thành công!"); load(); }} />
            )}
            {modal?.type === "building-edit" && (
                <BBuildingModal building={modal.data} onClose={() => setModal(null)} onSuccess={() => { setModal(null); showAlert("success", "Cập nhật tòa nhà thành công!"); load(); }} />
            )}
            {modal?.type === "room" && (
                <BRoomModal
                    building={modal.data}
                    onClose={() => setModal(null)}
                    onSuccess={() => { setModal(null); showAlert("success", "Tạo phòng thành công!"); if (modal.onRoomSuccess) modal.onRoomSuccess(); }}
                />
            )}
        </div>
    );
}
const R_TYPE_LABELS = { general: "📋 Tổng quát", maintenance: "🔧 Bảo trì", incident: "⚠️ Sự cố", monthly: "📆 Hàng tháng" };
const R_TYPE_COLORS = { general: "#6366f1", maintenance: "#f59e0b", incident: "#ef4444", monthly: "#22c55e" };

function RReviewModal({ report, onClose, onSuccess, onError }) {
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const handleSubmit = async e => {
        e.preventDefault(); setLoading(true);
        try { await api.put(`/reports/${report._id}/review`, { note }); onSuccess(); }
        catch (err) { onError(err.response?.data?.message || "Duyệt thất bại"); }
        finally { setLoading(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h2>✅ Duyệt báo cáo</h2><button className="modal-close" onClick={onClose}>✕</button></div>
                <div className="review-preview">
                    <div className="rp-row"><span className="rp-label">Tiêu đề</span><span className="rp-val">{report.title}</span></div>
                    <div className="rp-row"><span className="rp-label">Người gửi</span><span className="rp-val">{report.managerId?.username} · {report.buildingId?.name}</span></div>
                    <div className="rp-row"><span className="rp-label">Nội dung</span><span className="rp-val content-preview">{report.content}</span></div>
                </div>
                <form onSubmit={handleSubmit} className="review-form">
                    <div className="form-row"><label>Ghi chú phản hồi (tùy chọn)</label>
                        <textarea rows={4} placeholder="Nhập phản hồi gửi lại cho quản lý..." value={note} onChange={e => setNote(e.target.value)} />
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
                        <button type="submit" className="btn-approve-modal" disabled={loading}>{loading ? "Đang duyệt..." : "✅ Xác nhận duyệt"}</button>
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
                <div className="modal-header"><h2>📄 Chi tiết báo cáo</h2><button className="modal-close" onClick={onClose}>✕</button></div>
                <div className="detail-grid">
                    <div className="detail-item"><span className="d-label">Loại</span><span className="d-val"><span style={{ background: col + "20", color: col, padding: "3px 10px", borderRadius: 20, fontSize: 13 }}>{R_TYPE_LABELS[report.type]}</span></span></div>
                    <div className="detail-item"><span className="d-label">Trạng thái</span><span className={`d-badge ${isPending ? "pending" : "reviewed"}`}>{isPending ? "⏳ Chờ duyệt" : "✅ Đã duyệt"}</span></div>
                    <div className="detail-item"><span className="d-label">Người gửi</span><span className="d-val">{report.managerId?.username}</span></div>
                    <div className="detail-item"><span className="d-label">Tòa nhà</span><span className="d-val">{report.buildingId?.name} — {report.buildingId?.address}</span></div>
                    <div className="detail-item"><span className="d-label">Ngày gửi</span><span className="d-val">{new Date(report.createdAt).toLocaleString("vi-VN")}</span></div>
                </div>
                <div className="detail-content-box"><span className="d-label">Nội dung báo cáo</span><p>{report.content}</p></div>
                {report.adminReview?.note && (
                    <div className="detail-admin-note">
                        <span className="d-label">💬 Phản hồi từ Admin</span>
                        <p>{report.adminReview.note}</p>
                        <span className="note-meta">— {report.adminReview.reviewedBy?.username} | {new Date(report.adminReview.reviewedAt).toLocaleString("vi-VN")}</span>
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
const AN_TYPE_OPTIONS = [
    { value: "general", label: "📢 Thông báo chung" },
    { value: "payment_reminder", label: "💳 Nhắc thanh toán" },
    { value: "maintenance", label: "🔧 Bảo trì" },
    { value: "announcement", label: "📣 Quan trọng" },
];

const AN_TYPE_ICONS = { general: "📢", payment_reminder: "💳", maintenance: "🔧", announcement: "📣" };

function formatDate(d) {
    return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const AN_INIT_FORM = { title: "", message: "", type: "general", receiverType: "role", targetRole: "student", receiverIds: [] };

/* Finance Panel */
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

function NotificationsPanel() {
    const [form, setForm] = useState(AN_INIT_FORM);
    const [sending, setSending] = useState(false);
    const [alert, setAlert] = useState({ type: "", msg: "" });
    const [sentList, setSentList] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [activeTab, setActiveTab] = useState("send");
    const [searchRole, setSearchRole] = useState("student");
    const [userSearch, setUserSearch] = useState("");
    const [userResults, setUserResults] = useState([]);
    const [userSearching, setUserSearching] = useState(false);
    const [receiverIds, setReceiverIds] = useState([]);

    const showAlert = (type, msg) => {
        setAlert({ type, msg });
        setTimeout(() => setAlert({ type: "", msg: "" }), 4000);
    };

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
        } catch { } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => { loadSentList(); }, [loadSentList]);

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSend = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.message.trim()) {
            showAlert("error", "Vui lòng điền đầy đủ tiêu đề và nội dung");
            return;
        }
        if (form.receiverType === "individual" && receiverIds.length === 0) {
            showAlert("error", "Vui lòng chọn ít nhất một người nhận");
            return;
        }
        setSending(true);
        try {
            const payload = { ...form, receiverIds: receiverIds.map(u => u._id) };
            const { data } = await api.post("/notifications/send", payload);
            showAlert("success", data.message || "Gửi thông báo thành công!");
            setForm(AN_INIT_FORM);
            setReceiverIds([]);
            setUserSearch("");
            setUserResults([]);
            loadSentList();
            setActiveTab("history");
        } catch (err) {
            showAlert("error", err.response?.data?.message || "Gửi thất bại");
        } finally {
            setSending(false);
        }
    };

    const totalRecipientsSent = sentList.reduce((sum, item) => sum + (item.receiverIds?.length || 0), 0);
    const totalRead = sentList.reduce((sum, item) => sum + (item.readBy?.length || 0), 0);
    const importantCount = sentList.filter((item) => item.type === "announcement").length;
    const audienceLabel = form.receiverType === "role"
        ? (form.targetRole === "all" ? "Tất cả người dùng" : form.targetRole === "student" ? "Tất cả sinh viên" : "Tất cả quản lý")
        : receiverIds.length > 0 ? `${receiverIds.length} người đã chọn` : "Chưa chọn người nhận";
    const latestSent = sentList.slice(0, 4);

    return (
        <div className="ad-panel-stack">
            <section className="ad-section-hero ad-section-hero-notifications">
                <div className="ad-section-copy">
                    <span className="ad-section-eyebrow">Communication Center</span>
                    <h2 className="ad-section-title">🔔 Gửi thông báo</h2>
                    <p className="ad-section-subtitle">
                        Tập trung soạn, phát hành và theo dõi lịch sử gửi thông báo trong cùng một màn hình quản trị rõ ràng, nhất quán và dễ kiểm soát.
                    </p>
                    <div className="ad-section-pills">
                        <span className="ad-section-pill neutral">Tab hiện tại: {activeTab === "send" ? "Soạn thông báo" : "Lịch sử gửi"}</span>
                        <span className="ad-section-pill neutral">Đối tượng hiện tại: {audienceLabel}</span>
                        <span className={`ad-section-pill ${importantCount > 0 ? "danger" : "success"}`}>
                            {importantCount > 0 ? `${importantCount} thông báo quan trọng đã gửi` : "Chưa có thông báo quan trọng"}
                        </span>
                    </div>
                </div>
                <div className="ad-section-actions">
                    <button type="button" className={`ad-hero-btn ${activeTab === "send" ? "primary" : ""}`} onClick={() => setActiveTab("send")}>Soạn mới</button>
                    <button type="button" className={`ad-hero-btn ${activeTab === "history" ? "primary" : ""}`} onClick={() => setActiveTab("history")}>Lịch sử gửi</button>
                    <button type="button" className="ad-hero-btn" onClick={loadSentList}>Làm mới lịch sử</button>
                </div>
            </section>

            {alert.msg && (
                <div className={`an-alert ${alert.type}`} style={{ marginBottom: 0 }}>
                    {alert.type === "success" ? "✓" : "⚠️"} {alert.msg}
                </div>
            )}

            <div className="ad-stats-grid">
                <StatCard icon="🗂️" label="Lịch sử gửi" value={sentList.length} meta="30 thông báo gần nhất" color="#e8540a" loading={loadingList && sentList.length === 0} />
                <StatCard icon="👥" label="Người nhận" value={totalRecipientsSent} meta="Tổng số người đã nhận" color="#2563eb" loading={loadingList && sentList.length === 0} />
                <StatCard icon="✅" label="Đã đọc" value={totalRead} meta="Lượt đọc ghi nhận được" color="#16a34a" loading={loadingList && sentList.length === 0} />
                <StatCard icon="📣" label="Quan trọng" value={importantCount} meta="Thông báo cần chú ý cao" color="#d97706" loading={loadingList && sentList.length === 0} />
            </div>

            <div className="ad-toolbar-shell">
                <div className="ad-toolbar-copy">
                    <h3 className="ad-toolbar-title">Chuyển luồng làm việc</h3>
                    <p className="ad-toolbar-text">Đi từ soạn nội dung sang lịch sử gửi mà không rời khỏi ngữ cảnh quản trị thông báo.</p>
                </div>
                <div className="ad-toolbar-controls">
                    <div className="an-tabs" style={{ marginBottom: 0 }}>
                        <button className={`an-tab ${activeTab === "send" ? "active" : ""}`} onClick={() => setActiveTab("send")}>✉️ Soạn thông báo</button>
                        <button className={`an-tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>📋 Lịch sử gửi {sentList.length > 0 && <span className="an-tab-count">{sentList.length}</span>}</button>
                    </div>
                </div>
            </div>

            {activeTab === "send" && (
                <div className="ad-split-layout">
                    <section className="ad-surface-panel">
                        <div className="ad-surface-head">
                            <div>
                                <h3 className="ad-surface-title">Soạn thông báo mới</h3>
                                <p className="ad-surface-text">Chọn loại thông báo, đối tượng nhận và xem trước trước khi phát hành.</p>
                            </div>
                        </div>
                        <div className="an-send-panel ad-neutral-width">
                            <form className="an-form ad-flat-form" onSubmit={handleSend}>
                                <div className="an-field">
                                    <label className="an-label">Loại thông báo</label>
                                    <div className="an-type-grid">
                                        {AN_TYPE_OPTIONS.map((t) => (
                                            <label key={t.value} className={`an-type-card ${form.type === t.value ? "selected" : ""}`}>
                                                <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={handleChange} />
                                                {t.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="an-field">
                                    <label className="an-label">Gửi đến</label>
                                    <div className="an-receiver-row">
                                        <select name="receiverType" value={form.receiverType} onChange={e => {
                                            handleChange(e);
                                            setReceiverIds([]);
                                            setUserSearch("");
                                            setUserResults([]);
                                        }} className="an-select">
                                            <option value="role">Theo nhóm người dùng</option>
                                            <option value="individual">Cá nhân</option>
                                        </select>
                                        {form.receiverType === "role" && (
                                            <select name="targetRole" value={form.targetRole} onChange={handleChange} className="an-select">
                                                <option value="student">🎓 Tất cả sinh viên</option>
                                                <option value="manager">📋 Tất cả quản lý</option>
                                                <option value="all">👥 Tất cả người dùng</option>
                                            </select>
                                        )}
                                    </div>

                                    {form.receiverType === "individual" && (
                                        <div style={{ marginTop: 10 }}>
                                            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                                <select className="an-select" value={searchRole} onChange={e => { setSearchRole(e.target.value); setUserSearch(""); setUserResults([]); }}>
                                                    <option value="student">🎓 Sinh viên</option>
                                                    <option value="manager">🏢 Quản lý</option>
                                                    <option value="admin">🛡️ Admin</option>
                                                </select>
                                            </div>

                                            <div style={{ position: "relative" }}>
                                                <input
                                                    className="an-input"
                                                    placeholder="🔍 Tìm username hoặc email..."
                                                    value={userSearch}
                                                    onChange={e => setUserSearch(e.target.value)}
                                                />
                                                {userSearching && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#888" }}>Đang tìm...</span>}
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
                                                                {receiverIds.find(r => r._id === u._id) && <span style={{ marginLeft: "auto", color: "#22c55e", fontSize: 16 }}>✓</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {receiverIds.length > 0 && (
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                                                    {receiverIds.map(u => (
                                                        <span key={u._id} style={{ display: "flex", alignItems: "center", gap: 5, background: "#6366f115", border: "1px solid #6366f130", borderRadius: 20, padding: "4px 10px", fontSize: 12, color: "#6366f1" }}>
                                                            👤 {u.username}
                                                            <button type="button" onClick={() => setReceiverIds(prev => prev.filter(r => r._id !== u._id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {receiverIds.length === 0 && <p style={{ fontSize: 12, color: "#e8540a", marginTop: 6 }}>⚠️ Chưa chọn người nhận nào</p>}
                                        </div>
                                    )}

                                    <p className="an-receiver-hint">📤 Sẽ gửi tới: <strong>{audienceLabel}</strong></p>
                                </div>

                                <div className="an-field">
                                    <label className="an-label">Tiêu đề <span className="req">*</span></label>
                                    <input className="an-input" name="title" value={form.title} onChange={handleChange} placeholder="Nhập tiêu đề thông báo..." maxLength={120} required />
                                    <span className="an-char-count">{form.title.length}/120</span>
                                </div>

                                <div className="an-field">
                                    <label className="an-label">Nội dung <span className="req">*</span></label>
                                    <textarea className="an-textarea" name="message" value={form.message} onChange={handleChange} placeholder="Nhập nội dung thông báo chi tiết..." rows={4} maxLength={1000} required />
                                    <span className="an-char-count">{form.message.length}/1000</span>
                                </div>

                                {(form.title || form.message) && (
                                    <div className="an-preview">
                                        <p className="an-preview-label">👁️ Xem trước</p>
                                        <div className="an-preview-card">
                                            <div className="an-preview-icon">{AN_TYPE_ICONS[form.type]}</div>
                                            <div>
                                                <div className="an-preview-title">{form.title || "Tiêu đề..."}</div>
                                                <div className="an-preview-msg">{form.message || "Nội dung..."}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="an-form-actions">
                                    <button type="button" className="an-btn-reset" onClick={() => { setForm(AN_INIT_FORM); setReceiverIds([]); setUserSearch(""); setUserResults([]); }}>🔄 Đặt lại</button>
                                    <button type="submit" className="an-btn-send" disabled={sending}>
                                        {sending ? <><span className="an-spinner" /> Đang gửi...</> : "📤 Gửi thông báo"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>

                    <aside className="ad-surface-panel">
                        <div className="ad-surface-head">
                            <div>
                                <h3 className="ad-surface-title">Tóm tắt phiên gửi</h3>
                                <p className="ad-surface-text">Kiểm tra nhanh đối tượng nhận và nhịp gửi gần đây trước khi phát hành.</p>
                            </div>
                        </div>
                        <div className="ad-kv-list">
                            <div className="ad-kv-row"><span className="ad-kv-label">Loại thông báo</span><strong className="ad-kv-value">{AN_TYPE_OPTIONS.find(item => item.value === form.type)?.label || form.type}</strong></div>
                            <div className="ad-kv-row"><span className="ad-kv-label">Đối tượng</span><strong className="ad-kv-value">{audienceLabel}</strong></div>
                            <div className="ad-kv-row"><span className="ad-kv-label">Độ dài nội dung</span><strong className="ad-kv-value">{form.message.length} ký tự</strong></div>
                            <div className="ad-kv-row"><span className="ad-kv-label">Tổng lịch sử</span><strong className="ad-kv-value">{sentList.length} bản ghi</strong></div>
                        </div>
                        <div className="ad-side-divider" />
                        <div className="ad-surface-head" style={{ marginBottom: 10 }}>
                            <div>
                                <h3 className="ad-surface-title">Gần đây nhất</h3>
                                <p className="ad-surface-text">4 thông báo mới nhất để bạn kiểm tra giọng điệu và nhịp gửi.</p>
                            </div>
                        </div>
                        {loadingList ? (
                            <div className="ad-empty-inline">Đang tải lịch sử...</div>
                        ) : latestSent.length === 0 ? (
                            <div className="ad-empty-inline">Chưa có thông báo nào được gửi.</div>
                        ) : (
                            <div className="ad-mini-list">
                                {latestSent.map((item) => (
                                    <div key={item._id} className="ad-mini-item">
                                        <div className="ad-mini-icon">{AN_TYPE_ICONS[item.type] || "📢"}</div>
                                        <div className="ad-mini-copy">
                                            <div className="ad-mini-title">{item.title}</div>
                                            <div className="ad-mini-meta">{formatDate(item.createdAt)} · {item.receiverIds?.length || 0} người nhận</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </aside>
                </div>
            )}

            {activeTab === "history" && (
                <section className="ad-surface-panel">
                    <div className="ad-surface-head">
                        <div>
                            <h3 className="ad-surface-title">Lịch sử gửi thông báo</h3>
                            <p className="ad-surface-text">Theo dõi hiệu quả gửi, số người nhận và lượt đọc trên cùng một danh sách quản trị.</p>
                        </div>
                        <button type="button" className="ad-hero-btn" onClick={loadSentList}>Làm mới</button>
                    </div>
                    <div className="an-history-panel ad-neutral-width">
                        {loadingList ? (
                            <div className="an-history-loading"><div className="an-spinner-lg" /><span>Đang tải lịch sử...</span></div>
                        ) : sentList.length === 0 ? (
                            <div className="an-history-empty"><span>📭</span><p>Chưa có thông báo nào được gửi</p></div>
                        ) : (
                            <div className="an-history-list">
                                {sentList.map((n) => (
                                    <div key={n._id} className="an-history-item">
                                        <div className="an-history-icon">{AN_TYPE_ICONS[n.type] || "📢"}</div>
                                        <div className="an-history-content">
                                            <div className="an-history-title">{n.title}</div>
                                            <div className="an-history-msg">{n.message}</div>
                                            <div className="an-history-meta">
                                                <span className="an-history-target">
                                                    {n.receiverType === "role"
                                                        ? (n.targetRole === "all" ? "👥 Tất cả" : n.targetRole === "student" ? "🎓 Sinh viên" : "📋 Quản lý")
                                                        : "👤 Cá nhân"}
                                                </span>
                                                <span className="an-history-receivers">{n.receiverIds?.length || 0} người nhận</span>
                                                <span className="an-history-read">✅ {n.readBy?.length || 0} đã đọc</span>
                                                <span className="an-history-date">{formatDate(n.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
const INV_TYPE_OPTIONS = [
    { value: "violation_fine", label: "🚫 Vi phạm quy chế" },
    { value: "damage_compensation", label: "💥 Bồi thường thiệt hại" },
    { value: "electricity", label: "⚡ Điện vượt trội" },
    { value: "room_fee", label: "🏠 Phí phòng" },
    { value: "other", label: "📄 Khác" },
];

const PRICE_CONFIG = [
    { key: "violation_fine_rate", label: "🚫 Phí vi phạm quy chế", unit: "đồng/lần", suffix: "đ", color: "#ef4444" },
    { key: "electricity_excess_rate", label: "⚡ Điện vượt trội", unit: "đồng/kWh", suffix: "đ", color: "#f59e0b" },
    { key: "damage_compensation_rate", label: "💥 Bồi thường thiệt hại", unit: "đồng/vụ", suffix: "đ", color: "#ec4899" },
    { key: "free_electricity_units", label: "💡 Số điện miễn phí mỗi tháng", unit: "kWh/phòng", suffix: "kWh", color: "#22c55e" },
];

function SettingsPanel() {
    const [activeTab, setActiveTab] = useState("prices");
    const [prices, setPrices] = useState({});
    const [priceLoading, setPriceLoading] = useState(true);
    const [priceSaving, setPriceSaving] = useState(false);
    const [priceAlert, setPriceAlert] = useState({ type: "", msg: "" });
    const showPriceAlert = (type, msg) => { setPriceAlert({ type, msg }); setTimeout(() => setPriceAlert({ type: "", msg: "" }), 4000); };

    const [regOpen, setRegOpen] = useState(true);
    const [regToggling, setRegToggling] = useState(false);
    const handleToggleReg = async () => {
        setRegToggling(true);
        try {
            await api.put("/settings/registration-open", { isOpen: !regOpen });
            setRegOpen(p => !p);
            showPriceAlert("success", !regOpen ? "Đã mở đăng ký phòng!" : "Đã tắt đăng ký phòng!");
        } catch { showPriceAlert("error", "Không thể thay đổi trạng thái"); }
        finally { setRegToggling(false); }
    };

    const now = new Date();
    const mo = now.getMonth() + 1;
    const yr = now.getFullYear();
    const semester = mo <= 3 ? "Spring" : mo <= 8 ? "Summer" : "Fall";
    const autoTermCode = `${semester}${yr}`;
    const twWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const BILL_INIT = { studentSearch: "", selectedStudent: null, type: "violation_fine", amount: "", excessKwh: "", description: "", dueDate: twWeeksLater, termCode: autoTermCode };
    const [bill, setBill] = useState(BILL_INIT);
    const [studentResults, setStudentResults] = useState([]);
    const [studentSearching, setStudentSearching] = useState(false);
    const [billSending, setBillSending] = useState(false);
    const [billAlert, setBillAlert] = useState({ type: "", msg: "" });
    const showBillAlert = (type, msg) => { setBillAlert({ type, msg }); setTimeout(() => setBillAlert({ type: "", msg: "" }), 5000); };

    const [debtors, setDebtors] = useState([]);
    const [debtorLoading, setDebtorLoading] = useState(false);

    useEffect(() => {
        api.get("/settings/prices")
            .then(r => {
                const d = r.data.data;
                const flat = {};
                for (const key of Object.keys(d)) flat[key] = d[key].value;
                setPrices(flat);
            })
            .catch(() => showPriceAlert("error", "Không thể tải cài đặt giá"))
            .finally(() => setPriceLoading(false));

        api.get("/settings/registration-open")
            .then(r => setRegOpen(r.data.data.isOpen))
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (activeTab !== "bill") return;
        setDebtorLoading(true);
        api.get("/invoices/debtors")
            .then(r => setDebtors(r.data.data || []))
            .catch(() => { })
            .finally(() => setDebtorLoading(false));
    }, [activeTab]);

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
            showPriceAlert("success", "Cập nhật giá thành công!");
        } catch { showPriceAlert("error", "Lưu thất bại"); }
        finally { setPriceSaving(false); }
    };

    const handleSendBill = async () => {
        if (!bill.selectedStudent) { showBillAlert("error", "Vui lòng chọn sinh viên"); return; }
        if (!bill.dueDate) { showBillAlert("error", "Vui lòng chọn hạn thanh toán"); return; }

        let finalAmount;
        if (bill.type === "electricity") {
            if (!bill.excessKwh || Number(bill.excessKwh) <= 0) { showBillAlert("error", "Vui lòng nhập số kWh vượt mức hợp lệ"); return; }
            if (!prices.electricity_excess_rate) { showBillAlert("error", "Chưa có giá điện trong cài đặt"); return; }
            const totalElec = Number(bill.excessKwh) * Number(prices.electricity_excess_rate);
            const occupants = bill.selectedStudent?.currentRoomId?.currentOccupancy || 1;
            finalAmount = Math.ceil(totalElec / occupants);
        } else {
            if (!bill.amount || Number(bill.amount) <= 0) { showBillAlert("error", "Số tiền phải lớn hơn 0"); return; }
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
                        ? `Điện vượt mức: ${bill.excessKwh} kWh × ${fmtMoney(prices.electricity_excess_rate)}/kWh ÷ ${occupants} người = ${fmtMoney(finalAmount)}/người`
                        : ""
                ),
                dueDate: bill.dueDate,
                termCode: bill.termCode,
            });
            showBillAlert("success", data.message || "Tạo hóa đơn thành công!");
            setBill(BILL_INIT); setStudentResults([]);
            api.get("/invoices/debtors").then(r => setDebtors(r.data.data || []));
        } catch (e) { showBillAlert("error", e.response?.data?.message || "Tạo hóa đơn thất bại"); }
        finally { setBillSending(false); }
    };

    const configuredPrices = PRICE_CONFIG.filter(cfg => prices[cfg.key] !== undefined && prices[cfg.key] !== "").length;
    const debtorCount = debtors.length;
    const totalDebt = debtors.reduce((sum, item) => sum + Number(item.totalDebt || 0), 0);
    const selectedStudentLabel = bill.selectedStudent?.fullName || "Chưa chọn sinh viên";

    return (
        <div className="ad-panel-stack">
            <section className="ad-section-hero ad-section-hero-settings">
                <div className="ad-section-copy">
                    <span className="ad-section-eyebrow">Billing Control Center</span>
                    <h2 className="ad-section-title">⚙️ Cài đặt & gửi bill</h2>
                    <p className="ad-section-subtitle">
                        Điều chỉnh giá dịch vụ, kiểm soát trạng thái đăng ký phòng và phát hành hóa đơn từ cùng một màn hình điều hành của admin.
                    </p>
                    <div className="ad-section-pills">
                        <span className="ad-section-pill neutral">Tab hiện tại: {activeTab === "prices" ? "Cài đặt giá" : "Gửi bill"}</span>
                        <span className={`ad-section-pill ${regOpen ? "success" : "danger"}`}>{regOpen ? "Đang mở đăng ký phòng" : "Đang khóa đăng ký phòng"}</span>
                        <span className="ad-section-pill neutral">Sinh viên còn nợ: {debtorCount}</span>
                    </div>
                </div>
                <div className="ad-section-actions">
                    <button type="button" className={`ad-hero-btn ${activeTab === "prices" ? "primary" : ""}`} onClick={() => setActiveTab("prices")}>Cài đặt giá</button>
                    <button type="button" className={`ad-hero-btn ${activeTab === "bill" ? "primary" : ""}`} onClick={() => setActiveTab("bill")}>Gửi bill</button>
                </div>
            </section>

            <div className="ad-stats-grid">
                <StatCard icon="💲" label="Mục giá đã cấu hình" value={configuredPrices} meta={`${PRICE_CONFIG.length} trường cấu hình chính`} color="#7c3aed" loading={priceLoading} />
                <StatCard icon="🪪" label="Đăng ký phòng" value={regOpen ? "Mở" : "Khóa"} meta="Trạng thái vận hành hiện tại" color={regOpen ? "#16a34a" : "#dc2626"} loading={false} />
                <StatCard icon="📄" label="Sinh viên còn nợ" value={debtorCount} meta={fmtMoney(totalDebt)} color="#e8540a" loading={activeTab === "bill" && debtorLoading} />
                <StatCard icon="🎯" label="Đối tượng bill" value={selectedStudentLabel} meta={`Kỳ học mặc định: ${bill.termCode}`} color="#2563eb" loading={false} />
            </div>

            <div className="ad-toolbar-shell">
                <div className="ad-toolbar-copy">
                    <h3 className="ad-toolbar-title">Điều hướng cài đặt và thanh toán</h3>
                    <p className="ad-toolbar-text">Tách rõ luồng cấu hình giá và luồng phát hành hóa đơn để admin thao tác chính xác hơn.</p>
                </div>
                <div className="ad-toolbar-controls">
                    <div className="an-tabs" style={{ marginBottom: 0 }}>
                        <button className={`an-tab ${activeTab === "prices" ? "active" : ""}`} onClick={() => setActiveTab("prices")}>💲 Cài đặt giá</button>
                        <button className={`an-tab ${activeTab === "bill" ? "active" : ""}`} onClick={() => setActiveTab("bill")}>💻 Gửi bill thanh toán</button>
                    </div>
                </div>
            </div>

            {activeTab === "prices" && (
                <div className="ad-split-layout">
                    <section className="ad-surface-panel">
                        <div className="ad-surface-head">
                            <div>
                                <h3 className="ad-surface-title">Cấu hình giá & trạng thái đăng ký</h3>
                                <p className="ad-surface-text">Cập nhật các mức phí chính và bật/tắt quyền đăng ký phòng của sinh viên.</p>
                            </div>
                        </div>

                        {priceAlert.msg && (
                            <div className={`an-alert ${priceAlert.type}`} style={{ marginBottom: 16 }}>
                                {priceAlert.type === "success" ? "✓" : "⚠️"} {priceAlert.msg}
                            </div>
                        )}

                        {priceLoading ? (
                            <div className="ad-empty-inline"><div className="ab-spinner" />Đang tải cấu hình giá...</div>
                        ) : (
                            <div className="ad-settings-price-stack">
                                <div className={`ad-settings-toggle-card ${regOpen ? "open" : "closed"}`}>
                                    <span className="ad-settings-toggle-icon">{regOpen ? "🟢" : "🔴"}</span>
                                    <div className="ad-settings-toggle-copy">
                                        <div className="ad-settings-toggle-title">Cho phép sinh viên đăng ký phòng</div>
                                        <div className="ad-settings-toggle-meta">
                                            {regOpen ? "Đang mở — Sinh viên có thể gửi đơn đăng ký" : "Đang tắt — Sinh viên không thể đăng ký phòng"}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleToggleReg}
                                        disabled={regToggling}
                                        className={`ad-settings-toggle-btn ${regOpen ? "danger" : "success"}`}
                                    >
                                        {regToggling ? "..." : regOpen ? "Tắt" : "Bật"}
                                    </button>
                                </div>

                                {PRICE_CONFIG.map(cfg => (
                                    <div key={cfg.key} className="ad-settings-price-card" style={{ "--ad-price-color": cfg.color }}>
                                        <div className="ad-settings-price-copy">
                                            <div className="ad-settings-price-title">{cfg.label}</div>
                                            <div className="ad-settings-price-unit">({cfg.unit})</div>
                                        </div>
                                        <div className="ad-settings-price-input-wrap">
                                            <input
                                                type="number"
                                                min="0"
                                                value={prices[cfg.key] ?? ""}
                                                onChange={e => setPrices(p => ({ ...p, [cfg.key]: e.target.value }))}
                                                className="ad-settings-price-input"
                                            />
                                            <span className="ad-settings-price-suffix">{cfg.suffix || "đ"}</span>
                                        </div>
                                    </div>
                                ))}

                                <div className="ad-settings-actions">
                                    <button onClick={handleSavePrices} disabled={priceSaving} className="an-btn-send">
                                        {priceSaving ? <><span className="an-spinner" /> Đang lưu...</> : "💾 Lưu cài đặt"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    <aside className="ad-surface-panel">
                        <div className="ad-surface-head">
                            <div>
                                <h3 className="ad-surface-title">Tóm tắt cấu hình</h3>
                                <p className="ad-surface-text">Xem nhanh các giá trị hiện hành trước khi áp dụng thay đổi mới.</p>
                            </div>
                        </div>
                        <div className="ad-kv-list">
                            {PRICE_CONFIG.map((cfg) => (
                                <div key={cfg.key} className="ad-kv-row">
                                    <span className="ad-kv-label">{cfg.label}</span>
                                    <strong className="ad-kv-value">{prices[cfg.key] !== undefined && prices[cfg.key] !== "" ? `${B_fmtNum(prices[cfg.key])}${cfg.suffix}` : "Chưa cấu hình"}</strong>
                                </div>
                            ))}
                        </div>
                        <div className="ad-side-divider" />
                        <div className="ad-kv-list">
                            <div className="ad-kv-row"><span className="ad-kv-label">Đăng ký phòng</span><strong className="ad-kv-value">{regOpen ? "Đang mở" : "Đang khóa"}</strong></div>
                            <div className="ad-kv-row"><span className="ad-kv-label">Kỳ bill mặc định</span><strong className="ad-kv-value">{bill.termCode}</strong></div>
                        </div>
                    </aside>
                </div>
            )}

            {activeTab === "bill" && (
                <div className="ad-split-layout">
                    <section className="ad-surface-panel">
                        <div className="ad-surface-head">
                            <div>
                                <h3 className="ad-surface-title">Tạo hóa đơn mới</h3>
                                <p className="ad-surface-text">Chọn sinh viên, loại hóa đơn và kỳ hạn thanh toán trước khi phát hành bill.</p>
                            </div>
                        </div>

                        {billAlert.msg && (
                            <div className={`an-alert ${billAlert.type}`} style={{ marginBottom: 12 }}>
                                {billAlert.type === "success" ? "✓" : "⚠️"} {billAlert.msg}
                            </div>
                        )}

                        <div className="an-field">
                            <label className="an-label">🎓 Sinh viên *</label>
                            {bill.selectedStudent ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#6366f110", border: "1.5px solid #6366f140", borderRadius: 8 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                        {bill.selectedStudent.fullName[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 13 }}>{bill.selectedStudent.fullName}</div>
                                        <div style={{ fontSize: 11, color: "#888" }}>MSSV: {bill.selectedStudent.studentCode}</div>
                                    </div>
                                    <button type="button" onClick={() => setBill(p => ({ ...p, selectedStudent: null, studentSearch: "" }))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                                </div>
                            ) : (
                                <div style={{ position: "relative" }}>
                                    <input
                                        className="an-input"
                                        placeholder="🔍 Tìm theo tên hoặc mã sinh viên..."
                                        value={bill.studentSearch}
                                        onChange={e => setBill(p => ({ ...p, studentSearch: e.target.value }))}
                                    />
                                    {studentSearching && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#888" }}>Đang tìm...</span>}
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
                                                    <span style={{ fontSize: 11, color: "#888" }}>MSSV: {s.studentCode} {!s.currentRoomId ? "⚠️ Chưa có phòng" : ""}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="an-field">
                            <label className="an-label">Loại hóa đơn *</label>
                            <select className="an-select" value={bill.type} onChange={e => setBill(p => ({ ...p, type: e.target.value }))}>
                                {INV_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>

                        {bill.type === "electricity" ? (
                            <div className="an-field">
                                <label className="an-label">⚡ Số kWh vượt mức *</label>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <input className="an-input" type="number" min="0" step="0.1" placeholder="VD: 15" value={bill.excessKwh} onChange={e => setBill(p => ({ ...p, excessKwh: e.target.value }))} style={{ flex: 1 }} />
                                    <span style={{ fontSize: 13, color: "#888", flexShrink: 0 }}>kWh</span>
                                </div>
                                {bill.excessKwh > 0 && prices.electricity_excess_rate ? (() => {
                                    const total = Number(bill.excessKwh) * Number(prices.electricity_excess_rate);
                                    const occ = bill.selectedStudent?.currentRoomId?.currentOccupancy || 1;
                                    const perPerson = Math.ceil(total / occ);
                                    return (
                                        <div style={{ marginTop: 8, padding: "10px 14px", background: "#f59e0b10", border: "1.5px solid #f59e0b30", borderRadius: 8 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: occ > 1 ? 6 : 0 }}>
                                                <span style={{ fontSize: 12, color: "#888" }}>{bill.excessKwh} kWh × {fmtMoney(prices.electricity_excess_rate)}/kWh</span>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{fmtMoney(total)}</span>
                                            </div>
                                            {occ > 1 && (
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f59e0b20", paddingTop: 6 }}>
                                                    <span style={{ fontSize: 12, color: "#16a34a" }}>÷ {occ} người trong phòng</span>
                                                    <span style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{fmtMoney(perPerson)}/người</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })() : bill.excessKwh > 0 && !prices.electricity_excess_rate ? (
                                    <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>⚠️ Chưa cài đặt giá điện — vui lòng cấu hình trước</p>
                                ) : null}
                            </div>
                        ) : (
                            <div className="an-field">
                                <label className="an-label">Số tiền (VND) *</label>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <input className="an-input" type="number" min="0" placeholder="VD: 500000" value={bill.amount} onChange={e => setBill(p => ({ ...p, amount: e.target.value }))} />
                                    {bill.type === "violation_fine" && prices.violation_fine_rate && (
                                        <button type="button" onClick={() => setBill(p => ({ ...p, amount: prices.violation_fine_rate }))} style={{ whiteSpace: "nowrap", fontSize: 11, padding: "5px 10px", background: "#ef444415", border: "1px solid #ef444430", borderRadius: 6, cursor: "pointer", color: "#ef4444" }}>
                                            = {fmtMoney(prices.violation_fine_rate)}
                                        </button>
                                    )}
                                </div>
                                {bill.type === "damage_compensation" && (
                                    <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>💡 Bồi thường thiệt hại — nhập số tiền cụ thể theo mức độ thiệt hại thực tế</p>
                                )}
                            </div>
                        )}

                        <div className="an-field">
                            <label className="an-label">Mô tả</label>
                            <textarea className="an-textarea" rows={2} placeholder="Lý do / chi tiết..." value={bill.description} onChange={e => setBill(p => ({ ...p, description: e.target.value }))} />
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                            <div className="an-field" style={{ flex: 1 }}>
                                <label className="an-label">Hạn thanh toán *</label>
                                <input className="an-input" type="date" value={bill.dueDate} min={new Date().toISOString().slice(0, 10)} onChange={e => setBill(p => ({ ...p, dueDate: e.target.value }))} />
                            </div>
                            <div className="an-field" style={{ flex: 1 }}>
                                <label className="an-label">Kỳ học</label>
                                <input className="an-input" placeholder="VD: 2024-1" value={bill.termCode} onChange={e => setBill(p => ({ ...p, termCode: e.target.value }))} />
                            </div>
                        </div>

                        <button onClick={handleSendBill} disabled={billSending} className="an-btn-send" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
                            {billSending ? <><span className="an-spinner" /> Đang tạo...</> : "💻 Tạo & gửi hóa đơn"}
                        </button>
                    </section>

                    <section className="ad-surface-panel">
                        <div className="ad-surface-head">
                            <div>
                                <h3 className="ad-surface-title">Sinh viên còn nợ ({debtors.length})</h3>
                                <p className="ad-surface-text">Chọn nhanh một sinh viên còn nợ để tạo bill mới hoặc tiếp tục xử lý công nợ.</p>
                            </div>
                        </div>

                        {debtorLoading ? (
                            <div className="ad-empty-inline"><div className="ab-spinner" />Đang tải danh sách công nợ...</div>
                        ) : debtors.length === 0 ? (
                            <div className="ad-empty-inline">🎉 Không có sinh viên nào còn nợ!</div>
                        ) : (
                            <div className="ad-side-scroll">
                                <div className="ad-kv-list" style={{ marginBottom: 16 }}>
                                    <div className="ad-kv-row"><span className="ad-kv-label">Tổng nợ đang theo dõi</span><strong className="ad-kv-value">{fmtMoney(totalDebt)}</strong></div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
                                                <div style={{ fontSize: 10, color: "#94a3b8" }}>{d.invoiceCount} hóa đơn</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}
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

