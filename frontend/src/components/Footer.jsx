import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const LOCATIONS = [
  {
    city: "Hà Nội",
    campus: "FPT University Hòa Lạc",
    address: "Khu Giáo dục và Đào tạo, Khu Công nghệ cao Hòa Lạc, KM29 Đại lộ Thăng Long, H. Thạch Thất, TP. Hà Nội",
    phones: ["024 7300 1866"],
    email: "daihocfpt@fpt.edu.vn",
  },
  {
    city: "Đà Nẵng",
    campus: "FPT University Đà Nẵng",
    address: "Khu đô thị công nghệ FPT Đà Nẵng, P. Hòa Hải, Q. Ngũ Hành Sơn, TP. Đà Nẵng",
    phones: ["024 7300 1866"],
    email: "daihocfpt@fpt.edu.vn",
  },
  {
    city: "Cần Thơ",
    campus: "FPT University Cần Thơ",
    address: "Số 600 Đường Nguyễn Văn Cừ (nối dài), P. An Bình, Q. Ninh Kiều, TP. Cần Thơ",
    phones: ["029 2360 1995"],
    email: "sro.ct@fe.edu.vn",
  },
  {
    city: "Quy Nhơn",
    campus: "FPT University Quy Nhơn",
    address: "Khu đô thị mới An Phú Thịnh, P. Nhơn Bình & P. Đống Đa, TP. Quy Nhơn, Bình Định",
    phones: ["024 7300 1866", "0256 7300 999"],
    email: "daihocfpt@fpt.edu.vn",
  },
];

function normalizePhone(phone) {
  return phone.replace(/[^\d+]/g, "");
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-hero">
          <div className="footer-brand-block">
            <span className="footer-kicker">Dormitory Network</span>
            <h2 className="footer-title">Hệ thống Ký túc xá Đại học FPT</h2>
            <p className="footer-summary">
              Kết nối thông tin lưu trú, hỗ trợ sinh viên và quản trị ký túc xá trên cùng một nền tảng rõ ràng, hiện đại và dễ sử dụng.
            </p>
          </div>

          <div className="footer-actions">
            <div className="footer-stat">
              <strong>4 cơ sở</strong>
              <span>Hỗ trợ sinh viên trên toàn quốc</span>
            </div>
            <div className="footer-action-row">
              <a className="footer-ghost-link" href="/#section-faq">
                Xem FAQ
              </a>
              <Link className="footer-login-link" to="/login">
                Đăng nhập hệ thống
              </Link>
            </div>
          </div>
        </div>

        <div className="footer-grid">
          {LOCATIONS.map((loc, index) => (
            <article key={loc.city} className="footer-card">
              <div className="footer-card-top">
                <span className="footer-card-index">0{index + 1}</span>
                <div>
                  <h3 className="footer-city">{loc.city}</h3>
                  <p className="footer-campus">{loc.campus}</p>
                </div>
              </div>

              <p className="footer-address">{loc.address}</p>

              <div className="footer-meta-list">
                <div className="footer-meta-item">
                  <span className="footer-meta-label">Điện thoại</span>
                  <div className="footer-phone-list">
                    {loc.phones.map((phone) => (
                      <a key={phone} href={`tel:${normalizePhone(phone)}`} className="footer-phone-link">
                        {phone}
                      </a>
                    ))}
                  </div>
                </div>
                <a href={`mailto:${loc.email}`} className="footer-meta-item">
                  <span className="footer-meta-label">Email</span>
                  <strong>{loc.email}</strong>
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="footer-bottom">
          <p>© {currentYear} FPT University Dormitory Management System</p>
          <p>Thiết kế để sinh viên, quản lý và admin làm việc trên cùng một luồng thông tin thống nhất.</p>
        </div>
      </div>
    </footer>
  );
}