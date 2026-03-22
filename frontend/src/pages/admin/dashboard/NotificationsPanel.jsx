import { useCallback, useEffect, useState } from "react";
import api from "../../../services/api";
import { StatCard } from "./shared";

const AN_TYPE_OPTIONS = [
    { value: "general", label: "📢 Thông báo chung" },
    { value: "payment_reminder", label: "💳 Nhắc thanh toán" },
    { value: "maintenance", label: "🔧 Bảo trì" },
    { value: "announcement", label: "📣 Quan trọng" },
];

const AN_TYPE_ICONS = { general: "📢", payment_reminder: "💳", maintenance: "🔧", announcement: "📣" };

function formatDate(d) {
    return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const AN_INIT_FORM = { title: "", message: "", type: "general", receiverType: "role", targetRole: "student", receiverIds: [] };

/* Finance Panel */

function NotificationsPanel() {
    const [form, setForm] = useState(AN_INIT_FORM);
    const [sending, setSending] = useState(false);
    const [alert, setAlert] = useState({ type: "", msg: "" });
    const [sentList, setSentList] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [activeTab, setActiveTab] = useState("send");
    const [searchRole, setSearchRole] = useState("student");
    const [userSearch, setUserSearch] = useState("");
    const [userResults, setUserResults] = useState([]);
    const [userSearching, setUserSearching] = useState(false);
    const [receiverIds, setReceiverIds] = useState([]);

    const showAlert = (type, msg) => {
        setAlert({ type, msg });
        setTimeout(() => setAlert({ type: "", msg: "" }), 4000);
    };

    useEffect(() => {
        if (!userSearch.trim()) { setUserResults([]); return; }
        const timer = setTimeout(async () => {
            setUserSearching(true);
            try {
                const { data } = await api.get("/users", { params: { role: searchRole, search: userSearch } });
                setUserResults(data.users || []);
            } catch { setUserResults([]); }
            finally { setUserSearching(false); }
        }, 300);
        return () => clearTimeout(timer);
    }, [userSearch, searchRole]);

    const loadSentList = useCallback(async () => {
        setLoadingList(true);
        try {
            const { data } = await api.get("/notifications/sent?limit=30");
            setSentList(data.data || []);
        } catch { } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => { loadSentList(); }, [loadSentList]);

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSend = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.message.trim()) {
            showAlert("error", "Vui lòng điền đầy đủ tiêu đề và nội dung");
            return;
        }
        if (form.receiverType === "individual" && receiverIds.length === 0) {
            showAlert("error", "Vui lòng chọn ít nhất một người nhận");
            return;
        }
        setSending(true);
        try {
            const payload = { ...form, receiverIds: receiverIds.map(u => u._id) };
            const { data } = await api.post("/notifications/send", payload);
            showAlert("success", data.message || "Gửi thông báo thành công!");
            setForm(AN_INIT_FORM);
            setReceiverIds([]);
            setUserSearch("");
            setUserResults([]);
            loadSentList();
            setActiveTab("history");
        } catch (err) {
            showAlert("error", err.response?.data?.message || "Gửi thất bại");
        } finally {
            setSending(false);
        }
    };

    const totalRecipientsSent = sentList.reduce((sum, item) => sum + (item.receiverIds?.length || 0), 0);
    const totalRead = sentList.reduce((sum, item) => sum + (item.readBy?.length || 0), 0);
    const importantCount = sentList.filter((item) => item.type === "announcement").length;
    const audienceLabel = form.receiverType === "role"
        ? (form.targetRole === "all" ? "Tất cả người dùng" : form.targetRole === "student" ? "Tất cả sinh viên" : "Tất cả quản lý")
        : receiverIds.length > 0 ? `${receiverIds.length} người đã chọn` : "Chưa chọn người nhận";
    const latestSent = sentList.slice(0, 4);

    return (
        <div className="ad-panel-stack">
            <section className="ad-section-hero ad-section-hero-notifications">
                <div className="ad-section-copy">
                    <span className="ad-section-eyebrow">Communication Center</span>
                    <h2 className="ad-section-title">🔔 Gửi thông báo</h2>
                    <p className="ad-section-subtitle">
                        Tập trung soạn, phát hành và theo dõi lịch sử gửi thông báo trong cùng một màn hình quản trị rõ ràng, nhất quán và dễ kiểm soát.
                    </p>
                    <div className="ad-section-pills">
                        <span className="ad-section-pill neutral">Tab hiện tại: {activeTab === "send" ? "Soạn thông báo" : "Lịch sử gửi"}</span>
                        <span className="ad-section-pill neutral">Đối tượng hiện tại: {audienceLabel}</span>
                        <span className={`ad-section-pill ${importantCount > 0 ? "danger" : "success"}`}>
                            {importantCount > 0 ? `${importantCount} thông báo quan trọng đã gửi` : "Chưa có thông báo quan trọng"}
                        </span>
                    </div>
                </div>
                <div className="ad-section-actions">
                    <button type="button" className={`ad-hero-btn ${activeTab === "send" ? "primary" : ""}`} onClick={() => setActiveTab("send")}>Soạn mới</button>
                    <button type="button" className={`ad-hero-btn ${activeTab === "history" ? "primary" : ""}`} onClick={() => setActiveTab("history")}>Lịch sử gửi</button>
                    <button type="button" className="ad-hero-btn" onClick={loadSentList}>Làm mới lịch sử</button>
                </div>
            </section>

            {alert.msg && (
                <div className={`an-alert ${alert.type}`} style={{ marginBottom: 0 }}>
                    {alert.type === "success" ? "✓" : "⚠️"} {alert.msg}
                </div>
            )}

            <div className="ad-stats-grid">
                <StatCard icon="🗂️" label="Lịch sử gửi" value={sentList.length} meta="30 thông báo gần nhất" color="#e8540a" loading={loadingList && sentList.length === 0} />
                <StatCard icon="👥" label="Người nhận" value={totalRecipientsSent} meta="Tổng số người đã nhận" color="#2563eb" loading={loadingList && sentList.length === 0} />
                <StatCard icon="✅" label="Đã đọc" value={totalRead} meta="Lượt đọc ghi nhận được" color="#16a34a" loading={loadingList && sentList.length === 0} />
                <StatCard icon="📣" label="Quan trọng" value={importantCount} meta="Thông báo cần chú ý cao" color="#d97706" loading={loadingList && sentList.length === 0} />
            </div>

            <div className="ad-toolbar-shell">
                <div className="ad-toolbar-copy">
                    <h3 className="ad-toolbar-title">Chuyển luồng làm việc</h3>
                    <p className="ad-toolbar-text">Đi từ soạn nội dung sang lịch sử gửi mà không rời khỏi ngữ cảnh quản trị thông báo.</p>
                </div>
                <div className="ad-toolbar-controls">
                    <div className="an-tabs" style={{ marginBottom: 0 }}>
                        <button className={`an-tab ${activeTab === "send" ? "active" : ""}`} onClick={() => setActiveTab("send")}>✉️ Soạn thông báo</button>
                        <button className={`an-tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>📋 Lịch sử gửi {sentList.length > 0 && <span className="an-tab-count">{sentList.length}</span>}</button>
                    </div>
                </div>
            </div>

            {activeTab === "send" && (
                <div className="ad-split-layout">
                    <section className="ad-surface-panel">
                        <div className="ad-surface-head">
                            <div>
                                <h3 className="ad-surface-title">Soạn thông báo mới</h3>
                                <p className="ad-surface-text">Chọn loại thông báo, đối tượng nhận và xem trước trước khi phát hành.</p>
                            </div>
                        </div>
                        <div className="an-send-panel ad-neutral-width">
                            <form className="an-form ad-flat-form" onSubmit={handleSend}>
                                <div className="an-field">
                                    <label className="an-label">Loại thông báo</label>
                                    <div className="an-type-grid">
                                        {AN_TYPE_OPTIONS.map((t) => (
                                            <label key={t.value} className={`an-type-card ${form.type === t.value ? "selected" : ""}`}>
                                                <input type="radio" name="type" value={t.value} checked={form.type === t.value} onChange={handleChange} />
                                                {t.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="an-field">
                                    <label className="an-label">Gửi đến</label>
                                    <div className="an-receiver-row">
                                        <select name="receiverType" value={form.receiverType} onChange={e => {
                                            handleChange(e);
                                            setReceiverIds([]);
                                            setUserSearch("");
                                            setUserResults([]);
                                        }} className="an-select">
                                            <option value="role">Theo nhóm người dùng</option>
                                            <option value="individual">Cá nhân</option>
                                        </select>
                                        {form.receiverType === "role" && (
                                            <select name="targetRole" value={form.targetRole} onChange={handleChange} className="an-select">
                                                <option value="student">🎓 Tất cả sinh viên</option>
                                                <option value="manager">📋 Tất cả quản lý</option>
                                                <option value="all">👥 Tất cả người dùng</option>
                                            </select>
                                        )}
                                    </div>

                                    {form.receiverType === "individual" && (
                                        <div style={{ marginTop: 10 }}>
                                            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                                <select className="an-select" value={searchRole} onChange={e => { setSearchRole(e.target.value); setUserSearch(""); setUserResults([]); }}>
                                                    <option value="student">🎓 Sinh viên</option>
                                                    <option value="manager">🏢 Quản lý</option>
                                                    <option value="admin">🛡️ Admin</option>
                                                </select>
                                            </div>

                                            <div style={{ position: "relative" }}>
                                                <input
                                                    className="an-input"
                                                    placeholder="🔍 Tìm username hoặc email..."
                                                    value={userSearch}
                                                    onChange={e => setUserSearch(e.target.value)}
                                                />
                                                {userSearching && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#888" }}>Đang tìm...</span>}
                                                {userResults.length > 0 && (
                                                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 8px 24px #0002", zIndex: 100, maxHeight: 220, overflowY: "auto" }}>
                                                        {userResults.map(u => (
                                                            <div
                                                                key={u._id}
                                                                onClick={() => {
                                                                    if (!receiverIds.find(r => r._id === u._id)) {
                                                                        setReceiverIds(prev => [...prev, u]);
                                                                    }
                                                                    setUserSearch("");
                                                                    setUserResults([]);
                                                                }}
                                                                style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}
                                                                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                                                onMouseLeave={e => e.currentTarget.style.background = ""}
                                                            >
                                                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                                                                    {u.username[0].toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{u.username}</div>
                                                                    <div style={{ fontSize: 11, color: "#888" }}>{u.email}</div>
                                                                </div>
                                                                {receiverIds.find(r => r._id === u._id) && <span style={{ marginLeft: "auto", color: "#22c55e", fontSize: 16 }}>✓</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {receiverIds.length > 0 && (
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                                                    {receiverIds.map(u => (
                                                        <span key={u._id} style={{ display: "flex", alignItems: "center", gap: 5, background: "#6366f115", border: "1px solid #6366f130", borderRadius: 20, padding: "4px 10px", fontSize: 12, color: "#6366f1" }}>
                                                            👤 {u.username}
                                                            <button type="button" onClick={() => setReceiverIds(prev => prev.filter(r => r._id !== u._id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {receiverIds.length === 0 && <p style={{ fontSize: 12, color: "#e8540a", marginTop: 6 }}>⚠️ Chưa chọn người nhận nào</p>}
                                        </div>
                                    )}

                                    <p className="an-receiver-hint">📤 Sẽ gửi tới: <strong>{audienceLabel}</strong></p>
                                </div>

                                <div className="an-field">
                                    <label className="an-label">Tiêu đề <span className="req">*</span></label>
                                    <input className="an-input" name="title" value={form.title} onChange={handleChange} placeholder="Nhập tiêu đề thông báo..." maxLength={120} required />
                                    <span className="an-char-count">{form.title.length}/120</span>
                                </div>

                                <div className="an-field">
                                    <label className="an-label">Nội dung <span className="req">*</span></label>
                                    <textarea className="an-textarea" name="message" value={form.message} onChange={handleChange} placeholder="Nhập nội dung thông báo chi tiết..." rows={4} maxLength={1000} required />
                                    <span className="an-char-count">{form.message.length}/1000</span>
                                </div>

                                {(form.title || form.message) && (
                                    <div className="an-preview">
                                        <p className="an-preview-label">👁️ Xem trước</p>
                                        <div className="an-preview-card">
                                            <div className="an-preview-icon">{AN_TYPE_ICONS[form.type]}</div>
                                            <div>
                                                <div className="an-preview-title">{form.title || "Tiêu đề..."}</div>
                                                <div className="an-preview-msg">{form.message || "Nội dung..."}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="an-form-actions">
                                    <button type="button" className="an-btn-reset" onClick={() => { setForm(AN_INIT_FORM); setReceiverIds([]); setUserSearch(""); setUserResults([]); }}>🔄 Đặt lại</button>
                                    <button type="submit" className="an-btn-send" disabled={sending}>
                                        {sending ? <><span className="an-spinner" /> Đang gửi...</> : "📤 Gửi thông báo"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>

                    <aside className="ad-surface-panel">
                        <div className="ad-surface-head">
                            <div>
                                <h3 className="ad-surface-title">Tóm tắt phiên gửi</h3>
                                <p className="ad-surface-text">Kiểm tra nhanh đối tượng nhận và nhịp gửi gần đây trước khi phát hành.</p>
                            </div>
                        </div>
                        <div className="ad-kv-list">
                            <div className="ad-kv-row"><span className="ad-kv-label">Loại thông báo</span><strong className="ad-kv-value">{AN_TYPE_OPTIONS.find(item => item.value === form.type)?.label || form.type}</strong></div>
                            <div className="ad-kv-row"><span className="ad-kv-label">Đối tượng</span><strong className="ad-kv-value">{audienceLabel}</strong></div>
                            <div className="ad-kv-row"><span className="ad-kv-label">Độ dài nội dung</span><strong className="ad-kv-value">{form.message.length} ký tự</strong></div>
                            <div className="ad-kv-row"><span className="ad-kv-label">Tổng lịch sử</span><strong className="ad-kv-value">{sentList.length} bản ghi</strong></div>
                        </div>
                        <div className="ad-side-divider" />
                        <div className="ad-surface-head" style={{ marginBottom: 10 }}>
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
                                        <div className="ad-mini-icon">{AN_TYPE_ICONS[item.type] || "📢"}</div>
                                        <div className="ad-mini-copy">
                                            <div className="ad-mini-title">{item.title}</div>
                                            <div className="ad-mini-meta">{formatDate(item.createdAt)} · {item.receiverIds?.length || 0} người nhận</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </aside>
                </div>
            )}

            {activeTab === "history" && (
                <section className="ad-surface-panel">
                    <div className="ad-surface-head">
                        <div>
                            <h3 className="ad-surface-title">Lịch sử gửi thông báo</h3>
                            <p className="ad-surface-text">Theo dõi hiệu quả gửi, số người nhận và lượt đọc trên cùng một danh sách quản trị.</p>
                        </div>
                        <button type="button" className="ad-hero-btn" onClick={loadSentList}>Làm mới</button>
                    </div>
                    <div className="an-history-panel ad-neutral-width">
                        {loadingList ? (
                            <div className="an-history-loading"><div className="an-spinner-lg" /><span>Đang tải lịch sử...</span></div>
                        ) : sentList.length === 0 ? (
                            <div className="an-history-empty"><span>📭</span><p>Chưa có thông báo nào được gửi</p></div>
                        ) : (
                            <div className="an-history-list">
                                {sentList.map((n) => (
                                    <div key={n._id} className="an-history-item">
                                        <div className="an-history-icon">{AN_TYPE_ICONS[n.type] || "📢"}</div>
                                        <div className="an-history-content">
                                            <div className="an-history-title">{n.title}</div>
                                            <div className="an-history-msg">{n.message}</div>
                                            <div className="an-history-meta">
                                                <span className="an-history-target">
                                                    {n.receiverType === "role"
                                                        ? (n.targetRole === "all" ? "👥 Tất cả" : n.targetRole === "student" ? "🎓 Sinh viên" : "📋 Quản lý")
                                                        : "👤 Cá nhân"}
                                                </span>
                                                <span className="an-history-receivers">{n.receiverIds?.length || 0} người nhận</span>
                                                <span className="an-history-read">✅ {n.readBy?.length || 0} đã đọc</span>
                                                <span className="an-history-date">{formatDate(n.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}

export default NotificationsPanel;
