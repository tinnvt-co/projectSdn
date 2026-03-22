import { useCallback, useEffect, useState } from "react";
import api from "../../../services/api";
import { StatCard } from "./cards";
import { U_ROLE_COLORS, U_ROLE_LABELS } from "./users/constants";
import UCreateModal from "./users/UCreateModal";
import UPermModal from "./users/UPermModal";

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
                    <h2 className="ad-section-title">Quản lý tài khoản</h2>
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
                    {alert.msg}
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
                    <input className="au-search ad-input-enhanced" placeholder="Tìm theo username hoặc email..." value={search} onChange={e => setSearch(e.target.value)} />
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
                                            {u.isActive ? "Hoạt động" : "Bị khóa"}
                                        </button>
                                    </td>
                                    <td>
                                        <span className="perm-count">{u.permissions?.length || 0} quyền</span>
                                        <button className="btn-perm" onClick={() => { setSelected(u); setModal("perm"); }}>Chỉnh sửa</button>
                                    </td>
                                    <td><button className="btn-del" onClick={() => handleDelete(u)}>Xóa</button></td>
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
