import {
    INVOICE_TYPE_OPTIONS,
    calculateElectricityPreview,
    fmtSettingsMoney,
} from "./constants";

function SelectedStudentCard({ student, onClear }) {
    return (
        <div className="ad-selected-card">
            <div className="ad-selected-avatar">
                {student.fullName?.[0] || "S"}
            </div>
            <div className="ad-selected-copy">
                <div className="ad-selected-title">{student.fullName}</div>
                <div className="ad-selected-meta">MSSV: {student.studentCode}</div>
            </div>
            <button type="button" className="ad-selected-remove" onClick={onClear}>×</button>
        </div>
    );
}

function StudentSearch({
    bill,
    studentResults,
    studentSearching,
    onBillChange,
    onSelectStudent,
}) {
    return (
        <div className="ad-search-shell">
            <input
                className="an-input"
                placeholder="Tìm theo tên hoặc mã sinh viên..."
                value={bill.studentSearch}
                onChange={(event) => onBillChange("studentSearch", event.target.value)}
            />
            {studentSearching && <span className="ad-search-indicator">Đang tìm...</span>}
            {studentResults.length > 0 && (
                <div className="ad-search-results ad-search-results-compact">
                    {studentResults.map((student) => (
                        <button
                            key={student._id}
                            type="button"
                            className="ad-search-result ad-search-result-column"
                            onClick={() => onSelectStudent(student)}
                        >
                            <span className="ad-search-title">{student.fullName}</span>
                            <span className="ad-search-meta">
                                MSSV: {student.studentCode} {!student.currentRoomId ? "• Chưa có phòng" : ""}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function ElectricityAmountPreview({ bill, prices }) {
    if (!(bill.excessKwh > 0)) return null;
    if (!prices.electricity_excess_rate) {
        return <p className="ad-inline-note danger">Chưa cài đặt giá điện. Vui lòng cấu hình trước khi tạo bill.</p>;
    }

    const { total, occupants, perPerson } = calculateElectricityPreview(bill, prices);

    return (
        <div className="ad-bill-preview-card">
            <div className="ad-bill-preview-row">
                <span className="ad-bill-preview-meta">{bill.excessKwh} kWh × {fmtSettingsMoney(prices.electricity_excess_rate)}/kWh</span>
                <span className="ad-bill-preview-total">{fmtSettingsMoney(total)}</span>
            </div>
            {occupants > 1 && (
                <div className="ad-bill-preview-row split">
                    <span className="ad-bill-preview-success">Chia cho {occupants} người trong phòng</span>
                    <span className="ad-bill-preview-per">{fmtSettingsMoney(perPerson)}/người</span>
                </div>
            )}
        </div>
    );
}

function MoneyAmountField({ bill, onBillChange, prices }) {
    return (
        <div className="an-field">
            <label className="an-label">Số tiền (VND) *</label>
            <div className="ad-inline-row">
                <input
                    className="an-input"
                    type="number"
                    min="0"
                    placeholder="VD: 500000"
                    value={bill.amount}
                    onChange={(event) => onBillChange("amount", event.target.value)}
                />
                {bill.type === "violation_fine" && prices.violation_fine_rate && (
                    <button
                        type="button"
                        className="ad-inline-pill danger"
                        onClick={() => onBillChange("amount", prices.violation_fine_rate)}
                    >
                        = {fmtSettingsMoney(prices.violation_fine_rate)}
                    </button>
                )}
            </div>
            {bill.type === "damage_compensation" && (
                <p className="ad-inline-note">Bồi thường thiệt hại: nhập số tiền thực tế tương ứng với mức độ hư hỏng.</p>
            )}
        </div>
    );
}

function BillComposer({
    bill,
    billAlert,
    billSending,
    onBillChange,
    onClearSelectedStudent,
    onSelectStudent,
    onSendBill,
    prices,
    studentResults,
    studentSearching,
}) {
    return (
        <section className="ad-surface-panel">
            <div className="ad-surface-head">
                <div>
                    <h3 className="ad-surface-title">Tạo hóa đơn mới</h3>
                    <p className="ad-surface-text">Chọn sinh viên, loại hóa đơn và kỳ hạn thanh toán trước khi phát hành bill.</p>
                </div>
            </div>

            {billAlert.msg && (
                <div className={`an-alert ${billAlert.type} ad-inline-alert ad-inline-alert-sm`}>
                    {billAlert.msg}
                </div>
            )}

            <div className="an-field">
                <label className="an-label">Sinh viên *</label>
                {bill.selectedStudent ? (
                    <SelectedStudentCard student={bill.selectedStudent} onClear={onClearSelectedStudent} />
                ) : (
                    <StudentSearch
                        bill={bill}
                        studentResults={studentResults}
                        studentSearching={studentSearching}
                        onBillChange={onBillChange}
                        onSelectStudent={onSelectStudent}
                    />
                )}
            </div>

            <div className="an-field">
                <label className="an-label">Loại hóa đơn *</label>
                <select className="an-select" value={bill.type} onChange={(event) => onBillChange("type", event.target.value)}>
                    {INVOICE_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>

            {bill.type === "electricity" ? (
                <div className="an-field">
                    <label className="an-label">Số kWh vượt mức *</label>
                    <div className="ad-inline-row">
                        <input
                            className="an-input ad-inline-input"
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="VD: 15"
                            value={bill.excessKwh}
                            onChange={(event) => onBillChange("excessKwh", event.target.value)}
                        />
                        <span className="ad-inline-suffix">kWh</span>
                    </div>
                    <ElectricityAmountPreview bill={bill} prices={prices} />
                </div>
            ) : (
                <MoneyAmountField bill={bill} onBillChange={onBillChange} prices={prices} />
            )}

            <div className="an-field">
                <label className="an-label">Mô tả</label>
                <textarea
                    className="an-textarea"
                    rows={2}
                    placeholder="Lý do hoặc ghi chú chi tiết..."
                    value={bill.description}
                    onChange={(event) => onBillChange("description", event.target.value)}
                />
            </div>

            <div className="ad-form-split">
                <div className="an-field ad-form-grow">
                    <label className="an-label">Hạn thanh toán *</label>
                    <input
                        className="an-input"
                        type="date"
                        value={bill.dueDate}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(event) => onBillChange("dueDate", event.target.value)}
                    />
                </div>
                <div className="an-field ad-form-grow">
                    <label className="an-label">Kỳ học</label>
                    <input
                        className="an-input"
                        placeholder="VD: 2024-1"
                        value={bill.termCode}
                        onChange={(event) => onBillChange("termCode", event.target.value)}
                    />
                </div>
            </div>

            <button type="button" onClick={onSendBill} disabled={billSending} className="an-btn-send ad-full-width-btn">
                {billSending ? <><span className="an-spinner" /> Đang tạo...</> : "Tạo và gửi hóa đơn"}
            </button>
        </section>
    );
}

export default BillComposer;
