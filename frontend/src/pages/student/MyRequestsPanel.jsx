import { useEffect, useMemo, useState } from "react";
import { studentApi } from "../../services/studentApi";

const fmtDate = (date) => (date ? new Date(date).toLocaleDateString("vi-VN") : "-");

const REQUEST_TYPE_META = {
    damage_report: { label: "Báo hỏng hóc", short: "BH", tone: "danger" },
    room_transfer: { label: "Chuyển phòng", short: "CP", tone: "primary" },
    room_retention: { label: "Giữ phòng", short: "GP", tone: "success" },
    room_reservation_cancel: { label: "Hủy giữ chỗ", short: "HG", tone: "warning" },
    other: { label: "Khác", short: "KH", tone: "neutral" },
};

const STATUS_MAP = {
    pending: { label: "Chờ xử lý", cls: "pending" },
    manager_approved: { label: "Manager đã duyệt", cls: "approved" },
    manager_rejected: { label: "Manager từ chối", cls: "rejected" },
    admin_approved: { label: "Admin đã duyệt", cls: "approved" },
    admin_rejected: { label: "Admin từ chối", cls: "rejected" },
    completed: { label: "Hoàn thành", cls: "completed" },
};

export default function MyRequestsPanel() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [profile, setProfile] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [form, setForm] = useState({
        type: "damage_report",
        title: "",
        description: "",
        targetRoomId: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState(null);

    const reservedBooking = useMemo(
        () =>
            [...bookings]
                .filter((item) => item.status === "approved" && !item.activatedAt)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0],
        [bookings]
    );

    const load = () => {
        setLoading(true);
        Promise.all([
            studentApi.getRequests().then((response) => setData(response.data.data || [])),
            studentApi.getProfile().then((response) => setProfile(response.data.data || null)),
            studentApi.getBookings().then((response) => setBookings(response.data.data || [])),
        ])
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    const loadAvailableRooms = () => {
        setLoadingRooms(true);
        studentApi
            .getAvailableRooms()
            .then((response) => {
                const currentRoomId = profile?.currentRoomId?._id;
                const roomList = (response.data.data || []).filter(
                    (room) => String(room._id) !== String(currentRoomId || "")
                );
                setRooms(roomList);
            })
            .catch(() => setRooms([]))
            .finally(() => setLoadingRooms(false));
    };

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        if (showForm && form.type === "room_transfer") {
            loadAvailableRooms();
        }
    }, [showForm, form.type, profile?.currentRoomId?._id]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.title || !form.description) {
            setAlert({ type: "error", msg: "Vui lòng nhập tiêu đề và mô tả" });
            return;
        }

        if (form.type === "room_transfer") {
            if (!profile?.currentRoomId) {
                setAlert({ type: "error", msg: "Bạn chưa có phòng hiện tại để gửi yêu cầu chuyển phòng" });
                return;
            }
            if (!form.targetRoomId) {
                setAlert({ type: "error", msg: "Vui lòng chọn phòng muốn chuyển đến" });
                return;
            }
        }

        if (form.type === "room_reservation_cancel" && !reservedBooking) {
            setAlert({ type: "error", msg: "Bạn không có phòng giữ chỗ để hủy" });
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                type: form.type,
                title: form.title,
                description: form.description,
            };

            if (form.type === "room_transfer") {
                payload.targetRoomId = form.targetRoomId;
            }

            await studentApi.createRequest(payload);
            setAlert({ type: "success", msg: "Gửi yêu cầu thành công!" });
            setForm({ type: "damage_report", title: "", description: "", targetRoomId: "" });
            setShowForm(false);
            load();
        } catch (error) {
            setAlert({
                type: "error",
                msg: error.response?.data?.message || "Gửi yêu cầu thất bại",
            });
        }
        setSubmitting(false);
    };

    if (loading) {
        return (
            <div className="sd-loading">
                <div className="sd-spinner" />
                <span>Đang tải...</span>
            </div>
        );
    }

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">Yêu cầu của tôi</h2>
                <p className="sd-panel-subtitle">Các yêu cầu bạn đã gửi lên Ban quản lý</p>
            </div>

            {alert && (
                <div className={`sd-alert ${alert.type}`} style={{ marginBottom: 16 }}>
                    {alert.msg}
                </div>
            )}

            <button
                className="sd-toggle-form"
                onClick={() => {
                    setShowForm((value) => !value);
                    setAlert(null);
                }}
            >
                {showForm ? "Đóng form" : "Gửi yêu cầu mới"}
            </button>

            {showForm && (
                <form className="sd-form" onSubmit={handleSubmit}>
                    <div className="sd-form-title">Gửi yêu cầu mới</div>

                    <div className="sd-field">
                        <label className="sd-label">
                            Loại yêu cầu <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <select
                            className="sd-select"
                            value={form.type}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    type: event.target.value,
                                    targetRoomId: "",
                                }))
                            }
                        >
                            <option value="damage_report">Báo hỏng hóc</option>
                            <option value="room_transfer" disabled={!profile?.currentRoomId}>
                                Xin chuyển phòng
                            </option>
                            <option value="room_retention">Xin giữ phòng</option>
                            <option value="room_reservation_cancel" disabled={profile?.currentRoomId || !reservedBooking}>
                                Xin hủy phòng đã giữ chỗ
                            </option>
                            <option value="other">Khác</option>
                        </select>
                    </div>

                    {form.type === "room_transfer" && profile?.currentRoomId && (
                        <>
                            <div className="sd-field">
                                <label className="sd-label">Phòng hiện tại</label>
                                <input
                                    className="sd-input"
                                    disabled
                                    value={`Phòng ${profile.currentRoomId.roomNumber} - ${
                                        profile.currentRoomId.buildingId?.name || "KTX"
                                    }`}
                                />
                            </div>
                            <div className="sd-field">
                                <label className="sd-label">
                                    Phòng muốn chuyển đến <span style={{ color: "#ef4444" }}>*</span>
                                </label>
                                <select
                                    className="sd-select"
                                    value={form.targetRoomId}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            targetRoomId: event.target.value,
                                        }))
                                    }
                                >
                                    <option value="">Chọn phòng còn trống</option>
                                    {rooms.map((room) => (
                                        <option key={room._id} value={room._id}>
                                            {`Phòng ${room.roomNumber} - ${
                                                room.buildingId?.name || "KTX"
                                            } (Còn ${room.maxOccupancy - room.currentOccupancy} chỗ)`}
                                        </option>
                                    ))}
                                </select>
                                {loadingRooms && (
                                    <div style={{ color: "#999", fontSize: 12 }}>
                                        Đang tải danh sách phòng trống...
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {form.type === "room_reservation_cancel" && reservedBooking && (
                        <div
                            style={{
                                padding: "12px 16px",
                                background: "#fff8eb",
                                border: "1px solid rgba(217,119,6,0.2)",
                                borderRadius: 10,
                                fontSize: 13,
                                color: "#555",
                            }}
                        >
                            Bạn đang xin hủy giữ chỗ: <strong>Phòng {reservedBooking.roomId?.roomNumber || "-"}</strong>
                            {" - "}
                            {reservedBooking.roomId?.buildingId?.name || "KTX"}.
                        </div>
                    )}

                    <div className="sd-field">
                        <label className="sd-label">
                            Tiêu đề <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            className="sd-input"
                            placeholder="Nhập tiêu đề yêu cầu"
                            value={form.title}
                            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                        />
                    </div>

                    <div className="sd-field">
                        <label className="sd-label">
                            Mô tả chi tiết <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <textarea
                            className="sd-textarea"
                            placeholder="Mô tả rõ nội dung yêu cầu..."
                            value={form.description}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, description: event.target.value }))
                            }
                        />
                    </div>

                    <div className="sd-form-actions">
                        <button type="button" className="sd-btn-secondary" onClick={() => setShowForm(false)}>
                            Hủy
                        </button>
                        <button type="submit" className="sd-btn-primary" disabled={submitting}>
                            {submitting ? "Đang gửi..." : "Gửi yêu cầu"}
                        </button>
                    </div>
                </form>
            )}

            {data.length === 0 ? (
                <div className="sd-empty">
                    <span className="sd-empty-icon">📋</span>
                    <p className="sd-empty-text">Chưa có yêu cầu nào</p>
                </div>
            ) : (
                <div className="sd-list">
                    {data.map((item) => {
                        const statusMeta = STATUS_MAP[item.status] || { label: item.status, cls: "info" };
                        const requestMeta = REQUEST_TYPE_META[item.type] || REQUEST_TYPE_META.other;
                        const metaParts = [
                            requestMeta.label,
                            fmtDate(item.createdAt),
                            item.currentRoomId ? `Phòng ${item.currentRoomId.roomNumber}` : null,
                            item.targetRoomId ? `Chuyển đến phòng ${item.targetRoomId.roomNumber}` : null,
                        ].filter(Boolean);

                        return (
                            <div key={item._id} className="sd-list-item sd-request-item">
                                <div className={`sd-request-icon sd-request-icon--${requestMeta.tone}`}>
                                    {requestMeta.short}
                                </div>
                                <div className="sd-list-body">
                                    <div className="sd-request-header">
                                        <div className="sd-request-title-row">
                                            <span className="sd-list-title">{item.title}</span>
                                            <span className={`sd-badge ${statusMeta.cls}`}>{statusMeta.label}</span>
                                        </div>
                                        <span className="sd-request-type">{requestMeta.label}</span>
                                    </div>
                                    <p className="sd-list-text">{item.description}</p>
                                    <div className="sd-list-meta sd-request-meta">{metaParts.join(" · ")}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
