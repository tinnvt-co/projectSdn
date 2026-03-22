import { useCallback, useEffect, useState } from "react";
import api from "../../../services/api";
import { StatCard } from "./shared";

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

export default UsersPanel;
