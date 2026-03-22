import { useCallback, useEffect, useState } from "react";
import api from "../../../services/api";
import { StatCard } from "./cards";
import NotificationComposer from "./notifications/NotificationComposer";
import NotificationHistory from "./notifications/NotificationHistory";
import {
    NOTIFICATION_INIT_FORM,
    NOTIFICATION_TYPE_OPTIONS,
    getNotificationAudienceLabel,
} from "./notifications/constants";

function NotificationsPanel() {
    const [form, setForm] = useState(NOTIFICATION_INIT_FORM);
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
        if (!userSearch.trim()) {
            setUserResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setUserSearching(true);
            try {
                const { data } = await api.get("/users", { params: { role: searchRole, search: userSearch } });
                setUserResults(data.users || []);
            } catch {
                setUserResults([]);
            } finally {
                setUserSearching(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [userSearch, searchRole]);

    const loadSentList = useCallback(async () => {
        setLoadingList(true);
        try {
            const { data } = await api.get("/notifications/sent?limit=30");
            setSentList(data.data || []);
        } catch {
            setSentList([]);
        } finally {
            setLoadingList(false);
        }
    }, []);

    useEffect(() => {
        loadSentList();
    }, [loadSentList]);

    const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const resetAudienceSearch = useCallback(() => {
        setReceiverIds([]);
        setUserSearch("");
        setUserResults([]);
    }, []);

    const resetComposer = useCallback(() => {
        setForm(NOTIFICATION_INIT_FORM);
        resetAudienceSearch();
    }, [resetAudienceSearch]);

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
            const payload = { ...form, receiverIds: receiverIds.map((user) => user._id) };
            const { data } = await api.post("/notifications/send", payload);
            showAlert("success", data.message || "Gửi thông báo thành công!");
            resetComposer();
            await loadSentList();
            setActiveTab("history");
        } catch (err) {
            showAlert("error", err.response?.data?.message || "Gửi thất bại");
        } finally {
            setSending(false);
        }
    };

    const handleReceiverTypeChange = (e) => {
        handleChange(e);
        resetAudienceSearch();
    };

    const handleSearchRoleChange = (e) => {
        setSearchRole(e.target.value);
        setUserSearch("");
        setUserResults([]);
    };

    const handleSelectReceiver = (user) => {
        setReceiverIds((prev) => {
            if (prev.some((item) => item._id === user._id)) return prev;
            return [...prev, user];
        });
        setUserSearch("");
        setUserResults([]);
    };

    const handleRemoveReceiver = (receiverId) => {
        setReceiverIds((prev) => prev.filter((item) => item._id !== receiverId));
    };

    const totalRecipientsSent = sentList.reduce((sum, item) => sum + (item.receiverIds?.length || 0), 0);
    const totalRead = sentList.reduce((sum, item) => sum + (item.readBy?.length || 0), 0);
    const importantCount = sentList.filter((item) => item.type === "announcement").length;
    const audienceLabel = getNotificationAudienceLabel(form, receiverIds);
    const latestSent = sentList.slice(0, 4);
    const selectedTypeLabel = NOTIFICATION_TYPE_OPTIONS.find((item) => item.value === form.type)?.label || form.type;

    return (
        <div className="ad-panel-stack">
            <section className="ad-section-hero ad-section-hero-notifications">
                <div className="ad-section-copy">
                    <span className="ad-section-eyebrow">Communication Center</span>
                    <h2 className="ad-section-title">Gửi thông báo</h2>
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
                    {alert.msg}
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
                        <button className={`an-tab ${activeTab === "send" ? "active" : ""}`} onClick={() => setActiveTab("send")}>Soạn thông báo</button>
                        <button className={`an-tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>Lịch sử gửi {sentList.length > 0 && <span className="an-tab-count">{sentList.length}</span>}</button>
                    </div>
                </div>
            </div>

            {activeTab === "send" && (
                <NotificationComposer
                    audienceLabel={audienceLabel}
                    form={form}
                    latestSent={latestSent}
                    loadingList={loadingList}
                    onFieldChange={handleChange}
                    onReceiverTypeChange={handleReceiverTypeChange}
                    onRemoveReceiver={handleRemoveReceiver}
                    onReset={resetComposer}
                    onSearchRoleChange={handleSearchRoleChange}
                    onSelectReceiver={handleSelectReceiver}
                    onSubmit={handleSend}
                    onUserSearchChange={setUserSearch}
                    receiverIds={receiverIds}
                    searchRole={searchRole}
                    selectedTypeLabel={selectedTypeLabel}
                    sending={sending}
                    sentCount={sentList.length}
                    userResults={userResults}
                    userSearch={userSearch}
                    userSearching={userSearching}
                />
            )}

            {activeTab === "history" && (
                <NotificationHistory
                    loadingList={loadingList}
                    onRefresh={loadSentList}
                    sentList={sentList}
                />
            )}
        </div>
    );
}

export default NotificationsPanel;
