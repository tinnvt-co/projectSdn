import { useCallback, useEffect, useState } from "react";
import api from "../../../services/api";
import { StatCard } from "./shared";

const fmtMoney = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";

const INV_TYPE_OPTIONS = [
    { value: "violation_fine", label: "🚫 Vi phạm quy chế" },
    { value: "damage_compensation", label: "💥 Bồi thường thiệt hại" },
    { value: "electricity", label: "⚡ Điện vượt trội" },
    { value: "room_fee", label: "🏠 Phí phòng" },
    { value: "other", label: "📄 Khác" },
];

const PRICE_CONFIG = [
    { key: "violation_fine_rate", label: "🚫 Phí vi phạm quy chế", unit: "đồng/lần", suffix: "đ", color: "#ef4444" },
    { key: "electricity_excess_rate", label: "⚡ Điện vượt trội", unit: "đồng/kWh", suffix: "đ", color: "#f59e0b" },
    { key: "damage_compensation_rate", label: "💥 Bồi thường thiệt hại", unit: "đồng/vụ", suffix: "đ", color: "#ec4899" },
    { key: "free_electricity_units", label: "💡 Số điện miễn phí mỗi tháng", unit: "kWh/phòng", suffix: "kWh", color: "#22c55e" },
];

function SettingsPanel() {
    const [activeTab, setActiveTab] = useState("prices");
    const [prices, setPrices] = useState({});
    const [priceLoading, setPriceLoading] = useState(true);
    const [priceSaving, setPriceSaving] = useState(false);
    const [priceAlert, setPriceAlert] = useState({ type: "", msg: "" });
    const showPriceAlert = (type, msg) => { setPriceAlert({ type, msg }); setTimeout(() => setPriceAlert({ type: "", msg: "" }), 4000); };

    const [regOpen, setRegOpen] = useState(true);
    const [regToggling, setRegToggling] = useState(false);
    const handleToggleReg = async () => {
        setRegToggling(true);
        try {
            await api.put("/settings/registration-open", { isOpen: !regOpen });
            setRegOpen(p => !p);
            showPriceAlert("success", !regOpen ? "Đã mở đăng ký phòng!" : "Đã tắt đăng ký phòng!");
        } catch { showPriceAlert("error", "Không thể thay đổi trạng thái"); }
        finally { setRegToggling(false); }
    };

    const now = new Date();
    const mo = now.getMonth() + 1;
    const yr = now.getFullYear();
    const semester = mo <= 3 ? "Spring" : mo <= 8 ? "Summer" : "Fall";
    const autoTermCode = `${semester}${yr}`;
    const twWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const BILL_INIT = { studentSearch: "", selectedStudent: null, type: "violation_fine", amount: "", excessKwh: "", description: "", dueDate: twWeeksLater, termCode: autoTermCode };
    const [bill, setBill] = useState(BILL_INIT);
    const [studentResults, setStudentResults] = useState([]);
    const [studentSearching, setStudentSearching] = useState(false);
    const [billSending, setBillSending] = useState(false);
    const [billAlert, setBillAlert] = useState({ type: "", msg: "" });
    const showBillAlert = (type, msg) => { setBillAlert({ type, msg }); setTimeout(() => setBillAlert({ type: "", msg: "" }), 5000); };

    const [debtors, setDebtors] = useState([]);
    const [debtorLoading, setDebtorLoading] = useState(false);

    useEffect(() => {
        api.get("/settings/prices")
            .then(r => {
                const d = r.data.data;
                const flat = {};
                for (const key of Object.keys(d)) flat[key] = d[key].value;
                setPrices(flat);
            })
            .catch(() => showPriceAlert("error", "Không thể tải cài đặt giá"))
            .finally(() => setPriceLoading(false));

        api.get("/settings/registration-open")
            .then(r => setRegOpen(r.data.data.isOpen))
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (activeTab !== "bill") return;
        setDebtorLoading(true);
        api.get("/invoices/debtors")
            .then(r => setDebtors(r.data.data || []))
            .catch(() => { })
            .finally(() => setDebtorLoading(false));
    }, [activeTab]);

    useEffect(() => {
        if (!bill.studentSearch.trim()) { setStudentResults([]); return; }
        const t = setTimeout(async () => {
            setStudentSearching(true);
            try { const r = await api.get("/invoices/search-students", { params: { q: bill.studentSearch } }); setStudentResults(r.data.data || []); }
            catch { setStudentResults([]); }
            finally { setStudentSearching(false); }
        }, 350);
        return () => clearTimeout(t);
    }, [bill.studentSearch]);

    const handleSavePrices = async () => {
        setPriceSaving(true);
        try {
            await api.put("/settings/prices", prices);
            showPriceAlert("success", "Cập nhật giá thành công!");
        } catch { showPriceAlert("error", "Lưu thất bại"); }
        finally { setPriceSaving(false); }
    };

    const handleSendBill = async () => {
        if (!bill.selectedStudent) { showBillAlert("error", "Vui lòng chọn sinh viên"); return; }
        if (!bill.dueDate) { showBillAlert("error", "Vui lòng chọn hạn thanh toán"); return; }

        let finalAmount;
        if (bill.type === "electricity") {
            if (!bill.excessKwh || Number(bill.excessKwh) <= 0) { showBillAlert("error", "Vui lòng nhập số kWh vượt mức hợp lệ"); return; }
            if (!prices.electricity_excess_rate) { showBillAlert("error", "Chưa có giá điện trong cài đặt"); return; }
            const totalElec = Number(bill.excessKwh) * Number(prices.electricity_excess_rate);
            const occupants = bill.selectedStudent?.currentRoomId?.currentOccupancy || 1;
            finalAmount = Math.ceil(totalElec / occupants);
        } else {
            if (!bill.amount || Number(bill.amount) <= 0) { showBillAlert("error", "Số tiền phải lớn hơn 0"); return; }
            finalAmount = Number(bill.amount);
        }
        setBillSending(true);
        try {
            const occupants = bill.selectedStudent?.currentRoomId?.currentOccupancy || 1;
            const { data } = await api.post("/invoices", {
                studentId: bill.selectedStudent._id,
                type: bill.type,
                amount: finalAmount,
                description: bill.description || (
                    bill.type === "electricity"
                        ? `Điện vượt mức: ${bill.excessKwh} kWh × ${fmtMoney(prices.electricity_excess_rate)}/kWh ÷ ${occupants} người = ${fmtMoney(finalAmount)}/người`
                        : ""
                ),
                dueDate: bill.dueDate,
                termCode: bill.termCode,
            });
            showBillAlert("success", data.message || "Tạo hóa đơn thành công!");
            setBill(BILL_INIT); setStudentResults([]);
            api.get("/invoices/debtors").then(r => setDebtors(r.data.data || []));
        } catch (e) { showBillAlert("error", e.response?.data?.message || "Tạo hóa đơn thất bại"); }
        finally { setBillSending(false); }
    };

    const configuredPrices = PRICE_CONFIG.filter(cfg => prices[cfg.key] !== undefined && prices[cfg.key] !== "").length;
    const debtorCount = debtors.length;
    const totalDebt = debtors.reduce((sum, item) => sum + Number(item.totalDebt || 0), 0);
    const selectedStudentLabel = bill.selectedStudent?.fullName || "Chưa chọn sinh viên";

    return (
        <div className="ad-panel-stack">
            <section className="ad-section-hero ad-section-hero-settings">
                <div className="ad-section-copy">
                    <span className="ad-section-eyebrow">Billing Control Center</span>
                    <h2 className="ad-section-title">⚙️ Cài đặt & gửi bill</h2>
                    <p className="ad-section-subtitle">
                        Điều chỉnh giá dịch vụ, kiểm soát trạng thái đăng ký phòng và phát hành hóa đơn từ cùng một màn hình điều hành của admin.
                    </p>
                    <div className="ad-section-pills">
                        <span className="ad-section-pill neutral">Tab hiện tại: {activeTab === "prices" ? "Cài đặt giá" : "Gửi bill"}</span>
                        <span className={`ad-section-pill ${regOpen ? "success" : "danger"}`}>{regOpen ? "Đang mở đăng ký phòng" : "Đang khóa đăng ký phòng"}</span>
                        <span className="ad-section-pill neutral">Sinh viên còn nợ: {debtorCount}</span>
                    </div>
                </div>
                <div className="ad-section-actions">
                    <button type="button" className={`ad-hero-btn ${activeTab === "prices" ? "primary" : ""}`} onClick={() => setActiveTab("prices")}>Cài đặt giá</button>
                    <button type="button" className={`ad-hero-btn ${activeTab === "bill" ? "primary" : ""}`} onClick={() => setActiveTab("bill")}>Gửi bill</button>
                </div>
            </section>

            <div className="ad-stats-grid">
                <StatCard icon="💲" label="Mục giá đã cấu hình" value={configuredPrices} meta={`${PRICE_CONFIG.length} trường cấu hình chính`} color="#7c3aed" loading={priceLoading} />
                <StatCard icon="🪪" label="Đăng ký phòng" value={regOpen ? "Mở" : "Khóa"} meta="Trạng thái vận hành hiện tại" color={regOpen ? "#16a34a" : "#dc2626"} loading={false} />
                <StatCard icon="📄" label="Sinh viên còn nợ" value={debtorCount} meta={fmtMoney(totalDebt)} color="#e8540a" loading={activeTab === "bill" && debtorLoading} />
                <StatCard icon="🎯" label="Đối tượng bill" value={selectedStudentLabel} meta={`Kỳ học mặc định: ${bill.termCode}`} color="#2563eb" loading={false} />
            </div>

            <div className="ad-toolbar-shell">
                <div className="ad-toolbar-copy">
                    <h3 className="ad-toolbar-title">Điều hướng cài đặt và thanh toán</h3>
                    <p className="ad-toolbar-text">Tách rõ luồng cấu hình giá và luồng phát hành hóa đơn để admin thao tác chính xác hơn.</p>
                </div>
                <div className="ad-toolbar-controls">
                    <div className="an-tabs" style={{ marginBottom: 0 }}>
                        <button className={`an-tab ${activeTab === "prices" ? "active" : ""}`} onClick={() => setActiveTab("prices")}>💲 Cài đặt giá</button>
                        <button className={`an-tab ${activeTab === "bill" ? "active" : ""}`} onClick={() => setActiveTab("bill")}>💻 Gửi bill thanh toán</button>
                    </div>
                </div>
            </div>

            {activeTab === "prices" && (
                <div className="ad-split-layout">
                    <section className="ad-surface-panel">
                        <div className="ad-surface-head">
                            <div>
                                <h3 className="ad-surface-title">Cấu hình giá & trạng thái đăng ký</h3>
                                <p className="ad-surface-text">Cập nhật các mức phí chính và bật/tắt quyền đăng ký phòng của sinh viên.</p>
                            </div>
                        </div>

                        {priceAlert.msg && (
                            <div className={`an-alert ${priceAlert.type}`} style={{ marginBottom: 16 }}>
                                {priceAlert.type === "success" ? "✓" : "⚠️"} {priceAlert.msg}
                            </div>
                        )}

                        {priceLoading ? (
                            <div className="ad-empty-inline"><div className="ab-spinner" />Đang tải cấu hình giá...</div>
                        ) : (
                            <div className="ad-settings-price-stack">
                                <div className={`ad-settings-toggle-card ${regOpen ? "open" : "closed"}`}>
                                    <span className="ad-settings-toggle-icon">{regOpen ? "🟢" : "🔴"}</span>
                                    <div className="ad-settings-toggle-copy">
                                        <div className="ad-settings-toggle-title">Cho phép sinh viên đăng ký phòng</div>
                                        <div className="ad-settings-toggle-meta">
                                            {regOpen ? "Đang mở — Sinh viên có thể gửi đơn đăng ký" : "Đang tắt — Sinh viên không thể đăng ký phòng"}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleToggleReg}
                                        disabled={regToggling}
                                        className={`ad-settings-toggle-btn ${regOpen ? "danger" : "success"}`}
                                    >
                                        {regToggling ? "..." : regOpen ? "Tắt" : "Bật"}
                                    </button>
                                </div>

                                {PRICE_CONFIG.map(cfg => (
                                    <div key={cfg.key} className="ad-settings-price-card" style={{ "--ad-price-color": cfg.color }}>
                                        <div className="ad-settings-price-copy">
                                            <div className="ad-settings-price-title">{cfg.label}</div>
                                            <div className="ad-settings-price-unit">({cfg.unit})</div>
                                        </div>
                                        <div className="ad-settings-price-input-wrap">
                                            <input
                                                type="number"
                                                min="0"
                                                value={prices[cfg.key] ?? ""}
                                                onChange={e => setPrices(p => ({ ...p, [cfg.key]: e.target.value }))}
                                                className="ad-settings-price-input"
                                            />
                                            <span className="ad-settings-price-suffix">{cfg.suffix || "đ"}</span>
                                        </div>
                                    </div>
                                ))}

                                <div className="ad-settings-actions">
                                    <button onClick={handleSavePrices} disabled={priceSaving} className="an-btn-send">
                                        {priceSaving ? <><span className="an-spinner" /> Đang lưu...</> : "💾 Lưu cài đặt"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    <aside className="ad-surface-panel">
                        <div className="ad-surface-head">
                            <div>
                                <h3 className="ad-surface-title">Tóm tắt cấu hình</h3>
                                <p className="ad-surface-text">Xem nhanh các giá trị hiện hành trước khi áp dụng thay đổi mới.</p>
                            </div>
                        </div>
                        <div className="ad-kv-list">
                            {PRICE_CONFIG.map((cfg) => (
                                <div key={cfg.key} className="ad-kv-row">
                                    <span className="ad-kv-label">{cfg.label}</span>
                                    <strong className="ad-kv-value">{prices[cfg.key] !== undefined && prices[cfg.key] !== "" ? `${B_fmtNum(prices[cfg.key])}${cfg.suffix}` : "Chưa cấu hình"}</strong>
                                </div>
                            ))}
                        </div>
                        <div className="ad-side-divider" />
                        <div className="ad-kv-list">
                            <div className="ad-kv-row"><span className="ad-kv-label">Đăng ký phòng</span><strong className="ad-kv-value">{regOpen ? "Đang mở" : "Đang khóa"}</strong></div>
                            <div className="ad-kv-row"><span className="ad-kv-label">Kỳ bill mặc định</span><strong className="ad-kv-value">{bill.termCode}</strong></div>
                        </div>
                    </aside>
                </div>
            )}

            {activeTab === "bill" && (
                <div className="ad-split-layout">
                    <section className="ad-surface-panel">
                        <div className="ad-surface-head">
                            <div>
                                <h3 className="ad-surface-title">Tạo hóa đơn mới</h3>
                                <p className="ad-surface-text">Chọn sinh viên, loại hóa đơn và kỳ hạn thanh toán trước khi phát hành bill.</p>
                            </div>
                        </div>

                        {billAlert.msg && (
                            <div className={`an-alert ${billAlert.type}`} style={{ marginBottom: 12 }}>
                                {billAlert.type === "success" ? "✓" : "⚠️"} {billAlert.msg}
                            </div>
                        )}

                        <div className="an-field">
                            <label className="an-label">🎓 Sinh viên *</label>
                            {bill.selectedStudent ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#6366f110", border: "1.5px solid #6366f140", borderRadius: 8 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                        {bill.selectedStudent.fullName[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 13 }}>{bill.selectedStudent.fullName}</div>
                                        <div style={{ fontSize: 11, color: "#888" }}>MSSV: {bill.selectedStudent.studentCode}</div>
                                    </div>
                                    <button type="button" onClick={() => setBill(p => ({ ...p, selectedStudent: null, studentSearch: "" }))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                                </div>
                            ) : (
                                <div style={{ position: "relative" }}>
                                    <input
                                        className="an-input"
                                        placeholder="🔍 Tìm theo tên hoặc mã sinh viên..."
                                        value={bill.studentSearch}
                                        onChange={e => setBill(p => ({ ...p, studentSearch: e.target.value }))}
                                    />
                                    {studentSearching && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#888" }}>Đang tìm...</span>}
                                    {studentResults.length > 0 && (
                                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px #0002", zIndex: 100, maxHeight: 200, overflowY: "auto" }}>
                                            {studentResults.map(s => (
                                                <div
                                                    key={s._id}
                                                    onClick={() => { setBill(p => ({ ...p, selectedStudent: s, studentSearch: "" })); setStudentResults([]); }}
                                                    style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", flexDirection: "column" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                                    onMouseLeave={e => e.currentTarget.style.background = ""}
                                                >
                                                    <span style={{ fontWeight: 600, fontSize: 13 }}>{s.fullName}</span>
                                                    <span style={{ fontSize: 11, color: "#888" }}>MSSV: {s.studentCode} {!s.currentRoomId ? "⚠️ Chưa có phòng" : ""}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="an-field">
                            <label className="an-label">Loại hóa đơn *</label>
                            <select className="an-select" value={bill.type} onChange={e => setBill(p => ({ ...p, type: e.target.value }))}>
                                {INV_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>

                        {bill.type === "electricity" ? (
                            <div className="an-field">
                                <label className="an-label">⚡ Số kWh vượt mức *</label>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <input className="an-input" type="number" min="0" step="0.1" placeholder="VD: 15" value={bill.excessKwh} onChange={e => setBill(p => ({ ...p, excessKwh: e.target.value }))} style={{ flex: 1 }} />
                                    <span style={{ fontSize: 13, color: "#888", flexShrink: 0 }}>kWh</span>
                                </div>
                                {bill.excessKwh > 0 && prices.electricity_excess_rate ? (() => {
                                    const total = Number(bill.excessKwh) * Number(prices.electricity_excess_rate);
                                    const occ = bill.selectedStudent?.currentRoomId?.currentOccupancy || 1;
                                    const perPerson = Math.ceil(total / occ);
                                    return (
                                        <div style={{ marginTop: 8, padding: "10px 14px", background: "#f59e0b10", border: "1.5px solid #f59e0b30", borderRadius: 8 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: occ > 1 ? 6 : 0 }}>
                                                <span style={{ fontSize: 12, color: "#888" }}>{bill.excessKwh} kWh × {fmtMoney(prices.electricity_excess_rate)}/kWh</span>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{fmtMoney(total)}</span>
                                            </div>
                                            {occ > 1 && (
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f59e0b20", paddingTop: 6 }}>
                                                    <span style={{ fontSize: 12, color: "#16a34a" }}>÷ {occ} người trong phòng</span>
                                                    <span style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{fmtMoney(perPerson)}/người</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })() : bill.excessKwh > 0 && !prices.electricity_excess_rate ? (
                                    <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>⚠️ Chưa cài đặt giá điện — vui lòng cấu hình trước</p>
                                ) : null}
                            </div>
                        ) : (
                            <div className="an-field">
                                <label className="an-label">Số tiền (VND) *</label>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <input className="an-input" type="number" min="0" placeholder="VD: 500000" value={bill.amount} onChange={e => setBill(p => ({ ...p, amount: e.target.value }))} />
                                    {bill.type === "violation_fine" && prices.violation_fine_rate && (
                                        <button type="button" onClick={() => setBill(p => ({ ...p, amount: prices.violation_fine_rate }))} style={{ whiteSpace: "nowrap", fontSize: 11, padding: "5px 10px", background: "#ef444415", border: "1px solid #ef444430", borderRadius: 6, cursor: "pointer", color: "#ef4444" }}>
                                            = {fmtMoney(prices.violation_fine_rate)}
                                        </button>
                                    )}
                                </div>
                                {bill.type === "damage_compensation" && (
                                    <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>💡 Bồi thường thiệt hại — nhập số tiền cụ thể theo mức độ thiệt hại thực tế</p>
                                )}
                            </div>
                        )}

                        <div className="an-field">
                            <label className="an-label">Mô tả</label>
                            <textarea className="an-textarea" rows={2} placeholder="Lý do / chi tiết..." value={bill.description} onChange={e => setBill(p => ({ ...p, description: e.target.value }))} />
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                            <div className="an-field" style={{ flex: 1 }}>
                                <label className="an-label">Hạn thanh toán *</label>
                                <input className="an-input" type="date" value={bill.dueDate} min={new Date().toISOString().slice(0, 10)} onChange={e => setBill(p => ({ ...p, dueDate: e.target.value }))} />
                            </div>
                            <div className="an-field" style={{ flex: 1 }}>
                                <label className="an-label">Kỳ học</label>
                                <input className="an-input" placeholder="VD: 2024-1" value={bill.termCode} onChange={e => setBill(p => ({ ...p, termCode: e.target.value }))} />
                            </div>
                        </div>

                        <button onClick={handleSendBill} disabled={billSending} className="an-btn-send" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
                            {billSending ? <><span className="an-spinner" /> Đang tạo...</> : "💻 Tạo & gửi hóa đơn"}
                        </button>
                    </section>

                    <section className="ad-surface-panel">
                        <div className="ad-surface-head">
                            <div>
                                <h3 className="ad-surface-title">Sinh viên còn nợ ({debtors.length})</h3>
                                <p className="ad-surface-text">Chọn nhanh một sinh viên còn nợ để tạo bill mới hoặc tiếp tục xử lý công nợ.</p>
                            </div>
                        </div>

                        {debtorLoading ? (
                            <div className="ad-empty-inline"><div className="ab-spinner" />Đang tải danh sách công nợ...</div>
                        ) : debtors.length === 0 ? (
                            <div className="ad-empty-inline">🎉 Không có sinh viên nào còn nợ!</div>
                        ) : (
                            <div className="ad-side-scroll">
                                <div className="ad-kv-list" style={{ marginBottom: 16 }}>
                                    <div className="ad-kv-row"><span className="ad-kv-label">Tổng nợ đang theo dõi</span><strong className="ad-kv-value">{fmtMoney(totalDebt)}</strong></div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {debtors.map(d => (
                                        <div
                                            key={d.studentId}
                                            onClick={() => d.student && setBill(p => ({ ...p, selectedStudent: d.student, studentSearch: "", type: "violation_fine" }))}
                                            style={{ padding: "12px 14px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "border-color .15s" }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = "#e8540a50"}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                                        >
                                            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#ef4444", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
                                                {d.student?.fullName?.[0] || "?"}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.student?.fullName}</div>
                                                <div style={{ fontSize: 11, color: "#888" }}>MSSV: {d.student?.studentCode}</div>
                                            </div>
                                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 800, color: "#ef4444" }}>{fmtMoney(d.totalDebt)}</div>
                                                <div style={{ fontSize: 10, color: "#94a3b8" }}>{d.invoiceCount} hóa đơn</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}

export default SettingsPanel;
