import { useState, useEffect } from "react";
import "./StudentDashboard.css";
import { studentApi } from "../../services/studentApi";
import NewsPanel from "./NewsPanel";
import RoomHistoryPanel from "./RoomHistoryPanel";
import BookingsPanel from "./BookingsPanel";
import ElectricityPanel from "./ElectricityPanel";
import PaymentHistoryPanel from "./PaymentHistoryPanel";
import MyRequestsPanel from "./MyRequestsPanel";
import ViolationsPanel from "./ViolationsPanel";
import ChangePasswordModal from "../../components/ChangePasswordModal";

const MENU = [
    { id: "news", icon: "??", label: "Tin t?c" },
    { id: "room-history", icon: "??", label: "L?ch s? phòng" },
    { id: "bookings", icon: "??", label: "Ðang ký phòng" },
    { id: "electricity", icon: "?", label: "Ði?n nu?c" },
    { id: "payments", icon: "??", label: "L?ch s? thanh toán" },
    { id: "requests", icon: "??", label: "Yêu c?u c?a tôi" },
    { id: "violations", icon: "??", label: "L?ch s? ph?t" },
];

export default function StudentDashboard() {
    const [active, setActive] = useState("news");
    const [profile, setProfile] = useState(null);
    const [showChangePw, setShowChangePw] = useState(false);
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    useEffect(() => {
        studentApi.getProfile()
            .then((r) => setProfile(r.data.data))
            .catch(() => { });
    }, []);

    const initials = (profile?.fullName || user.username || "SV")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const currentRoomText = profile?.currentRoomId
        ? `${profile.currentRoomId.roomNumber} - ${profile.currentRoomId.buildingId?.name || "KTX"}`
        : "Chua có";

    const panels = {
        news: <NewsPanel />,
        "room-history": <RoomHistoryPanel />,
        bookings: <BookingsPanel />,
        electricity: <ElectricityPanel />,
        payments: <PaymentHistoryPanel />,
        requests: <MyRequestsPanel />,
        violations: <ViolationsPanel />,
    };

    return (
        <div className="sd-wrapper">
            <aside className="sd-sidebar">
                <div className="sd-sidebar-header">
                    <div className="sd-sidebar-avatar">{initials}</div>
                    <div className="sd-sidebar-name">{profile?.fullName || user.username || "Sinh viên"}</div>
                    <div className="sd-sidebar-code">{profile?.studentCode || ""}</div>
                    <div className="sd-sidebar-meta">
                        Tài kho?n: <strong>{profile?.userId?.username || user.username || "—"}</strong>
                    </div>
                    <div className="sd-sidebar-meta">
                        Phòng dang ?: <strong>{currentRoomText}</strong>
                    </div>
                </div>

                <nav className="sd-menu">
                    {MENU.map((item) => (
                        <button
                            key={item.id}
                            className={`sd-menu-item${active === item.id ? " active" : ""}`}
                            onClick={() => setActive(item.id)}
                        >
                            <span className="sd-menu-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                    <button
                        className="sd-menu-item"
                        style={{ marginTop: 8, color: "#e8540a", borderTop: "1px solid #f0e8e4", paddingTop: 12 }}
                        onClick={() => setShowChangePw(true)}
                    >
                        <span className="sd-menu-icon">??</span>
                        Ð?i m?t kh?u
                    </button>
                </nav>
            </aside>

            <main className="sd-content">{panels[active]}</main>

            {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
        </div>
    );
}

