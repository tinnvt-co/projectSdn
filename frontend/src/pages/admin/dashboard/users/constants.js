const U_ROLE_LABELS = { admin: "Admin", manager: "Quản lý", student: "Sinh viên" };
const U_ROLE_COLORS = { admin: "#f59e0b", manager: "#6366f1", student: "#22c55e" };
const U_DEFAULT_PERMS = {
    admin: ["manage_users", "manage_students", "manage_buildings", "manage_rooms", "manage_settings", "view_revenue", "approve_reports", "assign_permissions", "send_notifications", "view_room_list", "view_unpaid_students"],
    manager: ["manage_requests", "send_reports", "send_notifications", "view_room_list", "view_unpaid_students"],
    student: ["submit_requests", "register_room", "make_payment", "view_own_history", "view_room_list"],
};
const U_PERM_LABELS = {
    manage_users: "Quản lý người dùng", manage_students: "Quản lý sinh viên",
    manage_buildings: "Quản lý tòa nhà", manage_rooms: "Quản lý phòng",
    manage_settings: "Cài đặt hệ thống", view_revenue: "Xem doanh thu",
    approve_reports: "Duyệt báo cáo", assign_permissions: "Cấp quyền",
    send_notifications: "Gửi thông báo", view_room_list: "Xem danh sách phòng",
    view_unpaid_students: "Xem SV chưa đóng tiền",
    manage_requests: "Quản lý yêu cầu", send_reports: "Gửi báo cáo",
    submit_requests: "Gửi yêu cầu", register_room: "Đăng ký phòng",
    make_payment: "Thanh toán", view_own_history: "Xem lịch sử cá nhân",
};

export {
    U_DEFAULT_PERMS,
    U_PERM_LABELS,
    U_ROLE_COLORS,
    U_ROLE_LABELS,
};
