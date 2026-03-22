import { useCallback, useState } from "react";
import api from "../../../../services/api";
import { B_fmtNum, B_occColor, B_ROOM_STATUS, B_TYPE_LABEL } from "./constants";

function BBuildingCard({ building, onEdit, onDelete, onAddRoom, showAlert }) {
    const [open, setOpen] = useState(false);
    const [rooms, setRooms] = useState([]);
    const [loadingR, setLoadingR] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const loadRooms = useCallback(async () => {
        if (loaded) return;
        setLoadingR(true);
        try {
            const response = await api.get(`/buildings/${building._id}/rooms`);
            setRooms(response.data.data);
            setLoaded(true);
        } catch {
            showAlert("error", "Không thể tải danh sách phòng");
        } finally {
            setLoadingR(false);
        }
    }, [building._id, loaded, showAlert]);

    const refreshRooms = async () => {
        setLoaded(false);
        const response = await api.get(`/buildings/${building._id}/rooms`);
        setRooms(response.data.data);
        setLoaded(true);
    };

    const handleDeleteRoom = async (room) => {
        if (!window.confirm(`Xóa phòng ${room.roomNumber}?`)) return;
        try {
            await api.delete(`/rooms/${room._id}`);
            showAlert("success", `Đã xóa phòng ${room.roomNumber}`);
            refreshRooms();
        } catch (err) {
            showAlert("error", err.response?.data?.message || "Xóa phòng thất bại");
        }
    };

    const handleToggle = () => {
        const next = !open;
        setOpen(next);
        if (next) loadRooms();
    };

    return (
        <div className={`ab-building-card ${open ? "expanded" : ""}`}>
            <div className="ab-building-header" onClick={handleToggle}>
                <div className="ab-building-icon">{building.name?.[0]?.toUpperCase() || "T"}</div>
                <div className="ab-building-info">
                    <div className="ab-building-name">{building.name}</div>
                    <div className="ab-building-meta">
                        {building.address || "Chưa cập nhật địa chỉ"} · {building.totalFloors} tầng · {building.managerId?.username || "Chưa có quản lý"}
                    </div>
                </div>
                <div className="ab-building-right">
                    <span className={`ab-status-badge ${building.status}`}>
                        {building.status === "active" ? "Hoạt động" : building.status === "maintenance" ? "Bảo trì" : "Tạm đóng"}
                    </span>
                    <button
                        type="button"
                        className="ab-btn-edit"
                        onClick={(event) => {
                            event.stopPropagation();
                            onEdit(building);
                        }}
                    >
                        Sửa
                    </button>
                    <button
                        type="button"
                        className="ab-btn-del"
                        onClick={(event) => {
                            event.stopPropagation();
                            onDelete(building);
                        }}
                    >
                        Xóa
                    </button>
                    <span className={`ab-chevron ${open ? "open" : ""}`}>{open ? "▴" : "▾"}</span>
                </div>
            </div>
            {open && (
                <div className="ab-rooms-section">
                    <div className="ab-rooms-header">
                        <span className="ab-rooms-title">Danh sách phòng {loaded ? `(${rooms.length})` : ""}</span>
                        <button type="button" className="ab-btn-add-room" onClick={() => onAddRoom(building, refreshRooms)}>
                            Thêm phòng
                        </button>
                    </div>
                    {loadingR ? (
                        <div className="ab-rooms-loading"><span className="ab-spinner" />Đang tải phòng...</div>
                    ) : rooms.length === 0 ? (
                        <div className="ab-rooms-empty">Chưa có phòng nào. Hãy thêm phòng đầu tiên để bắt đầu thiết lập.</div>
                    ) : (
                        <div className="ab-rooms-grid">
                            {rooms.map((room) => {
                                const pct = Math.round((room.currentOccupancy / room.maxOccupancy) * 100);
                                return (
                                    <div key={room._id} className="ab-room-card">
                                        <div className="ab-room-top">
                                            <span className="ab-room-num">P.{room.roomNumber}</span>
                                            <span className={`ab-room-status ${room.status}`}>{B_ROOM_STATUS[room.status] || room.status}</span>
                                        </div>
                                        <div className="ab-room-info">Tầng {room.floor} · {B_TYPE_LABEL[room.type] || room.type}</div>
                                        <div className="ab-room-occupancy">
                                            <div className="ab-room-occ-bar" style={{ width: `${pct}%`, background: B_occColor(pct) }} />
                                        </div>
                                        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
                                            {room.currentOccupancy}/{room.maxOccupancy} người
                                        </div>
                                        <div className="ab-room-price">{B_fmtNum(room.pricePerTerm)}đ/kỳ</div>
                                        <div className="ab-room-actions">
                                            <button type="button" className="ab-btn-room-del" onClick={() => handleDeleteRoom(room)}>
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default BBuildingCard;
