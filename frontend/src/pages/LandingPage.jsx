import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const CAROUSEL_SLIDES = [
    {
        img: "https://ocd.fpt.edu.vn/css/images/landing/bg5.jpg",
        tag: "Kênh thông tin chính thức",
        title: "Kênh thông tin dành cho cư dân ký túc xá",
        subtitle: "Theo dõi mọi cập nhật về đời sống, vận hành và dịch vụ trong hệ thống KTX Đại học FPT.",
    },
    {
        img: "https://ocd.fpt.edu.vn/css/images/landing/bg1.jpg",
        tag: "Không gian sống hiện đại",
        title: "Môi trường sống an toàn, tiện nghi và chỉn chu",
        subtitle: "Từ phòng ở, điện nước đến thông báo nội bộ đều được tổ chức tập trung trên một nền tảng thống nhất.",
    },
    {
        img: "https://ocd.fpt.edu.vn/css/images/landing/bg3.jpg",
        tag: "Học tập và sinh hoạt",
        title: "Một trải nghiệm nội trú phù hợp nhịp sống sinh viên",
        subtitle: "Kết nối nhanh với Ban quản lý, chủ động xử lý yêu cầu và theo dõi thông tin lưu trú theo thời gian thực.",
    },
    {
        img: "https://ocd.fpt.edu.vn/css/images/landing/bg4.jpg",
        tag: "Cộng đồng FPT",
        title: "Không gian kết nối sinh viên trên toàn quốc",
        subtitle: "Hệ thống được thiết kế để mỗi cơ sở vẫn đồng bộ về trải nghiệm và quy trình quản lý.",
    },
];

const QUICK_LINKS = [
    {
        eyebrow: "Thông tin tổng quan",
        title: "Khám phá hệ thống ký túc xá FPT",
        sub: "Xem nhanh tiện ích, chính sách lưu trú và định hướng không gian sống dành cho sinh viên.",
        cta: "Xem thông tin",
        target: "section-info",
    },
    {
        eyebrow: "FAQ",
        title: "Những câu hỏi được quan tâm nhiều nhất",
        sub: "Nội quy, điện nước, quy trình gửi yêu cầu và các đầu mối hỗ trợ được tổng hợp gọn trong một chỗ.",
        cta: "Mở FAQ",
        target: "section-faq",
    },
];

const HERO_POINTS = [
    "Quản lý phòng ở, thanh toán và yêu cầu trên cùng một hệ thống",
    "Cập nhật thông báo nhanh cho sinh viên, quản lý và admin",
    "Thiết kế đồng bộ cho nhiều cơ sở và nhiều vai trò sử dụng",
];

const HERO_METRICS = [
    { value: "4", label: "cơ sở vận hành" },
    { value: "24/7", label: "kênh hỗ trợ nội trú" },
    { value: "1", label: "nền tảng quản lý tập trung" },
];

const FAQ_ITEMS = [
    {
        q: "1. Khi ở KTX cần lưu ý điều gì?",
        a: (
            <>
                <p><strong>Một số nguyên tắc quan trọng khi sinh hoạt tại ký túc xá:</strong></p>
                <ul>
                    <li>Không nuôi thú cưng trong khu nội trú.</li>
                    <li>Không sử dụng rượu bia, chất kích thích hoặc tổ chức cờ bạc trong phòng.</li>
                    <li>Không nấu ăn trong phòng ở nếu không thuộc khu vực cho phép.</li>
                    <li>Không đưa người lạ vào phòng sau giờ giới nghiêm.</li>
                    <li>Giữ gìn vệ sinh chung và đổ rác đúng thời gian quy định.</li>
                </ul>
                <p>Mọi vi phạm sẽ được xử lý theo nội quy và mức độ ảnh hưởng tới môi trường sống chung.</p>
            </>
        ),
    },
    {
        q: "2. Thời hạn lưu trú và thông tin điện nước được tính như thế nào?",
        a: (
            <>
                <p><strong>Thời hạn lưu trú thường theo từng học kỳ:</strong></p>
                <ul>
                    <li>Kỳ Spring: từ tháng 1 đến tháng 4.</li>
                    <li>Kỳ Summer: từ tháng 5 đến tháng 8.</li>
                    <li>Kỳ Fall: từ tháng 9 đến tháng 12.</li>
                </ul>
                <p><strong>Chính sách điện nước cơ bản:</strong></p>
                <ul>
                    <li>Miễn phí trong định mức điện và nước theo quy định hiện hành.</li>
                    <li>Phần vượt định mức sẽ được tính theo đơn giá vận hành của KTX.</li>
                    <li>Sinh viên có thể theo dõi lịch sử tiêu thụ trực tiếp trên hệ thống.</li>
                </ul>
            </>
        ),
    },
    {
        q: "3. Điểm uy tín được hiểu như thế nào?",
        a: (
            <>
                <p>Điểm uy tín là một chỉ số phản ánh mức độ tuân thủ và ý thức sử dụng dịch vụ ký túc xá của sinh viên.</p>
                <ul>
                    <li>Điểm thay đổi theo hành vi thực tế trong suốt thời gian lưu trú.</li>
                    <li>Đây là một trong những yếu tố được tham chiếu khi xét duyệt tiếp tục ở KTX.</li>
                    <li>Hệ thống giúp Ban quản lý theo dõi và phản hồi minh bạch hơn với từng trường hợp.</li>
                </ul>
            </>
        ),
    },
    {
        q: "4. Làm thế nào để gửi yêu cầu tới Ban quản lý KTX?",
        a: (
            <ol>
                <li>Đăng nhập vào hệ thống và mở mục <strong>Yêu cầu của tôi</strong>.</li>
                <li>Chọn <strong>Gửi yêu cầu mới</strong> và xác định đúng loại yêu cầu.</li>
                <li>Điền nội dung chi tiết, thông tin liên quan và gửi yêu cầu.</li>
                <li>Theo dõi trạng thái xử lý trực tiếp trong dashboard sinh viên.</li>
            </ol>
        ),
    },
    {
        q: "5. Làm thế nào để báo sửa chữa đồ dùng hoặc thiết bị trong phòng?",
        a: (
            <ol>
                <li>Truy cập mục <strong>Yêu cầu của tôi</strong>.</li>
                <li>Tạo yêu cầu mới với nhóm nội dung liên quan đến sự cố kỹ thuật hoặc hỏng hóc.</li>
                <li>Mô tả tình trạng thực tế và bổ sung thông tin phòng ở.</li>
                <li>Ban quản lý sẽ tiếp nhận, phản hồi và cập nhật tiến độ xử lý ngay trên hệ thống.</li>
            </ol>
        ),
    },
    {
        q: "6. Khi cần hỗ trợ khẩn cấp thì liên hệ ở đâu?",
        a: (
            <>
                <p><strong>Một số đầu mối hỗ trợ thường trực:</strong></p>
                <ul>
                    <li>Phòng bảo vệ: (024) 668 05913</li>
                    <li>Phòng y tế: (024) 668 05917</li>
                </ul>
                <p>Đăng nhập hệ thống để xem thêm thông báo, lịch sử yêu cầu và các hướng dẫn nội trú mới nhất.</p>
            </>
        ),
    },
];

const TOTAL = CAROUSEL_SLIDES.length;

export default function LandingPage() {
    const navigate = useNavigate();
    const [current, setCurrent] = useState(0);
    const [openFaq, setOpenFaq] = useState(0);

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const goTo = useCallback((idx) => {
        setCurrent(((idx % TOTAL) + TOTAL) % TOTAL);
    }, []);

    const next = useCallback(() => setCurrent((c) => (c + 1) % TOTAL), []);
    const prev = useCallback(() => setCurrent((c) => (c - 1 + TOTAL) % TOTAL), []);

    useEffect(() => {
        const timer = setInterval(() => setCurrent((c) => (c + 1) % TOTAL), 4500);
        return () => clearInterval(timer);
    }, []);

    const toggleFaq = (index) => {
        setOpenFaq((currentIndex) => (currentIndex === index ? null : index));
    };

    return (
        <div className="lp-root">
            <section className="lp-hero">
                <div className="lp-hero-grid">
                    <div className="lp-hero-copy">
                        <span className="lp-eyebrow">On campus dormitory</span>
                        <h1>Hệ thống Ký túc xá Đại học FPT</h1>
                        <p className="lp-hero-lead">
                            Một giao diện tập trung để theo dõi lưu trú, thanh toán, thông báo và yêu cầu nội trú theo cách rõ ràng,
                            hiện đại và dễ dùng cho cả sinh viên lẫn bộ phận quản lý.
                        </p>

                        <div className="lp-hero-points">
                            {HERO_POINTS.map((point) => (
                                <div key={point} className="lp-hero-point">{point}</div>
                            ))}
                        </div>

                        <div className="lp-hero-actions">
                            <button type="button" className="lp-primary-btn" onClick={() => navigate("/login")}>
                                Đăng nhập hệ thống
                            </button>
                            <button type="button" className="lp-secondary-btn" onClick={() => scrollTo("section-faq")}>
                                Xem câu hỏi thường gặp
                            </button>
                        </div>

                        <div className="lp-hero-metrics">
                            {HERO_METRICS.map((item) => (
                                <div key={item.label} className="lp-hero-metric">
                                    <strong>{item.value}</strong>
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lp-carousel-shell">
                        <div className="lp-carousel-badge">Kênh thông tin chính thức</div>
                        <div className="lp-carousel">
                            {CAROUSEL_SLIDES.map((slide, i) => (
                                <div
                                    key={slide.title}
                                    className={`lp-slide${i === current ? " active" : ""}`}
                                    style={{ backgroundImage: `url(${slide.img})` }}
                                >
                                    <div className="lp-slide-overlay" />
                                    <div className="lp-slide-text">
                                        <span className="lp-slide-tag">{slide.tag}</span>
                                        <h2 className="lp-slide-title">{slide.title}</h2>
                                        <p className="lp-slide-subtitle">{slide.subtitle}</p>
                                    </div>
                                </div>
                            ))}

                            <button type="button" className="lp-arrow lp-arrow-prev" onClick={prev} aria-label="Trước">
                                ‹
                            </button>
                            <button type="button" className="lp-arrow lp-arrow-next" onClick={next} aria-label="Tiếp">
                                ›
                            </button>

                            <div className="lp-dots">
                                {CAROUSEL_SLIDES.map((slide, i) => (
                                    <button
                                        type="button"
                                        key={slide.title}
                                        className={`lp-dot${i === current ? " active" : ""}`}
                                        onClick={() => goTo(i)}
                                        aria-label={`Chuyển tới slide ${i + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lp-quicklinks">
                    {QUICK_LINKS.map((ql) => (
                        <button type="button" key={ql.title} className="lp-ql-card" onClick={() => scrollTo(ql.target)}>
                            <span className="lp-ql-kicker">{ql.eyebrow}</span>
                            <div className="lp-ql-title">{ql.title}</div>
                            <div className="lp-ql-sub">{ql.sub}</div>
                            <span className="lp-ql-cta">{ql.cta}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section id="section-info" className="lp-section-title">
                <span className="lp-section-kicker">Tổng quan nội trú</span>
                <h2>Thông tin Ký túc xá Đại học FPT</h2>
                <div className="lp-divider" />
                <p className="lp-section-lead">
                    Tìm hiểu nhanh về không gian sống, chính sách lưu trú và định hướng vận hành ký túc xá qua tài liệu giới thiệu chính thức.
                    <a
                        href="https://ocd.fpt.edu.vn/"
                        className="lp-link-pdf"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Xem thêm thông tin
                    </a>
                </p>
            </section>

            <section className="lp-content-block lp-block-right-img">
                <div className="lp-block-text">
                    <span className="lp-content-kicker">Môi trường sống</span>
                    <p>
                        Trường Đại học FPT không chỉ đầu tư cho chất lượng đào tạo mà còn chú trọng mạnh vào trải nghiệm sinh hoạt của sinh viên.
                        Ký túc xá được phát triển như một hệ sinh thái nội trú chỉn chu, nơi mọi nhu cầu thiết yếu đều có thể được theo dõi và hỗ trợ rõ ràng.
                    </p>
                    <p>
                        Không gian phòng ở được thiết kế để ưu tiên sự gọn gàng, an toàn và tiện nghi. Từ quản lý điện nước đến gửi yêu cầu hoặc nhận thông báo,
                        sinh viên đều có thể chủ động tiếp cận thông tin ngay trên cùng một nền tảng.
                    </p>
                </div>
                <div className="lp-block-img">
                    <img
                        src="https://ocd.fpt.edu.vn/css/images/landing/content1.png"
                        alt="Ký túc xá FPT"
                        loading="lazy"
                    />
                </div>
            </section>

            <section className="lp-content-block lp-block-left-img">
                <div className="lp-block-img">
                    <img
                        src="https://ocd.fpt.edu.vn/css/images/landing/content2.png"
                        alt="Nội thất ký túc xá FPT"
                        loading="lazy"
                    />
                </div>
                <div className="lp-block-text">
                    <span className="lp-content-kicker">Trải nghiệm dành cho sinh viên</span>
                    <p className="lp-highlight-lead">
                        Ký túc xá là lựa chọn giúp sinh viên cân bằng tốt giữa chi phí, an ninh và sự thuận tiện trong học tập.
                    </p>
                    <p>
                        Với tân sinh viên, đây là một điểm tựa để bắt đầu nhịp sống đại học trong môi trường đã được chuẩn hóa. Với sinh viên đang theo học,
                        KTX mang lại lợi thế rõ ràng về di chuyển, nhịp sinh hoạt và khả năng kết nối với cộng đồng cùng trường.
                    </p>
                    <p>
                        Từng loại phòng, từng khu chức năng và luồng hỗ trợ đều hướng đến việc giúp sinh viên yên tâm học tập trong suốt thời gian gắn bó với Đại học FPT.
                    </p>
                </div>
            </section>

            <section className="lp-full-img">
                <div className="lp-full-img-shell">
                    <img
                        src="https://ocd.fpt.edu.vn/css/images/landing/content3.png"
                        alt="Toàn cảnh ký túc xá FPT"
                        loading="lazy"
                    />
                    <div className="lp-full-img-caption">
                        Hệ thống phòng ở, tiện ích và cảnh quan được thiết kế để mang lại cảm giác sống nội trú hiện đại, sạch sẽ và thuận tiện.
                    </div>
                </div>
            </section>

            <section className="lp-text-section">
                <div className="lp-text-card">
                    <span className="lp-content-kicker">Không gian và tiện ích</span>
                    <p className="lp-text-section-lead">
                        Ký túc xá được xây dựng theo hướng hiện đại, thoáng và đủ tiện nghi cho nhịp sống sinh viên mỗi ngày.
                    </p>
                    <p>
                        Mỗi tòa nhà đều được tổ chức để phục vụ tốt cho cả nhu cầu nghỉ ngơi lẫn học tập. Từ hạ tầng mạng, khu giặt sấy, tiện ích nội khu đến các phòng ở nhiều sức chứa,
                        mọi thành phần đều được thiết kế để sinh viên có một môi trường ổn định, dễ thích nghi và an tâm trong suốt quá trình học tại FPT.
                    </p>
                </div>
            </section>

            <section id="section-faq" className="lp-faq">
                <div className="lp-faq-inner">
                    <span className="lp-section-kicker">Hỏi đáp nhanh</span>
                    <h2 className="lp-faq-title">Những điều sinh viên thường cần biết khi ở KTX</h2>
                    <div className="lp-faq-divider" />
                    <div className="lp-faq-list">
                        {FAQ_ITEMS.map((item, i) => {
                            const isOpen = openFaq === i;
                            return (
                                <div key={item.q} className={`lp-faq-item${isOpen ? " open" : ""}`}>
                                    <button
                                        type="button"
                                        className="lp-faq-question"
                                        onClick={() => toggleFaq(i)}
                                        aria-expanded={isOpen}
                                    >
                                        <span>{item.q}</span>
                                        <span className="lp-faq-toggle">{isOpen ? "Thu gọn" : "Mở"}</span>
                                    </button>
                                    {isOpen && <div className="lp-faq-answer">{item.a}</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="lp-cta">
                <div className="lp-cta-inner">
                    <div className="lp-cta-copy">
                        <span className="lp-eyebrow lp-eyebrow-light">Sẵn sàng bắt đầu</span>
                        <h2>Quản lý và sử dụng ký túc xá trên một nền tảng thống nhất</h2>
                        <p>
                            Đăng nhập để xem thông báo, theo dõi thanh toán, gửi yêu cầu và kết nối với quy trình vận hành nội trú một cách rõ ràng hơn.
                        </p>
                    </div>
                    <div className="lp-cta-actions">
                        <button type="button" className="lp-cta-btn" onClick={() => navigate("/login")}>
                            Đăng nhập hệ thống
                        </button>
                        <button type="button" className="lp-cta-ghost" onClick={() => scrollTo("section-faq")}>
                            Xem FAQ
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
