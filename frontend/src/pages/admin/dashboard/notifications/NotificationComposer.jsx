import {
    NOTIFICATION_SEARCH_ROLE_OPTIONS,
    NOTIFICATION_TYPE_ICONS,
    NOTIFICATION_TYPE_OPTIONS,
    formatNotificationDate,
} from "./constants";

function RecipientPicker({
    receiverIds,
    searchRole,
    userResults,
    userSearch,
    userSearching,
    onRemoveReceiver,
    onSearchRoleChange,
    onSelectReceiver,
    onUserSearchChange,
}) {
    return (
        <div className="ad-recipient-stack">
            <div className="ad-search-row">
                <select className="an-select" value={searchRole} onChange={onSearchRoleChange}>
                    {NOTIFICATION_SEARCH_ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>

            <div className="ad-search-shell">
                <input
                    className="an-input"
                    placeholder="🔍 Tìm username hoặc email..."
                    value={userSearch}
                    onChange={(e) => onUserSearchChange(e.target.value)}
                />
                {userSearching && <span className="ad-search-indicator">Đang tìm...</span>}
                {userResults.length > 0 && (
                    <div className="ad-search-results">
                        {userResults.map((user) => {
                            const isSelected = receiverIds.some((item) => item._id === user._id);
                            return (
                                <button
                                    key={user._id}
                                    type="button"
                                    className="ad-search-result"
                                    onClick={() => onSelectReceiver(user)}
                                >
                                    <div className="ad-search-avatar">
                                        {user.username?.[0]?.toUpperCase() || "U"}
                                    </div>
                                    <div className="ad-search-copy">
                                        <div className="ad-search-title">{user.username}</div>
                                        <div className="ad-search-meta">{user.email}</div>
                                    </div>
                                    {isSelected && <span className="ad-search-check">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {receiverIds.length > 0 ? (
                <div className="ad-chip-list">
                    {receiverIds.map((user) => (
                        <span key={user._id} className="ad-chip">
                            <span>👤 {user.username}</span>
                            <button
                                type="button"
                                className="ad-chip-remove"
                                onClick={() => onRemoveReceiver(user._id)}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            ) : (
                <p className="ad-inline-note warning">⚠️ Chưa chọn người nhận nào</p>
            )}
        </div>
    );
}

function ComposerSummary({ latestSent, loadingList, audienceLabel, selectedTypeLabel, form, sentCount }) {
    return (
        <aside className="ad-surface-panel">
            <div className="ad-surface-head">
                <div>
                    <h3 className="ad-surface-title">Tóm tắt phiên gửi</h3>
                    <p className="ad-surface-text">Kiểm tra nhanh đối tượng nhận và nhịp gửi gần đây trước khi phát hành.</p>
                </div>
            </div>
            <div className="ad-kv-list">
                <div className="ad-kv-row"><span className="ad-kv-label">Loại thông báo</span><strong className="ad-kv-value">{selectedTypeLabel}</strong></div>
                <div className="ad-kv-row"><span className="ad-kv-label">Đối tượng</span><strong className="ad-kv-value">{audienceLabel}</strong></div>
                <div className="ad-kv-row"><span className="ad-kv-label">Độ dài nội dung</span><strong className="ad-kv-value">{form.message.length} ký tự</strong></div>
                <div className="ad-kv-row"><span className="ad-kv-label">Tổng lịch sử</span><strong className="ad-kv-value">{sentCount} bản ghi</strong></div>
            </div>
            <div className="ad-side-divider" />
            <div className="ad-surface-head ad-surface-head-tight">
                <div>
                    <h3 className="ad-surface-title">Gần đây nhất</h3>
                    <p className="ad-surface-text">4 thông báo mới nhất để bạn kiểm tra giọng điệu và nhịp gửi.</p>
                </div>
            </div>
            {loadingList ? (
                <div className="ad-empty-inline">Đang tải lịch sử...</div>
            ) : latestSent.length === 0 ? (
                <div className="ad-empty-inline">Chưa có thông báo nào được gửi.</div>
            ) : (
                <div className="ad-mini-list">
                    {latestSent.map((item) => (
                        <div key={item._id} className="ad-mini-item">
                            <div className="ad-mini-icon">{NOTIFICATION_TYPE_ICONS[item.type] || "📢"}</div>
                            <div className="ad-mini-copy">
                                <div className="ad-mini-title">{item.title}</div>
                                <div className="ad-mini-meta">
                                    {formatNotificationDate(item.createdAt)} · {item.receiverIds?.length || 0} người nhận
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </aside>
    );
}

function NotificationComposer({
    audienceLabel,
    form,
    latestSent,
    loadingList,
    onFieldChange,
    onReceiverTypeChange,
    onRemoveReceiver,
    onReset,
    onSearchRoleChange,
    onSelectReceiver,
    onSubmit,
    onUserSearchChange,
    receiverIds,
    searchRole,
    selectedTypeLabel,
    sending,
    sentCount,
    userResults,
    userSearch,
    userSearching,
}) {
    return (
        <div className="ad-split-layout">
            <section className="ad-surface-panel">
                <div className="ad-surface-head">
                    <div>
                        <h3 className="ad-surface-title">Soạn thông báo mới</h3>
                        <p className="ad-surface-text">Chọn loại thông báo, đối tượng nhận và xem trước trước khi phát hành.</p>
                    </div>
                </div>
                <div className="an-send-panel ad-neutral-width">
                    <form className="an-form ad-flat-form" onSubmit={onSubmit}>
                        <div className="an-field">
                            <label className="an-label">Loại thông báo</label>
                            <div className="an-type-grid">
                                {NOTIFICATION_TYPE_OPTIONS.map((item) => (
                                    <label key={item.value} className={`an-type-card ${form.type === item.value ? "selected" : ""}`}>
                                        <input
                                            type="radio"
                                            name="type"
                                            value={item.value}
                                            checked={form.type === item.value}
                                            onChange={onFieldChange}
                                        />
                                        {item.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="an-field">
                            <label className="an-label">Gửi đến</label>
                            <div className="an-receiver-row">
                                <select
                                    name="receiverType"
                                    value={form.receiverType}
                                    onChange={onReceiverTypeChange}
                                    className="an-select"
                                >
                                    <option value="role">Theo nhóm người dùng</option>
                                    <option value="individual">Cá nhân</option>
                                </select>
                                {form.receiverType === "role" && (
                                    <select name="targetRole" value={form.targetRole} onChange={onFieldChange} className="an-select">
                                        <option value="student">🎓 Tất cả sinh viên</option>
                                        <option value="manager">📋 Tất cả quản lý</option>
                                        <option value="all">👥 Tất cả người dùng</option>
                                    </select>
                                )}
                            </div>

                            {form.receiverType === "individual" && (
                                <RecipientPicker
                                    receiverIds={receiverIds}
                                    searchRole={searchRole}
                                    userResults={userResults}
                                    userSearch={userSearch}
                                    userSearching={userSearching}
                                    onRemoveReceiver={onRemoveReceiver}
                                    onSearchRoleChange={onSearchRoleChange}
                                    onSelectReceiver={onSelectReceiver}
                                    onUserSearchChange={onUserSearchChange}
                                />
                            )}

                            <p className="an-receiver-hint">📤 Sẽ gửi tới: <strong>{audienceLabel}</strong></p>
                        </div>

                        <div className="an-field">
                            <label className="an-label">Tiêu đề <span className="req">*</span></label>
                            <input className="an-input" name="title" value={form.title} onChange={onFieldChange} placeholder="Nhập tiêu đề thông báo..." maxLength={120} required />
                            <span className="an-char-count">{form.title.length}/120</span>
                        </div>

                        <div className="an-field">
                            <label className="an-label">Nội dung <span className="req">*</span></label>
                            <textarea className="an-textarea" name="message" value={form.message} onChange={onFieldChange} placeholder="Nhập nội dung thông báo chi tiết..." rows={4} maxLength={1000} required />
                            <span className="an-char-count">{form.message.length}/1000</span>
                        </div>

                        {(form.title || form.message) && (
                            <div className="an-preview">
                                <p className="an-preview-label">👁️ Xem trước</p>
                                <div className="an-preview-card">
                                    <div className="an-preview-icon">{NOTIFICATION_TYPE_ICONS[form.type]}</div>
                                    <div>
                                        <div className="an-preview-title">{form.title || "Tiêu đề..."}</div>
                                        <div className="an-preview-msg">{form.message || "Nội dung..."}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="an-form-actions">
                            <button type="button" className="an-btn-reset" onClick={onReset}>🔄 Đặt lại</button>
                            <button type="submit" className="an-btn-send" disabled={sending}>
                                {sending ? <><span className="an-spinner" /> Đang gửi...</> : "📤 Gửi thông báo"}
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            <ComposerSummary
                audienceLabel={audienceLabel}
                form={form}
                latestSent={latestSent}
                loadingList={loadingList}
                selectedTypeLabel={selectedTypeLabel}
                sentCount={sentCount}
            />
        </div>
    );
}

export default NotificationComposer;
