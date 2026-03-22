import { useEffect, useState } from "react";
import api from "../../../../services/api";

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

export default BBuildingModal;
