import { useState } from "react";
import "./ChangePasswordModal.css";
import api from "../services/api";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/;

export default function ChangePasswordModal({ onClose }) {
    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [show, setShow] = useState({
        current: false,
        newPw: false,
        confirm: false,
    });
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const toggleShow = (field) =>
        setShow((prev) => ({ ...prev, [field]: !prev[field] }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAlert(null);

        if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
            setAlert({ type: "error", msg: "Vui long nhap day du thong tin" });
            return;
        }

        if (!PASSWORD_REGEX.test(form.newPassword)) {
            setAlert({ type: "error", msg: "Mat khau phai co it nhat 6 ky tu, 1 chu hoa, 1 chu thuong va 1 ky tu dac biet" });
            return;
        }

        if (form.newPassword !== form.confirmPassword) {
            setAlert({ type: "error", msg: "Mat khau xac nhan khong khop" });
            return;
        }

        try {
            setLoading(true);
            const { data } = await api.put("/auth/change-password", {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
                confirmPassword: form.confirmPassword,
            });

            if (!data.success) {
                setAlert({ type: "error", msg: data.message });
            } else {
                setAlert({ type: "success", msg: "Doi mat khau thanh cong!" });
                setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                setTimeout(() => onClose(), 1800);
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Loi ket noi, vui long thu lai";
            setAlert({ type: "error", msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cpw-overlay" onClick={onClose}>
            <div className="cpw-card" onClick={(e) => e.stopPropagation()}>
                <div className="cpw-header">
                    <span className="cpw-icon">🔐</span>
                    <div>
                        <h2 className="cpw-title">Doi mat khau</h2>
                        <p className="cpw-subtitle">Nhap mat khau hien tai va mat khau moi</p>
                    </div>
                    <button className="cpw-close" onClick={onClose} aria-label="Dong">×</button>
                </div>

                {alert && (
                    <div className={`cpw-alert ${alert.type}`}>
                        {alert.msg}
                    </div>
                )}

                <form className="cpw-form" onSubmit={handleSubmit}>
                    <div className="cpw-field">
                        <label className="cpw-label">Mat khau hien tai</label>
                        <div className="cpw-input-box">
                            <span className="cpw-icon-field">🔑</span>
                            <input
                                type={show.current ? "text" : "password"}
                                name="currentPassword"
                                value={form.currentPassword}
                                onChange={handleChange}
                                placeholder="Nhap mat khau hien tai"
                                autoComplete="current-password"
                            />
                            <button type="button" className="cpw-eye" onClick={() => toggleShow("current")}>
                                {show.current ? "Ẩn" : "Hiện"}
                            </button>
                        </div>
                    </div>

                    <div className="cpw-field">
                        <label className="cpw-label">Mat khau moi</label>
                        <div className="cpw-input-box">
                            <span className="cpw-icon-field">🔒</span>
                            <input
                                type={show.newPw ? "text" : "password"}
                                name="newPassword"
                                value={form.newPassword}
                                onChange={handleChange}
                                placeholder="It nhat 6 ky tu, co hoa, thuong, ky tu dac biet"
                                autoComplete="new-password"
                            />
                            <button type="button" className="cpw-eye" onClick={() => toggleShow("newPw")}>
                                {show.newPw ? "Ẩn" : "Hiện"}
                            </button>
                        </div>
                    </div>

                    <div className="cpw-field">
                        <label className="cpw-label">Xac nhan mat khau moi</label>
                        <div className="cpw-input-box">
                            <span className="cpw-icon-field">🔒</span>
                            <input
                                type={show.confirm ? "text" : "password"}
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="Nhap lai mat khau moi"
                                autoComplete="new-password"
                            />
                            <button type="button" className="cpw-eye" onClick={() => toggleShow("confirm")}>
                                {show.confirm ? "Ẩn" : "Hiện"}
                            </button>
                        </div>
                    </div>

                    {form.newPassword && (
                        <div className="cpw-rules">
                            {[
                                { test: form.newPassword.length >= 6, label: "It nhat 6 ky tu" },
                                { test: /[A-Z]/.test(form.newPassword), label: "Co chu hoa (A-Z)" },
                                { test: /[a-z]/.test(form.newPassword), label: "Co chu thuong (a-z)" },
                                { test: /[^A-Za-z0-9]/.test(form.newPassword), label: "Co ky tu dac biet" },
                            ].map(({ test, label }) => (
                                <div key={label} className={`cpw-rule ${test ? "pass" : "fail"}`}>
                                    <span className="cpw-rule-icon">{test ? "Đạt" : "Chưa"}</span>
                                    {label}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="cpw-actions">
                        <button type="button" className="cpw-btn-ghost" onClick={onClose}>
                            Huy
                        </button>
                        <button type="submit" className="cpw-btn-primary" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="cpw-spinner" /> Dang luu...
                                </>
                            ) : (
                                "Doi mat khau"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
