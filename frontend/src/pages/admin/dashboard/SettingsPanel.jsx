import { useCallback, useEffect, useState } from "react";
import api from "../../../services/api";
import { StatCard } from "./cards";
import BillComposer from "./settings/BillComposer";
import DebtorsList from "./settings/DebtorsList";
import PriceSettingsView from "./settings/PriceSettingsView";
import { PRICE_CONFIG, createInitialBill, fmtSettingsMoney } from "./settings/constants";

function SettingsPanel() {
    const [activeTab, setActiveTab] = useState("prices");
    const [prices, setPrices] = useState({});
    const [priceLoading, setPriceLoading] = useState(true);
    const [priceSaving, setPriceSaving] = useState(false);
    const [priceAlert, setPriceAlert] = useState({ type: "", msg: "" });
    const showPriceAlert = (type, msg) => {
        setPriceAlert({ type, msg });
        setTimeout(() => setPriceAlert({ type: "", msg: "" }), 4000);
    };

    const [regOpen, setRegOpen] = useState(true);
    const [regToggling, setRegToggling] = useState(false);
    const handleToggleReg = async () => {
        setRegToggling(true);
        try {
            await api.put("/settings/registration-open", { isOpen: !regOpen });
            setRegOpen((prev) => !prev);
            showPriceAlert("success", !regOpen ? "Đã mở đăng ký phòng!" : "Đã tắt đăng ký phòng!");
        } catch {
            showPriceAlert("error", "Không thể thay đổi trạng thái");
        } finally {
            setRegToggling(false);
        }
    };

    const [bill, setBill] = useState(() => createInitialBill());
    const [studentResults, setStudentResults] = useState([]);
    const [studentSearching, setStudentSearching] = useState(false);
    const [billSending, setBillSending] = useState(false);
    const [billAlert, setBillAlert] = useState({ type: "", msg: "" });
    const showBillAlert = (type, msg) => {
        setBillAlert({ type, msg });
        setTimeout(() => setBillAlert({ type: "", msg: "" }), 5000);
    };

    const [debtors, setDebtors] = useState([]);
    const [debtorLoading, setDebtorLoading] = useState(false);

    useEffect(() => {
        api.get("/settings/prices")
            .then((response) => {
                const data = response.data.data;
                const flat = {};
                for (const key of Object.keys(data)) flat[key] = data[key].value;
                setPrices(flat);
            })
            .catch(() => showPriceAlert("error", "Không thể tải cài đặt giá"))
            .finally(() => setPriceLoading(false));

        api.get("/settings/registration-open")
            .then((response) => setRegOpen(response.data.data.isOpen))
            .catch(() => { });
    }, []);

    const loadDebtors = useCallback(async () => {
        setDebtorLoading(true);
        try {
            const response = await api.get("/invoices/debtors");
            setDebtors(response.data.data || []);
        } catch {
            setDebtors([]);
        } finally {
            setDebtorLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab !== "bill") return;
        loadDebtors();
    }, [activeTab, loadDebtors]);

    useEffect(() => {
        if (!bill.studentSearch.trim()) {
            setStudentResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setStudentSearching(true);
            try {
                const response = await api.get("/invoices/search-students", { params: { q: bill.studentSearch } });
                setStudentResults(response.data.data || []);
            } catch {
                setStudentResults([]);
            } finally {
                setStudentSearching(false);
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [bill.studentSearch]);

    const handlePriceChange = (key, value) => {
        setPrices((prev) => ({ ...prev, [key]: value }));
    };

    const handleBillChange = (field, value) => {
        setBill((prev) => ({ ...prev, [field]: value }));
    };

    const resetBillComposer = useCallback(() => {
        setBill(createInitialBill());
        setStudentResults([]);
    }, []);

    const handleSelectStudent = (student) => {
        setBill((prev) => ({ ...prev, selectedStudent: student, studentSearch: "" }));
        setStudentResults([]);
    };

    const handleSelectDebtor = (student) => {
        setBill((prev) => ({ ...prev, selectedStudent: student, studentSearch: "", type: "violation_fine" }));
    };

    const handleClearSelectedStudent = () => {
        setBill((prev) => ({ ...prev, selectedStudent: null, studentSearch: "" }));
    };

    const handleSavePrices = async () => {
        setPriceSaving(true);
        try {
            await api.put("/settings/prices", prices);
            showPriceAlert("success", "Cập nhật giá thành công!");
        } catch {
            showPriceAlert("error", "Lưu thất bại");
        } finally {
            setPriceSaving(false);
        }
    };

    const handleSendBill = async () => {
        if (!bill.selectedStudent) {
            showBillAlert("error", "Vui lòng chọn sinh viên");
            return;
        }
        if (!bill.dueDate) {
            showBillAlert("error", "Vui lòng chọn hạn thanh toán");
            return;
        }

        let finalAmount;
        if (bill.type === "electricity") {
            if (!bill.excessKwh || Number(bill.excessKwh) <= 0) {
                showBillAlert("error", "Vui lòng nhập số kWh vượt mức hợp lệ");
                return;
            }
            if (!prices.electricity_excess_rate) {
                showBillAlert("error", "Chưa có giá điện trong cài đặt");
                return;
            }
            const totalElectricity = Number(bill.excessKwh) * Number(prices.electricity_excess_rate);
            const occupants = bill.selectedStudent?.currentRoomId?.currentOccupancy || 1;
            finalAmount = Math.ceil(totalElectricity / occupants);
        } else {
            if (!bill.amount || Number(bill.amount) <= 0) {
                showBillAlert("error", "Số tiền phải lớn hơn 0");
                return;
            }
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
                        ? `Điện vượt mức: ${bill.excessKwh} kWh × ${fmtSettingsMoney(prices.electricity_excess_rate)}/kWh ÷ ${occupants} người = ${fmtSettingsMoney(finalAmount)}/người`
                        : ""
                ),
                dueDate: bill.dueDate,
                termCode: bill.termCode,
            });
            showBillAlert("success", data.message || "Tạo hóa đơn thành công!");
            resetBillComposer();
            await loadDebtors();
        } catch (error) {
            showBillAlert("error", error.response?.data?.message || "Tạo hóa đơn thất bại");
        } finally {
            setBillSending(false);
        }
    };

    const configuredPrices = PRICE_CONFIG.filter((config) => prices[config.key] !== undefined && prices[config.key] !== "").length;
    const debtorCount = debtors.length;
    const totalDebt = debtors.reduce((sum, item) => sum + Number(item.totalDebt || 0), 0);
    const selectedStudentLabel = bill.selectedStudent?.fullName || "Chưa chọn sinh viên";

    return (
        <div className="ad-panel-stack">
            <section className="ad-section-hero ad-section-hero-settings">
                <div className="ad-section-copy">
                    <span className="ad-section-eyebrow">Billing Control Center</span>
                    <h2 className="ad-section-title">Cài đặt & gửi bill</h2>
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
                <StatCard icon="🚪" label="Đăng ký phòng" value={regOpen ? "Mở" : "Khóa"} meta="Trạng thái vận hành hiện tại" color={regOpen ? "#16a34a" : "#dc2626"} loading={false} />
                <StatCard icon="📄" label="Sinh viên còn nợ" value={debtorCount} meta={fmtSettingsMoney(totalDebt)} color="#e8540a" loading={activeTab === "bill" && debtorLoading} />
                <StatCard icon="🎯" label="Đối tượng bill" value={selectedStudentLabel} meta={`Kỳ học mặc định: ${bill.termCode}`} color="#2563eb" loading={false} />
            </div>

            <div className="ad-toolbar-shell">
                <div className="ad-toolbar-copy">
                    <h3 className="ad-toolbar-title">Điều hướng cài đặt và thanh toán</h3>
                    <p className="ad-toolbar-text">Tách rõ luồng cấu hình giá và luồng phát hành hóa đơn để admin thao tác chính xác hơn.</p>
                </div>
                <div className="ad-toolbar-controls">
                    <div className="an-tabs" style={{ marginBottom: 0 }}>
                        <button className={`an-tab ${activeTab === "prices" ? "active" : ""}`} onClick={() => setActiveTab("prices")}>Cài đặt giá</button>
                        <button className={`an-tab ${activeTab === "bill" ? "active" : ""}`} onClick={() => setActiveTab("bill")}>Gửi bill thanh toán</button>
                    </div>
                </div>
            </div>

            {activeTab === "prices" && (
                <PriceSettingsView
                    billTermCode={bill.termCode}
                    onPriceChange={handlePriceChange}
                    onSavePrices={handleSavePrices}
                    onToggleReg={handleToggleReg}
                    priceAlert={priceAlert}
                    priceLoading={priceLoading}
                    priceSaving={priceSaving}
                    prices={prices}
                    regOpen={regOpen}
                    regToggling={regToggling}
                />
            )}

            {activeTab === "bill" && (
                <div className="ad-split-layout">
                    <BillComposer
                        bill={bill}
                        billAlert={billAlert}
                        billSending={billSending}
                        onBillChange={handleBillChange}
                        onClearSelectedStudent={handleClearSelectedStudent}
                        onSelectStudent={handleSelectStudent}
                        onSendBill={handleSendBill}
                        prices={prices}
                        studentResults={studentResults}
                        studentSearching={studentSearching}
                    />

                    <DebtorsList
                        debtorLoading={debtorLoading}
                        debtors={debtors}
                        onSelectDebtor={handleSelectDebtor}
                        totalDebt={totalDebt}
                    />
                </div>
            )}
        </div>
    );
}

export default SettingsPanel;
