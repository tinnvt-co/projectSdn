import { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";
import "./NotificationBell.css";

const TYPE_LABELS = {
    general: "Chung",
    payment_reminder: "Nhắc thanh toán",
    maintenance: "Bảo trì",
    announcement: "Thông báo",
};

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const { data } = await api.get("/notifications/unread-count");
            setUnreadCount(data.count);
        } catch {
            // ignore
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/notifications/my?limit=15");
            setNotifications(data.data);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    useEffect(() => {
        const handler = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleOpen = () => {
        if (!open) fetchNotifications();
        setOpen((prev) => !prev);
    };

    const handleMarkRead = async (notification) => {
        if (notification.isRead) return;
        try {
            await api.put(`/notifications/${notification._id}/read`);
            setNotifications((prev) => prev.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item)));
            setUnreadCount((count) => Math.max(0, count - 1));
        } catch {
            // ignore
        }
    };

    const handleMarkAll = async () => {
        try {
            await api.put("/notifications/read-all");
            setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
            setUnreadCount(0);
        } catch {
            // ignore
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = (now - date) / 1000;
        if (diff < 60) return "Vừa xong";
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
        return date.toLocaleDateString("vi-VN");
    };

    return (
        <div className="nb-wrap" ref={dropdownRef}>
            <button type="button" className="nb-btn" onClick={handleOpen} title="Thông báo">
                <span className="nb-icon">🔔</span>
                {unreadCount > 0 && (
                    <span className="nb-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                )}
            </button>

            {open && (
                <div className="nb-dropdown">
                    <div className="nb-header">
                        <span className="nb-header-title">Thông báo</span>
                        {unreadCount > 0 && (
                            <button type="button" className="nb-mark-all" onClick={handleMarkAll}>
                                Đọc tất cả
                            </button>
                        )}
                    </div>

                    <div className="nb-list">
                        {loading ? (
                            <div className="nb-loading">
                                <div className="nb-spinner" />
                                <span>Đang tải...</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="nb-empty">
                                <p>Hiện chưa có thông báo mới</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`nb-item ${notification.isRead ? "read" : "unread"}`}
                                    onClick={() => handleMarkRead(notification)}
                                >
                                    <div className="nb-item-content">
                                        <div className="nb-item-title">{notification.title}</div>
                                        <div className="nb-item-msg">{notification.message}</div>
                                        <div className="nb-item-meta">
                                            <span className="nb-item-type">{TYPE_LABELS[notification.type] || "Chung"}</span>
                                            <span className="nb-item-time">{formatTime(notification.createdAt)}</span>
                                        </div>
                                    </div>
                                    {!notification.isRead && <div className="nb-dot" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
