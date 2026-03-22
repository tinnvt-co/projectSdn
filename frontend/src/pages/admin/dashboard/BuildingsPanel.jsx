import { useCallback, useEffect, useState } from "react";
import api from "../../../services/api";
import { StatCard } from "./cards";

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

export default BuildingsPanel;
