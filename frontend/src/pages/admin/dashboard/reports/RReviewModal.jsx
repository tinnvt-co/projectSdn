import { useState } from "react";
import api from "../../../../services/api";

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

export default RReviewModal;
