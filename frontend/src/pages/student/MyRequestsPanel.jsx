import { useState, useEffect } from "react";
import { studentApi } from "../../services/studentApi";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

const TYPE_LABEL = {
    damage_report: "?? Báo h?ng hóc",
    room_transfer: "?? Chuy?n phòng",
    room_retention: "?? Gi? phòng",
    other: "?? Khác",
};

const STATUS_MAP = {
    pending: { label: "Ch? x? lý", cls: "pending" },
    manager_approved: { label: "Manager dã duy?t", cls: "approved" },
    manager_rejected: { label: "Manager t? ch?i", cls: "rejected" },
    admin_approved: { label: "Admin dã duy?t", cls: "approved" },
    admin_rejected: { label: "Admin t? ch?i", cls: "rejected" },
    completed: { label: "Hoàn thành", cls: "completed" },
};

export default function MyRequestsPanel() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState({
        type: "damage_report",
        title: "",
        description: "",
        targetRoomId: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState(null);

    const load = () => {
        setLoading(true);
        Promise.all([
            studentApi.getRequests().then((r) => setData(r.data.data || [])),
            studentApi.getProfile().then((r) => setProfile(r.data.data || null)),
        ])
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    const loadAvailableRooms = () => {
        setLoadingRooms(true);
        studentApi.getAvailableRooms()
            .then((r) => {
                const currentRoomId = profile?.currentRoomId?._id;
                const roomList = (r.data.data || []).filter((room) => String(room._id) !== String(currentRoomId || ""));
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description) {
            setAlert({ type: "error", msg: "Vui lòng nh?p tiêu d? và mô t?" });
            return;
        }

        if (form.type === "room_transfer") {
            if (!profile?.currentRoomId) {
                setAlert({ type: "error", msg: "B?n chua có phòng hi?n t?i d? g?i yêu c?u chuy?n phòng" });
                return;
            }
            if (!form.targetRoomId) {
                setAlert({ type: "error", msg: "Vui lòng ch?n phòng mu?n chuy?n d?n" });
                return;
            }
        }

        setSubmitting(true);
        try {
            const payload = {
                type: form.type,
                title: form.title,
                description: form.description,
            };
            if (form.type === "room_transfer") payload.targetRoomId = form.targetRoomId;

            await studentApi.createRequest(payload);
            setAlert({ type: "success", msg: "G?i yêu c?u thành công!" });
            setForm({ type: "damage_report", title: "", description: "", targetRoomId: "" });
            setShowForm(false);
            load();
        } catch (err) {
            setAlert({ type: "error", msg: err.response?.data?.message || "G?i yêu c?u th?t b?i" });
        }
        setSubmitting(false);
    };

    if (loading) {
        return (
            <div className="sd-loading">
                <div className="sd-spinner" />
                <span>Ðang t?i...</span>
            </div>
        );
    }

    return (
        <>
            <div className="sd-panel-header">
                <h2 className="sd-panel-title">?? Yêu c?u c?a tôi</h2>
                <p className="sd-panel-subtitle">Các yêu c?u b?n dã g?i lên Ban qu?n lý</p>
            </div>

            {alert && (
                <div className={`sd-alert ${alert.type}`} style={{ marginBottom: 16 }}>
                    {alert.type === "success" ? "?" : "?"} {alert.msg}
                </div>
            )}

            <button
                className="sd-toggle-form"
                onClick={() => {
                    setShowForm((v) => !v);
                    setAlert(null);
                }}
            >
                {showForm ? "? Ðóng form" : "+ G?i yêu c?u m?i"}
            </button>

            {showForm && (
                <form className="sd-form" onSubmit={handleSubmit}>
                    <div className="sd-form-title">G?i yêu c?u m?i</div>
                    <div className="sd-field">
                        <label className="sd-label">Lo?i yêu c?u <span style={{ color: "#ef4444" }}>*</span></label>
                        <select
                            className="sd-select"
                            value={form.type}
                            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, targetRoomId: "" }))}
                        >
                            <option value="damage_report">?? Báo h?ng hóc</option>
                            <option value="room_transfer" disabled={!profile?.currentRoomId}>?? Xin chuy?n phòng</option>
                            <option value="room_retention">?? Xin gi? phòng</option>
                            <option value="other">?? Khác</option>
                        </select>
                        {form.type === "room_transfer" && !profile?.currentRoomId && (
                            <div style={{ color: "#dc2626", fontSize: 12 }}>B?n chua có phòng hi?n t?i nên chua th? t?o yêu c?u chuy?n phòng.</div>
                        )}
                    </div>

                    {form.type === "room_transfer" && profile?.currentRoomId && (
                        <>
                            <div className="sd-field">
                                <label className="sd-label">Phòng hi?n t?i</label>
                                <input
                                    className="sd-input"
                                    disabled
                                    value={`Phòng ${profile.currentRoomId.roomNumber} - ${profile.currentRoomId.buildingId?.name || "KTX"}`}
                                />
                            </div>
                            <div className="sd-field">
                                <label className="sd-label">Phòng mu?n chuy?n d?n <span style={{ color: "#ef4444" }}>*</span></label>
                                <select
                                    className="sd-select"
                                    value={form.targetRoomId}
                                    onChange={(e) => setForm((f) => ({ ...f, targetRoomId: e.target.value }))}
                                >
                                    <option value="">Ch?n phòng còn tr?ng</option>
                                    {rooms.map((room) => (
                                        <option key={room._id} value={room._id}>
                                            {`Phòng ${room.roomNumber} - ${room.buildingId?.name || "KTX"} (Còn ${room.maxOccupancy - room.currentOccupancy} ch?)`}
                                        </option>
                                    ))}
                                </select>
                                {loadingRooms && <div style={{ color: "#999", fontSize: 12 }}>Ðang t?i danh sách phòng tr?ng...</div>}
                                {!loadingRooms && rooms.length === 0 && <div style={{ color: "#999", fontSize: 12 }}>Hi?n không có phòng tr?ng d? chuy?n.</div>}
                            </div>
                        </>
                    )}

                    <div className="sd-field">
                        <label className="sd-label">Tiêu d? <span style={{ color: "#ef4444" }}>*</span></label>
                        <input
                            className="sd-input"
                            placeholder="Nh?p tiêu d? yêu c?u"
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        />
                    </div>
                    <div className="sd-field">
                        <label className="sd-label">Mô t? chi ti?t <span style={{ color: "#ef4444" }}>*</span></label>
                        <textarea
                            className="sd-textarea"
                            placeholder="Mô t? rõ n?i dung yêu c?u..."
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        />
                    </div>
                    <div className="sd-form-actions">
                        <button type="button" className="sd-btn-secondary" onClick={() => setShowForm(false)}>H?y</button>
                        <button type="submit" className="sd-btn-primary" disabled={submitting}>
                            {submitting ? "Ðang g?i..." : "G?i yêu c?u"}
                        </button>
                    </div>
                </form>
            )}

            {data.length === 0 ? (
                <div className="sd-empty">
                    <span className="sd-empty-icon">??</span>
                    <p className="sd-empty-text">Chua có yêu c?u nào</p>
                </div>
            ) : (
                <div className="sd-list">
                    {data.map((item) => {
                        const s = STATUS_MAP[item.status] || { label: item.status, cls: "info" };
                        return (
                            <div key={item._id} className="sd-list-item">
                                <div className="sd-list-icon">{TYPE_LABEL[item.type]?.split(" ")[0] || "??"}</div>
                                <div className="sd-list-body">
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                        <span className="sd-list-title">{item.title}</span>
                                        <span className={`sd-badge ${s.cls}`}>{s.label}</span>
                                    </div>
                                    <p className="sd-list-text">{item.description}</p>
                                    <div className="sd-list-meta">
                                        {TYPE_LABEL[item.type]} · ?? {fmtDate(item.createdAt)}
                                        {item.currentRoomId && ` · Phòng ${item.currentRoomId.roomNumber}`}
                                        {item.targetRoomId && ` -> Phòng ${item.targetRoomId.roomNumber}`}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}

