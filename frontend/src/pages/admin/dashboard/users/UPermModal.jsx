import { useState } from "react";
import api from "../../../../services/api";
import { U_DEFAULT_PERMS, U_PERM_LABELS, U_ROLE_LABELS } from "./constants";

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

export default UPermModal;
