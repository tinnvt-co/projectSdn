import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
    ArrowLeftIcon,
    CheckCircleIcon,
    CodeIcon,
    EyeIcon,
    EyeOffIcon,
    KeyIcon,
    LockIcon,
    MailIcon,
    ShieldIcon,
} from "./AuthIcons";
import "./AuthPages.css";

const STEP = { EMAIL: 1, CODE: 2, DONE: 3 };
const RESET_SHOWCASE_IMAGE = "https://ocd.fpt.edu.vn/css/images/landing/bg3.jpg";

export default function ForgotPasswordPage() {
    const [step, setStep] = useState(STEP.EMAIL);
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [devCode, setDevCode] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ type: "", msg: "" });

    const showAlert = (type, msg) => setAlert({ type, msg });
    const clearAlert = () => setAlert({ type: "", msg: "" });

    const handleSendCode = async (e) => {
        e.preventDefault();
        if (loading) return;
        clearAlert();
        setLoading(true);
        try {
            const { data } = await api.post("/auth/forgot-password", { email: email.trim() });
            if (data.resetCode) setDevCode(data.resetCode);
            setStep(STEP.CODE);
        } catch (err) {
            showAlert("error", err.response?.data?.message || "Gửi mã thất bại");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        if (loading) return;
        clearAlert();
        if (newPassword !== confirmPassword) {
            return showAlert("error", "Mật khẩu xác nhận không khớp");
        }
        setLoading(true);
        try {
            await api.post("/auth/reset-password", {
                email: email.trim(),
                code: code.trim(),
                newPassword,
                confirmPassword,
            });
            setStep(STEP.DONE);
        } catch (err) {
            showAlert("error", err.response?.data?.message || "Đặt lại mật khẩu thất bại");
        } finally {
            setLoading(false);
        }
    };

    const stepSubtitle =
        step === STEP.EMAIL
            ? "Nhập email đã đăng ký để nhận mã xác nhận."
            : step === STEP.CODE
                ? "Xác thực mã OTP và đặt lại mật khẩu mới an toàn."
                : "Bạn có thể đăng nhập lại bằng mật khẩu mới ngay bây giờ.";

    return (
        <div className="auth-bg auth-login-bg auth-reset-bg">
            <Link to="/login" className="auth-back-btn auth-back-btn-secondary">
                <ArrowLeftIcon />
                <span>Đăng nhập</span>
            </Link>

            <div className="login-shell auth-shell-reset">
                <section className="login-showcase auth-showcase-reset">
                    <div className="login-showcase-inner">
                        <span className="login-kicker">Khôi phục truy cập</span>
                        <div
                            className="login-showcase-media auth-reset-media"
                            style={{ backgroundImage: `linear-gradient(180deg, rgba(17, 24, 39, 0.1), rgba(17, 24, 39, 0.4)), url(${RESET_SHOWCASE_IMAGE})` }}
                        >
                            <div className="login-showcase-media-badge">ACCOUNT RECOVERY</div>
                            <div className="login-showcase-media-caption">
                                <strong>Bảo vệ quyền truy cập của bạn</strong>
                                <span>Khôi phục tài khoản nhanh chóng với quy trình xác nhận rõ ràng và an toàn.</span>
                            </div>
                        </div>

                        <h1 className="login-showcase-title">Lấy lại tài khoản một cách an toàn, rõ ràng và ít thao tác.</h1>
                        <p className="login-showcase-copy">
                            Hệ thống hỗ trợ gửi mã xác nhận, đổi mật khẩu mới và quay lại làm việc nhanh cho sinh viên, manager và admin.
                        </p>

                        <div className="login-feature-list reset-feature-list">
                            <div className="login-feature-card">
                                <span className="login-feature-icon">
                                    <MailIcon />
                                </span>
                                <div>
                                    <strong>Gửi mã xác nhận qua email</strong>
                                    <p>Mã xác thực giúp bạn kiểm tra quyền sở hữu tài khoản trước khi đổi mật khẩu.</p>
                                </div>
                            </div>
                            <div className="login-feature-card">
                                <span className="login-feature-icon">
                                    <ShieldIcon />
                                </span>
                                <div>
                                    <strong>Quy trình khôi phục an toàn</strong>
                                    <p>Thông tin được xác minh theo từng bước để hạn chế rủi ro truy cập trái phép.</p>
                                </div>
                            </div>
                            <div className="login-feature-card">
                                <span className="login-feature-icon">
                                    <KeyIcon />
                                </span>
                                <div>
                                    <strong>Quay lại hệ thống nhanh</strong>
                                    <p>Đổi mật khẩu mới xong là có thể đăng nhập lại ngay mà không cần thao tác rườm rà.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="auth-card login-card reset-card">
                    <div className="auth-header login-header">
                        <div className="login-brand-mark">
                            <span className="login-brand-icon login-brand-icon-soft">
                                <KeyIcon />
                            </span>
                            <div className="login-brand-copy">
                                <span className="login-brand-kicker">Khôi phục tài khoản</span>
                                <span className="login-brand-sub">Thực hiện theo từng bước để đặt lại mật khẩu.</span>
                            </div>
                        </div>
                        <h1 className="auth-title login-title">Quên mật khẩu</h1>
                        <p className="auth-subtitle login-subtitle">{stepSubtitle}</p>
                    </div>

                    <div className="steps reset-steps">
                        <div className={`step-dot ${step >= STEP.EMAIL ? "active" : ""}`}>1</div>
                        <div className="step-bar" />
                        <div className={`step-dot ${step >= STEP.CODE ? "active" : ""}`}>2</div>
                        <div className="step-bar" />
                        <div className={`step-dot ${step >= STEP.DONE ? "active" : ""}`}>✓</div>
                    </div>

                    {step === STEP.EMAIL && (
                        <form className="auth-form login-form" onSubmit={handleSendCode}>
                            <div className="form-field">
                                <label className="form-label">Email tài khoản</label>
                                <div className="input-box login-input-box">
                                    <span className="icon">
                                        <MailIcon />
                                    </span>
                                    <input
                                        type="email"
                                        placeholder="Nhập địa chỉ email"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); clearAlert(); }}
                                        required
                                    />
                                </div>
                            </div>

                            {alert.msg && (
                                <div className={`auth-alert ${alert.type}`}>
                                    <span className="auth-alert-icon">
                                        <ShieldIcon />
                                    </span>
                                    {alert.msg}
                                </div>
                            )}

                            <button type="submit" className="btn-primary login-submit-btn" disabled={loading}>
                                {loading ? <><span className="spinner" />Đang gửi...</> : "Lấy mã xác nhận"}
                            </button>

                            <div className="login-form-note">
                                <span className="login-form-note-dot" />
                                Mã xác nhận có hiệu lực trong thời gian ngắn để đảm bảo an toàn.
                            </div>
                        </form>
                    )}

                    {step === STEP.CODE && (
                        <form className="auth-form login-form" onSubmit={handleReset}>
                            {devCode && (
                                <div className="token-box">
                                    <span className="token-label">Mã xác nhận của bạn</span>
                                    <span className="token-code">{devCode}</span>
                                    <span className="token-expire">⏱ Hết hạn sau 15 phút</span>
                                </div>
                            )}

                            <div className="form-field">
                                <label className="form-label">Mã xác nhận</label>
                                <div className="input-box login-input-box">
                                    <span className="icon">
                                        <CodeIcon />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Nhập mã 6 chữ số"
                                        value={code}
                                        onChange={(e) => { setCode(e.target.value); clearAlert(); }}
                                        maxLength={6}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-field">
                                <label className="form-label">Mật khẩu mới</label>
                                <div className="input-box login-input-box">
                                    <span className="icon">
                                        <LockIcon />
                                    </span>
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Ít nhất 6 ký tự"
                                        value={newPassword}
                                        onChange={(e) => { setNewPassword(e.target.value); clearAlert(); }}
                                        required
                                    />
                                    <button type="button" className="eye-btn" onClick={() => setShowNewPassword((prev) => !prev)}>
                                        {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-field">
                                <label className="form-label">Xác nhận mật khẩu</label>
                                <div className="input-box login-input-box">
                                    <span className="icon">
                                        <LockIcon />
                                    </span>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Nhập lại mật khẩu mới"
                                        value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); clearAlert(); }}
                                        required
                                    />
                                    <button type="button" className="eye-btn" onClick={() => setShowConfirmPassword((prev) => !prev)}>
                                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>

                            {alert.msg && (
                                <div className={`auth-alert ${alert.type}`}>
                                    <span className="auth-alert-icon">
                                        <ShieldIcon />
                                    </span>
                                    {alert.msg}
                                </div>
                            )}

                            <button type="submit" className="btn-primary login-submit-btn" disabled={loading}>
                                {loading ? <><span className="spinner" />Đang cập nhật...</> : "Đặt lại mật khẩu"}
                            </button>

                            <button
                                type="button"
                                className="btn-ghost reset-secondary-btn"
                                onClick={() => {
                                    setStep(STEP.EMAIL);
                                    clearAlert();
                                }}
                            >
                                <ArrowLeftIcon />
                                <span>Quay lại bước trước</span>
                            </button>
                        </form>
                    )}

                    {step === STEP.DONE && (
                        <div className="auth-form login-form">
                            <div className="success-state auth-success-state">
                                <span className="success-icon-badge">
                                    <CheckCircleIcon />
                                </span>
                                <p>Mật khẩu đã được cập nhật thành công. Bạn có thể quay lại trang đăng nhập để tiếp tục.</p>
                                <Link to="/login" className="btn-primary login-submit-btn">
                                    Đăng nhập ngay
                                </Link>
                            </div>
                        </div>
                    )}

                    {step !== STEP.DONE && (
                        <div className="auth-footer login-footer">
                            <Link to="/login" className="auth-link">Quay lại đăng nhập</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
