import { fmtSettingsMoney } from "./constants";

function DebtorsList({ debtorLoading, debtors, onSelectDebtor, totalDebt }) {
    return (
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
                <div className="ad-empty-inline">Hiện không có sinh viên nào còn nợ.</div>
            ) : (
                <div className="ad-side-scroll">
                    <div className="ad-kv-list ad-kv-list-spaced">
                        <div className="ad-kv-row"><span className="ad-kv-label">Tổng nợ đang theo dõi</span><strong className="ad-kv-value">{fmtSettingsMoney(totalDebt)}</strong></div>
                    </div>
                    <div className="ad-debtor-list">
                        {debtors.map((debtor) => (
                            <button
                                key={debtor.studentId}
                                type="button"
                                className="ad-debtor-card"
                                onClick={() => debtor.student && onSelectDebtor(debtor.student)}
                            >
                                <div className="ad-debtor-avatar">
                                    {debtor.student?.fullName?.[0] || "?"}
                                </div>
                                <div className="ad-debtor-copy">
                                    <div className="ad-debtor-title">{debtor.student?.fullName}</div>
                                    <div className="ad-debtor-meta">MSSV: {debtor.student?.studentCode}</div>
                                </div>
                                <div className="ad-debtor-amount-wrap">
                                    <div className="ad-debtor-amount">{fmtSettingsMoney(debtor.totalDebt)}</div>
                                    <div className="ad-debtor-count">{debtor.invoiceCount} hóa đơn</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

export default DebtorsList;
