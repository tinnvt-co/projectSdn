import { useState } from "react";
import api from "../../../../services/api";

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

export default BRoomModal;
