import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AuthPages.css";

const ROLE_DASHBOARD = {
    admin: {
        href: "/admin/dashboard",
        preload: () => import("./admin/AdminDashboard"),
    },
    manager: {
        href: "/manager/dashboard",
        preload: () => import("./ManagerDashboard"),
    },
    student: {
        href: "/student/dashboard",
        preload: () => import("./student/StudentDashboard"),
    },
};

export default function LoginPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", password: "" });
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        setError("");

        try {
            const { data } = await api.post("/auth/login", form);
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            const roleConfig = ROLE_DASHBOARD[data.user.role] || ROLE_DASHBOARD.student;
            roleConfig.preload?.();
            navigate(roleConfig.href, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-bg auth-login-bg">
            <Link to="/" className="auth-back-btn">
                ← Trang chủ
            </Link>
            <div className="login-shell">
                <section className="login-showcase">
                    <div className="login-showcase-inner">
                        <span className="login-kicker">Khu nội trú đại học</span>
                        <h1 className="login-showcase-title">Không gian quản lý ký túc xá gọn gàng, hiện đại và dễ dùng.</h1>
                        <p className="login-showcase-copy">
                            Theo dõi phòng ở, thanh toán, yêu cầu hỗ trợ và vận hành hệ thống KTX trong cùng một trải nghiệm thống nhất.
                        </p>

                        <div className="login-feature-list">
                            <div className="login-feature-card">
                                <span className="login-feature-icon">🏢</span>
                                <div>
                                    <strong>Quản lý chỗ ở tập trung</strong>
                                    <p>Phòng, tòa nhà, lịch sử ở và đăng ký đều nằm trong một luồng rõ ràng.</p>
                                </div>
                            </div>
                            <div className="login-feature-card">
                                <span className="login-feature-icon">💳</span>
                                <div>
                                    <strong>Tài chính minh bạch</strong>
                                    <p>Hóa đơn, thanh toán QR và công nợ được theo dõi trực quan theo từng sinh viên.</p>
                                </div>
                            </div>
                            <div className="login-feature-card">
                                <span className="login-feature-icon">🛎️</span>
                                <div>
                                    <strong>Vận hành nhanh hơn</strong>
                                    <p>Yêu cầu, báo cáo và thông báo được xử lý nhanh cho admin, manager và sinh viên.</p>
                                </div>
                            </div>
                        </div>

                        <div className="login-showcase-footer">
                            <span className="login-showcase-pill">Dành cho Sinh viên</span>
                            <span className="login-showcase-pill">Manager</span>
                            <span className="login-showcase-pill">Admin</span>
                        </div>
                    </div>
                </section>

                <div className="auth-card login-card">
                    <div className="auth-header login-header">
                        <div className="login-brand-mark">
                            <span className="login-brand-icon">FF</span>
                            <div className="login-brand-copy">
                                <span className="login-brand-kicker">Hệ thống KTX FPT</span>
                                <span className="login-brand-sub">Đăng nhập để tiếp tục làm việc</span>
                            </div>
                        </div>
                        <h1 className="auth-title login-title">Đăng nhập hệ thống</h1>
                        <p className="auth-subtitle login-subtitle">Dành cho sinh viên, quản lý và admin.</p>
                    </div>

                    <form className="auth-form login-form" onSubmit={handleSubmit} noValidate>
                        <div className="form-field">
                            <label className="form-label">Tên đăng nhập / Email</label>
                            <div className="input-box login-input-box">
                                <span className="icon">👤</span>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    placeholder="Nhập username hoặc email"
                                    value={form.username}
                                    onChange={handleChange}
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-field">
                            <label className="form-label">Mật khẩu</label>
                            <div className="input-box login-input-box">
                                <span className="icon">🔒</span>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPass ? "text" : "password"}
                                    placeholder="Nhập mật khẩu"
                                    value={form.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                />
                                <button type="button" className="eye-btn" onClick={() => setShowPass((prev) => !prev)}>
                                    {showPass ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="auth-alert error">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <button type="submit" className="btn-primary login-submit-btn" disabled={loading}>
                            {loading ? <><span className="spinner" />Đang đăng nhập...</> : "Đăng nhập"}
                        </button>

                        <div className="login-form-note">
                            <span className="login-form-note-dot" />
                            Kết nối an toàn cho thao tác quản lý nội trú và dữ liệu tài chính.
                        </div>

                        <div className="auth-footer login-footer">
                            <Link to="/forgot-password" className="auth-link">
                                Quên mật khẩu?
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
