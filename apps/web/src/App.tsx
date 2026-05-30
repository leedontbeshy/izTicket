import './App.css';

type EventCard = {
    title: string;
    date: string;
    location: string;
    price: string;
    image: string;
    status: string;
    statusTone?: 'blue' | 'red';
};

type TrustItem = {
    icon: string;
    title: string;
    description: string;
};

type Metric = {
    icon: string;
    value: string;
    label: string;
};

const events: EventCard[] = [
    {
        title: 'Đen Vâu Live in Concert',
        date: '10.06.2026',
        location: 'TP. Hồ Chí Minh',
        price: 'Từ 450.000đ',
        status: 'Sắp diễn ra',
        statusTone: 'red',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=640&q=80',
    },
    {
        title: 'AMEE Show: Dreamy Night',
        date: '18.06.2026',
        location: 'Hà Nội',
        price: 'Từ 390.000đ',
        status: 'Sắp diễn ra',
        statusTone: 'red',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=640&q=80',
    },
    {
        title: 'V.League 2026 - Vòng 10',
        date: '01.07.2026',
        location: 'Hà Nội',
        price: 'Từ 120.000đ',
        status: 'Sắp diễn ra',
        statusTone: 'red',
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=640&q=80',
    },
    {
        title: 'Tech Summit Vietnam 2026',
        date: '15.07.2026',
        location: 'TP. Hồ Chí Minh',
        price: 'Từ 990.000đ',
        status: 'Mở bán',
        statusTone: 'blue',
        image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=640&q=80',
    },
    {
        title: 'Disney On Ice Vietnam',
        date: '20.08.2026',
        location: 'Đà Nẵng',
        price: 'Từ 300.000đ',
        status: 'Sắp diễn ra',
        statusTone: 'red',
        image: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?auto=format&fit=crop&w=640&q=80',
    },
    {
        title: 'Hài Độc Thoại: Cười Xuyên Việt',
        date: '05.09.2026',
        location: 'Hà Nội',
        price: 'Từ 250.000đ',
        status: 'Sắp diễn ra',
        statusTone: 'red',
        image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=640&q=80',
    },
];

const trustItems: TrustItem[] = [
    {
        icon: 'verified_user',
        title: 'Thanh toán an toàn',
        description: 'Được bảo mật bởi SePay',
    },
    {
        icon: 'confirmation_number',
        title: 'Vé điện tử tiện lợi',
        description: 'Nhận vé ngay trên điện thoại',
    },
    {
        icon: 'support_agent',
        title: 'Hỗ trợ 24/7',
        description: 'Đội ngũ hỗ trợ tận tâm',
    },
];

const metrics: Metric[] = [
    {
        icon: 'groups',
        value: '1M+',
        label: 'Khách hàng tin tưởng',
    },
    {
        icon: 'workspace_premium',
        value: '10K+',
        label: 'Sự kiện đa dạng',
    },
    {
        icon: 'shield',
        value: '99.9%',
        label: 'Giao dịch an toàn',
    },
    {
        icon: 'headset_mic',
        value: '24/7',
        label: 'Hỗ trợ tận tâm',
    },
];

function MaterialIcon({
    children,
    className = '',
}: {
    children: string;
    className?: string;
}) {
    return (
        <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
            {children}
        </span>
    );
}

function BrandMark() {
    return (
        <span className="brand-mark" aria-hidden="true">
            <MaterialIcon>confirmation_number</MaterialIcon>
        </span>
    );
}

function EventCard({ event }: { event: EventCard }) {
    return (
        <article className="event-card">
            <div className="event-image-wrap">
                <img src={event.image} alt={event.title} />
                <span className={`event-status ${event.statusTone ?? 'red'}`}>
                    {event.status}
                </span>
            </div>
            <div className="event-body">
                <h3>{event.title}</h3>
                <div className="event-meta-row">
                    <span>
                        <MaterialIcon>calendar_today</MaterialIcon>
                        {event.date}
                    </span>
                    <span>
                        <MaterialIcon>location_on</MaterialIcon>
                        {event.location}
                    </span>
                </div>
                <div className="event-price-row">
                    <strong>{event.price}</strong>
                    <button type="button" aria-label={`Lưu ${event.title}`}>
                        <MaterialIcon>favorite</MaterialIcon>
                    </button>
                </div>
            </div>
        </article>
    );
}

function App() {
    return (
        <main className="landing-shell">
            <header className="site-header">
                <a className="brand" href="#">
                    <BrandMark />
                    <span>izTicket</span>
                </a>

                <nav className="main-nav" aria-label="Điều hướng chính">
                    <a className="active" href="#">
                        Trang chủ
                    </a>
                    <a href="#events">Sự kiện</a>
                    <a href="#organizers">Dành cho tổ chức</a>
                    <a href="#about">Giới thiệu</a>
                    <a href="#support">Hỗ trợ</a>
                </nav>

                <div className="header-actions">
                    <button className="language-button" type="button">
                        <MaterialIcon>language</MaterialIcon>
                        VI
                        <MaterialIcon>expand_more</MaterialIcon>
                    </button>
                    <button className="ghost-button" type="button">
                        Đăng nhập
                    </button>
                    <button className="dark-button" type="button">
                        Đăng ký
                    </button>
                </div>
            </header>

            <section className="hero-section">
                <div className="hero-copy">
                    <div className="eyebrow">
                        <MaterialIcon>auto_awesome</MaterialIcon>
                        Nền tảng vé sự kiện thông minh
                    </div>
                    <h1>Kết nối bạn với những sự kiện đáng nhớ</h1>
                    <p>
                        Khám phá hàng ngàn sự kiện hấp dẫn: âm nhạc, thể thao,
                        hội thảo, giải trí và nhiều hơn thế nữa.
                    </p>

                    <form
                        className="search-panel"
                        aria-label="Tìm kiếm sự kiện"
                        onSubmit={(event) => event.preventDefault()}
                    >
                        <label className="search-field">
                            <MaterialIcon>search</MaterialIcon>
                            <span className="sr-only">Từ khóa sự kiện</span>
                            <input
                                type="search"
                                placeholder="Tìm kiếm sự kiện, nghệ sĩ, địa điểm..."
                            />
                        </label>
                        <button className="location-select" type="button">
                            <MaterialIcon>location_on</MaterialIcon>
                            Tất cả địa điểm
                            <MaterialIcon>expand_more</MaterialIcon>
                        </button>
                        <button className="search-button" type="submit">
                            Tìm kiếm
                        </button>
                    </form>

                    <div className="trust-strip" aria-label="Cam kết dịch vụ">
                        {trustItems.map((item) => (
                            <article className="trust-item" key={item.title}>
                                <span>
                                    <MaterialIcon>{item.icon}</MaterialIcon>
                                </span>
                                <div>
                                    <h2>{item.title}</h2>
                                    <p>{item.description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>

                <div className="hero-visual" aria-label="Sự kiện nổi bật">
                    <img
                        src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1400&q=90"
                        alt="Đám đông trong lễ hội âm nhạc"
                    />
                    <div className="hero-event-card">
                        <span>Sắp diễn ra</span>
                        <h2>Monsoon Music Festival 2026</h2>
                        <div className="hero-event-meta">
                            <span>
                                <MaterialIcon>calendar_today</MaterialIcon>
                                24 - 25.06.2026
                            </span>
                            <span>
                                <MaterialIcon>location_on</MaterialIcon>
                                Hà Nội
                            </span>
                        </div>
                        <a href="#events">
                            Xem chi tiết
                            <MaterialIcon>arrow_forward</MaterialIcon>
                        </a>
                    </div>
                    <div className="carousel-controls" aria-hidden="true">
                        <button type="button">
                            <MaterialIcon>chevron_left</MaterialIcon>
                        </button>
                        <div>
                            <span />
                            <span className="active" />
                            <span />
                            <span />
                        </div>
                        <button type="button">
                            <MaterialIcon>chevron_right</MaterialIcon>
                        </button>
                    </div>
                </div>
            </section>

            <section className="events-section" id="events">
                <div className="section-title-row">
                    <h2>Sự kiện nổi bật</h2>
                    <a href="#events">
                        Xem tất cả
                        <MaterialIcon>arrow_forward</MaterialIcon>
                    </a>
                </div>
                <div className="event-grid">
                    {events.map((event) => (
                        <EventCard key={event.title} event={event} />
                    ))}
                </div>
            </section>

            <section className="organizer-band" id="organizers">
                <div className="organizer-ticket">
                    <BrandMark />
                </div>
                <div className="organizer-copy">
                    <h2>Bạn là tổ chức sự kiện?</h2>
                    <p>
                        izTicket cung cấp giải pháp toàn diện giúp bạn quản lý sự
                        kiện, bán vé hiệu quả và tiếp cận hàng triệu khách hàng.
                    </p>
                </div>
                <a className="organizer-link" href="#about">
                    Tìm hiểu thêm
                    <MaterialIcon>arrow_forward</MaterialIcon>
                </a>
                <div className="organizer-preview" aria-hidden="true">
                    <div className="preview-window">
                        <span />
                        <span />
                        <span />
                        <div className="preview-bars">
                            <i />
                            <i />
                            <i />
                        </div>
                        <div className="preview-line" />
                    </div>
                    <div className="preview-card small" />
                    <div className="preview-card calendar" />
                </div>
            </section>

            <section className="metrics-strip" aria-label="Số liệu izTicket">
                {metrics.map((metric) => (
                    <article className="metric-item" key={metric.label}>
                        <span>
                            <MaterialIcon>{metric.icon}</MaterialIcon>
                        </span>
                        <div>
                            <h2>{metric.value}</h2>
                            <p>{metric.label}</p>
                        </div>
                    </article>
                ))}
            </section>
        </main>
    );
}

export default App;
