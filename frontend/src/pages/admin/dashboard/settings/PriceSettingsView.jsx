import { PRICE_CONFIG, fmtSettingsNumber } from "./constants";

function PriceSettingsView({
    billTermCode,
    onPriceChange,
    onSavePrices,
    onToggleReg,
    priceAlert,
    priceLoading,
    priceSaving,
    prices,
    regOpen,
    regToggling,
}) {
    return (
        <div className="ad-split-layout">
            <section className="ad-surface-panel">
                <div className="ad-surface-head">
                    <div>
                        <h3 className="ad-surface-title">Cấu hình giá & trạng thái đăng ký</h3>
                        <p className="ad-surface-text">Cập nhật các mức phí chính và bật/tắt quyền đăng ký phòng của sinh viên.</p>
                    </div>
                </div>

                {priceAlert.msg && (
                    <div className={`an-alert ${priceAlert.type} ad-inline-alert`}>
                        {priceAlert.msg}
                    </div>
                )}

                {priceLoading ? (
                    <div className="ad-empty-inline"><div className="ab-spinner" />Đang tải cấu hình giá...</div>
                ) : (
                    <div className="ad-settings-price-stack">
                        <div className={`ad-settings-toggle-card ${regOpen ? "open" : "closed"}`}>
                            <span className="ad-settings-toggle-icon">{regOpen ? "Đang mở" : "Đang khóa"}</span>
                            <div className="ad-settings-toggle-copy">
                                <div className="ad-settings-toggle-title">Cho phép sinh viên đăng ký phòng</div>
                                <div className="ad-settings-toggle-meta">
                                    {regOpen ? "Sinh viên có thể gửi đơn đăng ký" : "Sinh viên tạm thời không thể đăng ký phòng"}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onToggleReg}
                                disabled={regToggling}
                                className={`ad-settings-toggle-btn ${regOpen ? "danger" : "success"}`}
                            >
                                {regToggling ? "Đang cập nhật..." : regOpen ? "Tắt" : "Bật"}
                            </button>
                        </div>

                        {PRICE_CONFIG.map((config) => (
                            <div key={config.key} className="ad-settings-price-card" style={{ "--ad-price-color": config.color }}>
                                <div className="ad-settings-price-copy">
                                    <div className="ad-settings-price-title">{config.label}</div>
                                    <div className="ad-settings-price-unit">({config.unit})</div>
                                </div>
                                <div className="ad-settings-price-input-wrap">
                                    <input
                                        type="number"
                                        min="0"
                                        value={prices[config.key] ?? ""}
                                        onChange={(event) => onPriceChange(config.key, event.target.value)}
                                        className="ad-settings-price-input"
                                    />
                                    <span className="ad-settings-price-suffix">{config.suffix || "đ"}</span>
                                </div>
                            </div>
                        ))}

                        <div className="ad-settings-actions">
                            <button type="button" onClick={onSavePrices} disabled={priceSaving} className="an-btn-send">
                                {priceSaving ? <><span className="an-spinner" /> Đang lưu...</> : "Lưu cài đặt"}
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
                    {PRICE_CONFIG.map((config) => (
                        <div key={config.key} className="ad-kv-row">
                            <span className="ad-kv-label">{config.label}</span>
                            <strong className="ad-kv-value">
                                {prices[config.key] !== undefined && prices[config.key] !== ""
                                    ? `${fmtSettingsNumber(prices[config.key])}${config.suffix}`
                                    : "Chưa cấu hình"}
                            </strong>
                        </div>
                    ))}
                </div>
                <div className="ad-side-divider" />
                <div className="ad-kv-list">
                    <div className="ad-kv-row"><span className="ad-kv-label">Đăng ký phòng</span><strong className="ad-kv-value">{regOpen ? "Đang mở" : "Đang khóa"}</strong></div>
                    <div className="ad-kv-row"><span className="ad-kv-label">Kỳ bill mặc định</span><strong className="ad-kv-value">{billTermCode}</strong></div>
                </div>
            </aside>
        </div>
    );
}

export default PriceSettingsView;
