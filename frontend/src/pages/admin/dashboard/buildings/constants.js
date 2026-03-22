const B_fmtNum = (n) => Number(n || 0).toLocaleString("vi-VN");
const B_ROOM_STATUS = { available: "Còn chỗ", partial: "Còn ít chỗ", full: "Hết chỗ", maintenance: "Bảo trì" };
const B_TYPE_LABEL = { standard: "Tiêu chuẩn", vip: "VIP", premium: "Premium" };
const B_occColor = (pct) => pct < 50 ? "#16a34a" : pct < 100 ? "#f59e0b" : "#dc2626";

export {
    B_fmtNum,
    B_occColor,
    B_ROOM_STATUS,
    B_TYPE_LABEL,
};
