import { useCallback, useEffect, useState } from "react";
import api from "../../../services/api";
import { StatCard } from "./cards";
import BBuildingCard from "./buildings/BBuildingCard";
import BBuildingModal from "./buildings/BBuildingModal";
import BRoomModal from "./buildings/BRoomModal";

function BuildingsPanel() {
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState(null);
    const [modal, setModal] = useState(null);

    const showAlert = useCallback((type, msg) => { setAlert({ type, msg }); setTimeout(() => setAlert(null), 4000); }, []);

    const load = useCallback(() => {
        setLoading(true);
        api.get("/buildings")
            .then(r => setBuildings(r.data.data || []))
            .catch(() => showAlert("error", "Không thể tải danh sách tòa nhà"))
            .finally(() => setLoading(false));
    }, [showAlert]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (building) => {
        if (!window.confirm(`Xóa tòa nhà "${building.name}"?`)) return;
        try { await api.delete(`/buildings/${building._id}`); showAlert("success", `Đã xóa tòa nhà ${building.name}`); load(); }
        catch (err) { showAlert("error", err.response?.data?.message || "Xóa thất bại"); }
    };

    const activeBuildings = buildings.filter((b) => b.status === "active").length;
    const maintenanceBuildings = buildings.filter((b) => b.status === "maintenance").length;
    const inactiveBuildings = buildings.filter((b) => b.status === "inactive").length;
    const assignedManagers = buildings.filter((b) => !!b.managerId).length;
    const totalFloors = buildings.reduce((sum, b) => sum + Number(b.totalFloors || 0), 0);

    return (
        <div className="ad-panel-stack">
            <section className="ad-section-hero ad-section-hero-buildings">
                <div className="ad-section-copy">
                    <span className="ad-section-eyebrow">Dormitory Assets</span>
                    <h2 className="ad-section-title">🏢 Quản lý tòa nhà & phòng</h2>
                    <p className="ad-section-subtitle">
                        Theo dõi hạ tầng KTX theo cùng một nhịp thiết kế với dashboard admin: rõ số liệu, rõ trạng thái và dễ thao tác khi cần cập nhật.
                    </p>
                    <div className="ad-section-pills">
                        <span className="ad-section-pill neutral">Tổng tòa nhà: {buildings.length}</span>
                        <span className="ad-section-pill neutral">Quản lý đã phân công: {assignedManagers}/{buildings.length || 0}</span>
                        <span className={`ad-section-pill ${maintenanceBuildings > 0 ? "danger" : "success"}`}>
                            {maintenanceBuildings > 0 ? `${maintenanceBuildings} tòa đang bảo trì` : "Không có tòa nào cần bảo trì"}
                        </span>
                    </div>
                </div>
                <div className="ad-section-actions">
                    <button className="ad-hero-btn primary" onClick={() => setModal({ type: "building" })}>＋ Tạo tòa nhà</button>
                </div>
            </section>

            {alert && <div className={`ab-alert ${alert.type}`} style={{ marginBottom: 0 }}>{alert.type === "success" ? "✓" : "⚠️"} {alert.msg}</div>}

            <div className="ad-stats-grid">
                <StatCard icon="🏢" label="Tòa nhà" value={buildings.length} meta={`${totalFloors} tầng trên toàn hệ thống`} color="#e8540a" loading={loading} />
                <StatCard icon="🟢" label="Đang hoạt động" value={activeBuildings} meta={`${assignedManagers} tòa đã có quản lý phụ trách`} color="#16a34a" loading={loading} />
                <StatCard icon="🛠️" label="Bảo trì" value={maintenanceBuildings} meta="Những khu vực cần theo dõi kỹ hơn" color="#d97706" loading={loading} />
                <StatCard icon="⏸️" label="Tạm đóng" value={inactiveBuildings} meta="Khu vực chưa mở cho vận hành" color="#64748b" loading={loading} />
            </div>

            <div className="ad-context-line">
                <p className="ad-context-text">Nhấn vào từng tòa nhà để xem danh sách phòng và thao tác ở cùng một nơi.</p>
                <p className="ad-context-text">Mẹo nhanh: nên phân công quản lý trước khi mở tòa để tránh thiếu đầu mối vận hành.</p>
            </div>

            {loading ? (
                <div className="ad-surface-panel">
                    <div className="ad-empty-inline"><span className="ab-spinner" />Đang tải danh sách tòa nhà...</div>
                </div>
            ) : buildings.length === 0 ? (
                <div className="ad-surface-panel">
                    <div className="ab-empty-page"><span className="ab-empty-icon">🏗️</span><p>Chưa có tòa nhà nào. Nhấn “Tạo tòa nhà” để bắt đầu thiết lập KTX.</p></div>
                </div>
            ) : (
                <div className="ad-surface-panel">
                    <div className="ad-surface-head">
                        <div>
                            <h3 className="ad-surface-title">Danh mục tòa nhà</h3>
                            <p className="ad-surface-text">Mở từng thẻ để kiểm tra phòng, thêm phòng mới hoặc cập nhật trạng thái vận hành.</p>
                        </div>
                    </div>
                    <div className="ab-building-list">
                        {buildings.map(b => (
                            <BBuildingCard
                                key={b._id}
                                building={b}
                                onEdit={building => setModal({ type: "building-edit", data: building })}
                                onDelete={handleDelete}
                                onAddRoom={(building, refresh) => setModal({ type: "room", data: building, onRoomSuccess: refresh })}
                                showAlert={showAlert}
                            />
                        ))}
                    </div>
                </div>
            )}

            {modal?.type === "building" && (
                <BBuildingModal building={null} onClose={() => setModal(null)} onSuccess={() => { setModal(null); showAlert("success", "Tạo tòa nhà thành công!"); load(); }} />
            )}
            {modal?.type === "building-edit" && (
                <BBuildingModal building={modal.data} onClose={() => setModal(null)} onSuccess={() => { setModal(null); showAlert("success", "Cập nhật tòa nhà thành công!"); load(); }} />
            )}
            {modal?.type === "room" && (
                <BRoomModal
                    building={modal.data}
                    onClose={() => setModal(null)}
                    onSuccess={() => { setModal(null); showAlert("success", "Tạo phòng thành công!"); if (modal.onRoomSuccess) modal.onRoomSuccess(); }}
                />
            )}
        </div>
    );
}

export default BuildingsPanel;
