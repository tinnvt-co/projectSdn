export const NOTIFICATION_TYPE_OPTIONS = [
    { value: "general", label: "📢 Thông báo chung" },
    { value: "payment_reminder", label: "💳 Nhắc thanh toán" },
    { value: "maintenance", label: "🔧 Bảo trì" },
    { value: "announcement", label: "📣 Quan trọng" },
];

export const NOTIFICATION_SEARCH_ROLE_OPTIONS = [
    { value: "student", label: "🎓 Sinh viên" },
    { value: "manager", label: "🏢 Quản lý" },
    { value: "admin", label: "🛡️ Admin" },
];

export const NOTIFICATION_TYPE_ICONS = {
    general: "📢",
    payment_reminder: "💳",
    maintenance: "🔧",
    announcement: "📣",
};

export const NOTIFICATION_INIT_FORM = {
    title: "",
    message: "",
    type: "general",
    receiverType: "role",
    targetRole: "student",
    receiverIds: [],
};

export function formatNotificationDate(value) {
    return new Date(value).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function getNotificationAudienceLabel(form, receiverIds) {
    if (form.receiverType === "role") {
        if (form.targetRole === "all") return "Tất cả người dùng";
        if (form.targetRole === "student") return "Tất cả sinh viên";
        return "Tất cả quản lý";
    }

    return receiverIds.length > 0 ? `${receiverIds.length} người đã chọn` : "Chưa chọn người nhận";
}

export function getNotificationTargetLabel(item) {
    if (item.receiverType !== "role") return "👤 Cá nhân";
    if (item.targetRole === "all") return "👥 Tất cả";
    if (item.targetRole === "student") return "🎓 Sinh viên";
    return "📋 Quản lý";
}
