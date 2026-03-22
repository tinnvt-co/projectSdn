export const OVERVIEW_EMPTY_STATS = {
    totalUsers: null,
    totalStudents: null,
    totalBuildings: null,
    activeBuildings: null,
    pendingReports: null,
    unpaidAmount: null,
    collectionRate: null,
    totalInvoices: null,
    registrationOpen: null,
};

export const ADMIN_MENU = [
    { id: "overview", icon: "🛡️", label: "Tổng quan" },
    { id: "users", icon: "👥", label: "Tài khoản" },
    { id: "buildings", icon: "🏢", label: "Tòa nhà & Phòng" },
    { id: "reports", icon: "📑", label: "Báo cáo" },
    { id: "finance", icon: "💰", label: "Tài chính" },
    { id: "settings", icon: "⚙️", label: "Cài đặt & Bill" },
    { id: "notifications", icon: "🔔", label: "Thông báo" },
];

export const ADMIN_TABS = new Set(ADMIN_MENU.map((item) => item.id));

export function getAdminTabFromSearch(search) {
    const params = new URLSearchParams(search);
    const tab = params.get("tab");
    return ADMIN_TABS.has(tab) ? tab : "overview";
}
