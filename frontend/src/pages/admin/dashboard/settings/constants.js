export const INVOICE_TYPE_OPTIONS = [
    { value: "violation_fine", label: "🚫 Vi phạm quy chế" },
    { value: "damage_compensation", label: "💥 Bồi thường thiệt hại" },
    { value: "electricity", label: "⚡ Điện vượt trội" },
    { value: "room_fee", label: "🏠 Phí phòng" },
    { value: "other", label: "📄 Khác" },
];

export const PRICE_CONFIG = [
    { key: "violation_fine_rate", label: "🚫 Phí vi phạm quy chế", unit: "đồng/lần", suffix: "đ", color: "#ef4444" },
    { key: "electricity_excess_rate", label: "⚡ Điện vượt trội", unit: "đồng/kWh", suffix: "đ", color: "#f59e0b" },
    { key: "damage_compensation_rate", label: "💥 Bồi thường thiệt hại", unit: "đồng/vụ", suffix: "đ", color: "#ec4899" },
    { key: "free_electricity_units", label: "💡 Số điện miễn phí mỗi tháng", unit: "kWh/phòng", suffix: "kWh", color: "#22c55e" },
];

export function fmtSettingsMoney(value) {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

export function fmtSettingsNumber(value) {
    return Number(value || 0).toLocaleString("vi-VN");
}

export function createInitialBill(now = new Date()) {
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const semester = month <= 3 ? "Spring" : month <= 8 ? "Summer" : "Fall";
    const dueDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    return {
        studentSearch: "",
        selectedStudent: null,
        type: "violation_fine",
        amount: "",
        excessKwh: "",
        description: "",
        dueDate,
        termCode: `${semester}${year}`,
    };
}

export function calculateElectricityPreview(bill, prices) {
    const excessKwh = Number(bill.excessKwh || 0);
    const rate = Number(prices.electricity_excess_rate || 0);
    const occupants = bill.selectedStudent?.currentRoomId?.currentOccupancy || 1;
    const total = excessKwh * rate;

    return {
        total,
        occupants,
        perPerson: Math.ceil(total / occupants),
    };
}
