import { useState, useEffect } from "react";
import { studentApi } from "../../services/studentApi";
import api from "../../services/api";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");
const fmtNum = (n) => Number(n || 0).toLocaleString("vi-VN");

const STATUS_MAP = {
    pending: { label: "Ch? duy?t", cls: "pending" },
    approved: { label: "Ðã duy?t", cls: "approved" },
    rejected: { label: "T? ch?i", cls: "rejected" },
};

const ROOM_TYPE_LABEL = { standard: "Tiêu chu?n", vip: "VIP", premium: "Premium" };
const ROOM_TYPE_COLOR = { standard: "#555", vip: "#2563eb", premium: "#d97706" };

const getCurrentTermCode = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    return `HK${month < 6 ? 1 : 2}-${now.getFullYear()}`;
};

export default function BookingsPanel() {
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [termCode, setTermCode] = useState(getCurrentTermCode());
    const [note, setNote] = useState("");
    const [filterType, setFilterType] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState(null);
    const [regOpen, setRegOpen] = useState(true);

    const hasCurrentRoom = Boolean(profile?.currentRoomId);

    const load = () => {
        setLoading(true);
        Promise.all([
            studentApi.getBookings().then((r) => setBookings(r.data.data || [])),
            studentApi.getProfile().then((r) => setProfile(r.data.data || null)),
        ])
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        api.get("/settings/registration-open")
            .then((r) => setRegOpen(r.data.data.isOpen))
            .catch(() => { });
    }, []);

    const fetchRooms = (typeValue) => {
        setLoadingRooms(true);
        studentApi.getAvailableRooms({ type: typeValue || undefined })
            .then((r) => setRooms(r.data.data || []))
            .catch(() => setRooms([]))
            .finally(() => setLoadingRooms(false));
    };

    const openForm = () => {
        setAlert(null);
        if (hasCurrentRoom) {
            setAlert({
                type: "error",
                msg: "B?n dang có phòng ? k? hi?n t?i. N?u mu?n d?i phòng, vui lòng g?i Yêu c?u chuy?n phòng ? m?c 'Yêu c?u c?a tôi'.",
            });
            return;
        }
        setShowForm(true);
        fetchRooms(filterType);
    };

    const handleFilterType = (type) => {
        setFilterType(type);
        setSelectedRoom(null);
        fetchRooms(type);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedRoom) {
            setAlert({ type: "error", msg: "Vui lòng ch?n m?t phòng" });
            return;
        }
        if (!termCode) {
            setAlert({ type: "error", msg: "Vui lòng nh?p k? h?c" });
            return;
        }

        setSubmitting(true);
        try {
            await studentApi.createBooking({ roomId: selectedRoom._id, termCode, note });
            setAlert({ type: "success", msg: "Ðang ký phòng thành công và dã du?c x?p phòng ngay." });
            setShowForm(false);
            setSelectedRoom(null);
            setNote("");
            load();
        } catch (err) {
            setAlert({ type: "error", msg: err.response?.data?.message || "Ðang ký th?t b?i" });
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
                <h2 className="sd-panel-title">?? Ðang ký phòng</h2>
                <p className="sd-panel-subtitle">Ðang ký phòng KTX theo k? h?c</p>
            </div>

            {hasCurrentRoom && (
                <div style={{ padding: "12px 16px", background: "#effaf3", border: "1.5px solid #16a34a30", borderRadius: 10, marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#15803d" }}>B?n dang có phòng hi?n t?i</div>
                    <div style={{ fontSize: 12, color: "#3f3f46", marginTop: 4 }}>
                        Phòng {profile.currentRoomId?.roomNumber} - {profile.currentRoomId?.buildingId?.name || "KTX"}. N?u mu?n d?i phòng, hãy t?o Yêu c?u chuy?n phòng.
                    </div>
                </div>
            )}

            {!regOpen && (
                <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1.5px solid #ef444430", borderRadius: 10, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>??</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#dc2626" }}>T?m d?ng nh?n don dang ký</div>
                        <div style={{ fontSize: 12, color: "#999" }}>Ban qu?n lý hi?n chua m? d?t dang ký phòng. Vui lòng ch? thông báo.</div>
                    </div>
                </div>
            )}

            {alert && (
                <div className={`sd-alert ${alert.type}`} style={{ marginBottom: 16 }}>
                    {alert.type === "success" ? "?" : "?"} {alert.msg}
                </div>
            )}

            <button
                className="sd-toggle-form"
                disabled={!regOpen || hasCurrentRoom}
                onClick={() => (showForm ? setShowForm(false) : openForm())}
                style={!regOpen || hasCurrentRoom ? { opacity: 0.45, cursor: "not-allowed" } : {}}
            >
                {showForm ? "? Ðóng form" : "+ Ðang ký phòng m?i"}
            </button>

            {showForm && regOpen && !hasCurrentRoom && (
                <div className="sd-form" style={{ marginBottom: 24 }}>
                    <div className="sd-form-title">Ch?n phòng và nh?p thông tin dang ký</div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {["", "standard", "vip", "premium"].map((t) => (
                            <button
                                key={t}
                                onClick={() => handleFilterType(t)}
                                style={{
                                    padding: "7px 16px",
                                    borderRadius: 8,
                                    border: "1.5px solid",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all .2s",
                                    borderColor: filterType === t ? "#e8540a" : "#e8e8e8",
                                    background: filterType === t ? "rgba(232,84,10,.08)" : "#f5f5f5",
                                    color: filterType === t ? "#e8540a" : "#666",
                                }}
                            >
                                {t === "" ? "T?t c?" : ROOM_TYPE_LABEL[t]}
                            </button>
                        ))}
                    </div>

                    <div>
                        <div className="sd-label" style={{ marginBottom: 10 }}>
                            Ch?n phòng <span style={{ color: "#ef4444" }}>*</span>
                            <span style={{ color: "#bbb", fontWeight: 400, marginLeft: 8 }}>
                                ({loadingRooms ? "Ðang t?i..." : `${rooms.length} phòng còn ch?`})
                            </span>
                        </div>
                        {loadingRooms ? (
                            <div style={{ textAlign: "center", padding: "20px", color: "#bbb" }}>
                                <div className="sd-spinner" style={{ margin: "0 auto" }} />
                            </div>
                        ) : rooms.length === 0 ? (
                            <div style={{ padding: "16px", background: "#fafafa", borderRadius: 10, color: "#bbb", textAlign: "center", fontSize: 13 }}>
                                Không có phòng nào còn ch?
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10, maxHeight: 360, overflowY: "auto" }}>
                                {rooms.map((room) => {
                                    const isSelected = selectedRoom?._id === room._id;
                                    const pct = Math.round((room.currentOccupancy / room.maxOccupancy) * 100);
                                    return (
                                        <div
                                            key={room._id}
                                            onClick={() => setSelectedRoom(room)}
                                            style={{
                                                padding: "14px 16px",
                                                borderRadius: 12,
                                                cursor: "pointer",
                                                border: isSelected ? "2px solid #e8540a" : "1.5px solid #e8e8e8",
                                                background: isSelected ? "rgba(232,84,10,.06)" : "#fff",
                                                transition: "all .2s",
                                                boxShadow: isSelected ? "0 0 0 3px rgba(232,84,10,.1)" : "none",
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                                <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>Phòng {room.roomNumber}</span>
                                                <span
                                                    style={{
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        padding: "2px 8px",
                                                        borderRadius: 6,
                                                        color: ROOM_TYPE_COLOR[room.type],
                                                        background: `${ROOM_TYPE_COLOR[room.type]}15`,
                                                    }}
                                                >
                                                    {ROOM_TYPE_LABEL[room.type]}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                                                ?? {room.buildingId?.name || "—"} · T?ng {room.floor}
                                            </div>
                                            <div style={{ marginBottom: 6 }}>
                                                <div style={{ height: 4, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                                                    <div style={{ height: "100%", width: `${pct}%`, background: pct < 50 ? "#16a34a" : pct < 100 ? "#f59e0b" : "#dc2626", borderRadius: 4 }} />
                                                </div>
                                                <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>
                                                    {room.currentOccupancy}/{room.maxOccupancy} ngu?i · Còn {room.maxOccupancy - room.currentOccupancy} ch?
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: "#e8540a" }}>{fmtNum(room.pricePerTerm)}d / k?</div>
                                            {isSelected && <div style={{ marginTop: 8, color: "#e8540a", fontSize: 12, fontWeight: 600 }}>? Ðã ch?n</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="sd-field">
                        <label className="sd-label">K? h?c <span style={{ color: "#ef4444" }}>*</span></label>
                        <input className="sd-input" placeholder="VD: HK1-2026" value={termCode} onChange={(e) => setTermCode(e.target.value)} />
                    </div>
                    <div className="sd-field">
                        <label className="sd-label">Ghi chú</label>
                        <textarea className="sd-textarea" placeholder="Ghi chú thêm (không b?t bu?c)" value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>

                    {selectedRoom && (
                        <div style={{ padding: "12px 16px", background: "rgba(232,84,10,.05)", border: "1px solid rgba(232,84,10,.15)", borderRadius: 10, fontSize: 13, color: "#555" }}>
                            ?? B?n dang dang ký: <strong>Phòng {selectedRoom.roomNumber}</strong> - {selectedRoom.buildingId?.name} - T?ng {selectedRoom.floor} ({fmtNum(selectedRoom.pricePerTerm)}d/k?)
                        </div>
                    )}

                    <div className="sd-form-actions">
                        <button type="button" className="sd-btn-secondary" onClick={() => { setShowForm(false); setSelectedRoom(null); }}>H?y</button>
                        <button className="sd-btn-primary" onClick={handleSubmit} disabled={submitting || !selectedRoom || !termCode}>
                            {submitting ? "Ðang g?i..." : "Ðang ký ngay"}
                        </button>
                    </div>
                </div>
            )}

            {bookings.length === 0 ? (
                <div className="sd-empty">
                    <span className="sd-empty-icon">??</span>
                    <p className="sd-empty-text">Chua có don dang ký phòng nào</p>
                </div>
            ) : (
                <div className="sd-table-wrap">
                    <table className="sd-table">
                        <thead>
                            <tr>
                                <th>Phòng</th>
                                <th>K? h?c</th>
                                <th>Ngày dang ký</th>
                                <th>Ngày h?t h?n ?</th>
                                <th>Ghi chú BQL</th>
                                <th>Tr?ng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((item) => {
                                const s = STATUS_MAP[item.status] || { label: item.status, cls: "info" };
                                return (
                                    <tr key={item._id}>
                                        <td>
                                            <strong>Phòng {item.roomId?.roomNumber || "—"}</strong>
                                            <br />
                                            <span style={{ color: "#888", fontSize: 12 }}>{item.roomId?.buildingId?.name || "—"}</span>
                                        </td>
                                        <td><strong>{item.termCode}</strong></td>
                                        <td>{fmtDate(item.createdAt)}</td>
                                        <td>
                                            {item.endDate ? (
                                                <span style={{ color: "#e8540a", fontWeight: 600 }}>{fmtDate(item.endDate)}</span>
                                            ) : (
                                                <span style={{ color: "#bbb", fontSize: 12 }}>Chua xác d?nh</span>
                                            )}
                                        </td>
                                        <td style={{ color: "#777", fontSize: 13 }}>{item.reviewNote || "—"}</td>
                                        <td><span className={`sd-badge ${s.cls}`}>{s.label}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

