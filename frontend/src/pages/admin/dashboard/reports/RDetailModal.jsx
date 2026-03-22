import { R_TYPE_COLORS, R_TYPE_LABELS } from "./constants";

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

export default RDetailModal;
