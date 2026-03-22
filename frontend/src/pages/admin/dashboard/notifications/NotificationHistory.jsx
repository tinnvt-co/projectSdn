import {
    formatNotificationDate,
    getNotificationTargetLabel,
} from "./constants";

function NotificationHistory({ loadingList, onRefresh, sentList }) {
    return (
        <section className="ad-surface-panel">
            <div className="ad-surface-head">
                <div>
                    <h3 className="ad-surface-title">Lịch sử gửi thông báo</h3>
                    <p className="ad-surface-text">Theo dõi hiệu quả gửi, số người nhận và lượt đọc trên cùng một danh sách quản trị.</p>
                </div>
                <button type="button" className="ad-hero-btn" onClick={onRefresh}>Làm mới</button>
            </div>
            <div className="an-history-panel ad-neutral-width">
                {loadingList ? (
                    <div className="an-history-loading"><div className="an-spinner-lg" /><span>Đang tải lịch sử...</span></div>
                ) : sentList.length === 0 ? (
                    <div className="an-history-empty"><p>Chưa có thông báo nào được gửi</p></div>
                ) : (
                    <div className="an-history-list">
                        {sentList.map((item) => (
                            <div key={item._id} className="an-history-item">
                                <div className="an-history-content">
                                    <div className="an-history-title">{item.title}</div>
                                    <div className="an-history-msg">{item.message}</div>
                                    <div className="an-history-meta">
                                        <span className="an-history-target">{getNotificationTargetLabel(item)}</span>
                                        <span className="an-history-receivers">{item.receiverIds?.length || 0} người nhận</span>
                                        <span className="an-history-read">Đã đọc: {item.readBy?.length || 0}</span>
                                        <span className="an-history-date">{formatNotificationDate(item.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default NotificationHistory;
