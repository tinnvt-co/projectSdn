export function fmtOverviewMoney(value) {
    if (value === null || value === undefined) return "—";
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

export function fmtOverviewTime(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
    });
}
