import { useState } from "react";
import api from "../../../../services/api";

function UCreateModal({ onClose, onSuccess, onError }) {
    const [form, setForm] = useState({ username: "", password: "", email: "", phone: "", role: "student", fullName: "", studentCode: "", gender: "male", dateOfBirth: "", faculty: "", major: "", classCode: "", academicYear: "" });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setErr("");
        try { await api.post("/users", form); onSuccess(); }
        catch (error) { const m = error.response?.data?.message || "Tạo thất bại"; setErr(m); onError(m); }
        finally { setLoading(false); }
    };
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box wide" onClick={e => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
                <div className="modal-header"><h2>➕ Tạo tài khoản mới</h2><button className="modal-close" onClick={onClose}>✕</button></div>
                <form className="modal-form" onSubmit={handleSubmit}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#e8540a", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>Thông tin tài khoản</p>
                    <div className="form-row"><label>Username <span className="req">*</span></label><input name="username" placeholder="Nhập username" value={form.username} onChange={hc} required /></div>
                    <div className="form-row"><label>Email <span className="req">*</span></label><input name="email" type="email" placeholder="Nhập email" value={form.email} onChange={hc} required /></div>
                    <div className="form-row"><label>Mật khẩu <span className="req">*</span></label><input name="password" type="password" placeholder="Ít nhất 6 ký tự" value={form.password} onChange={hc} required /></div>
                    <div className="form-row"><label>Số điện thoại</label><input name="phone" placeholder="Nhập SĐT (tùy chọn)" value={form.phone} onChange={hc} /></div>
                    <div className="form-row"><label>Role <span className="req">*</span></label>
                        <select name="role" value={form.role} onChange={hc}>
                            <option value="student">Sinh viên</option>
                            <option value="manager">Quản lý</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    {form.role === "student" && (
                        <>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#e8540a", textTransform: "uppercase", letterSpacing: "0.5px", margin: "8px 0 0" }}>Thông tin sinh viên</p>
                            <div className="form-row"><label>Họ và tên <span className="req">*</span></label><input name="fullName" placeholder="Nguyễn Văn A" value={form.fullName} onChange={hc} required /></div>
                            <div className="form-row"><label>Mã sinh viên</label><input name="studentCode" placeholder="VD: SE180001" value={form.studentCode} onChange={hc} /></div>
                            <div className="form-row"><label>Giới tính</label><select name="gender" value={form.gender} onChange={hc}><option value="male">Nam</option><option value="female">Nữ</option></select></div>
                            <div className="form-row"><label>Ngày sinh</label><input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={hc} /></div>
                            <div className="form-row"><label>Khoa</label><input name="faculty" placeholder="VD: Công nghệ thông tin" value={form.faculty} onChange={hc} /></div>
                            <div className="form-row"><label>Chuyên ngành</label><input name="major" placeholder="VD: Kỹ thuật phần mềm" value={form.major} onChange={hc} /></div>
                            <div className="form-row"><label>Lớp</label><input name="classCode" placeholder="VD: SE1801" value={form.classCode} onChange={hc} /></div>
                            <div className="form-row"><label>Năm học</label><input name="academicYear" placeholder="VD: 2024" value={form.academicYear} onChange={hc} /></div>
                        </>
                    )}
                    {err && <div className="modal-err">⚠️ {err}</div>}
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Hủy</button>
                        <button type="submit" className="btn-submit" disabled={loading}>{loading ? "Đang tạo..." : "Tạo tài khoản"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UCreateModal;
