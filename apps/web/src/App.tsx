import AuthPage from './AuthPage';
import { useEffect, useState } from 'react';
import { CheckoutPage } from './CheckoutPage';
import EventDetailPage from './EventDetailPage';
import EventsPage from './EventsPage';
import { MyTicketDetailPage } from './MyTicketDetailPage';
import { MyTicketsPage } from './MyTicketsPage';
import { PaymentResultPage } from './PaymentResultPage';
import { OrganizerEventsPage } from './OrganizerEventsPage';
import { EventFormPage } from './EventFormPage';
import { AdminEventsPage } from './AdminEventsPage';
import { AdminReviewPage } from './AdminReviewPage';
import { OrganizerEventDetailPage } from './OrganizerEventDetailPage';
import {
    listPublicEvents,
    type PublicEventListItem,
} from './api/events.api';
import { getRoleLabel, getStoredAuthUser } from './authSession';
import { logout } from './dashboardLogout';
import './App.css';

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

type Review = {
    quote: string;
    name: string;
    role: string;
    avatar: string;
};

type Sponsor = {
    name: string;
    tone: 'green' | 'magenta' | 'red' | 'orange' | 'blue' | 'navy';
};

type FooterGroup = {
    title: string;
    links: string[];
};

const fallbackEventImage =
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=720&q=80';

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

const categoryTabs = [
    { label: 'Âm nhạc', value: 'music' },
    { label: 'Thể thao', value: 'sports' },
    { label: 'Hội thảo', value: 'conference' },
    { label: 'Giải trí', value: 'entertainment' },
    { label: 'Workshop', value: 'workshop' },
    { label: 'Esports', value: 'esports' },
];

const reviews: Review[] = [
    {
        quote: 'Mua vé cực nhanh, nhận vé trong 30 giây. Giao diện dễ dùng và rất chuyên nghiệp.',
        name: 'Nguyễn Minh Anh',
        role: 'Khách hàng',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    },
    {
        quote: 'Tổ chức sự kiện dễ hơn nhiều nhờ công cụ quản lý và báo cáo của izTicket.',
        name: 'Trần Quốc Trung',
        role: 'BTC Tech Summit',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80',
    },
    {
        quote: 'Thanh toán an toàn, hỗ trợ nhiệt tình. Sẽ tiếp tục đồng hành cùng izTicket!',
        name: 'Lê Phương Linh',
        role: 'Khách hàng',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    },
];

const sponsors: Sponsor[] = [
    { name: 'Vietcombank', tone: 'green' },
    { name: 'momo', tone: 'magenta' },
    { name: 'TECHCOMBANK', tone: 'red' },
    { name: 'FPT', tone: 'orange' },
    { name: 'VNG', tone: 'orange' },
    { name: 'SePay', tone: 'blue' },
];

const faqs = [
    'Làm sao để nhận vé sau khi thanh toán?',
    'izTicket có đảm bảo vé thật không?',
    'Có hoàn tiền nếu không tham dự được không?',
    'Thanh toán qua SePay có an toàn không?',
    'Tôi có thể chuyển nhượng vé cho người khác không?',
    'Tôi cần hỗ trợ, liên hệ ở đâu?',
];

const footerGroups: FooterGroup[] = [
    {
        title: 'Về izTicket',
        links: ['Giới thiệu', 'Tin tức', 'Tuyển dụng', 'Liên hệ'],
    },
    {
        title: 'Hỗ trợ',
        links: ['Trung tâm trợ giúp', 'Hướng dẫn mua vé', 'Chính sách bảo mật', 'Điều khoản sử dụng'],
    },
    {
        title: 'Dành cho tổ chức',
        links: ['Tạo sự kiện', 'Bảng giá', 'Tính năng', 'Tài liệu hướng dẫn'],
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

function EventCard({ event }: { event: PublicEventListItem }) {
    return (
        <article className="event-card">
            <div className="event-image-wrap">
                <img src={event.thumbnailUrl ?? fallbackEventImage} alt={event.title} />
                <span className="event-status blue">Đang mở bán</span>
            </div>
            <div className="event-body">
                <h3>
                    <a href={`/events/${event.id}`}>{event.title}</a>
                </h3>
                <div className="event-meta-row">
                    <span>
                        <MaterialIcon>calendar_today</MaterialIcon>
                        {formatHomeDate(event.startsAt)}
                    </span>
                    <span>
                        <MaterialIcon>location_on</MaterialIcon>
                        {event.city}
                    </span>
                </div>
                <div className="event-price-row">
                    <strong>{formatHomePrice(event.minPrice)}</strong>
                    <button type="button" aria-label={`Lưu ${event.title}`}>
                        <MaterialIcon>favorite</MaterialIcon>
                    </button>
                </div>
            </div>
        </article>
    );
}

function CategoryEventCard({ event }: { event: PublicEventListItem }) {
    return (
        <article className="category-event-card">
            <img src={event.thumbnailUrl ?? fallbackEventImage} alt={event.title} />
            <div className="category-event-body">
                <h3>
                    <a href={`/events/${event.id}`}>{event.title}</a>
                </h3>
                <div className="event-meta-row">
                    <span>
                        <MaterialIcon>calendar_today</MaterialIcon>
                        {formatHomeDate(event.startsAt)}
                    </span>
                    <span>
                        <MaterialIcon>location_on</MaterialIcon>
                        {event.city}
                    </span>
                </div>
                <div className="event-price-row">
                    <strong>{formatHomePrice(event.minPrice)}</strong>
                    <button type="button" aria-label={`Lưu ${event.title}`}>
                        <MaterialIcon>favorite</MaterialIcon>
                    </button>
                </div>
            </div>
        </article>
    );
}

function ReviewCard({ review }: { review: Review }) {
    return (
        <article className="review-card">
            <div className="stars" aria-label="5 sao">
                {[0, 1, 2, 3, 4].map((star) => (
                    <MaterialIcon key={star}>star</MaterialIcon>
                ))}
            </div>
            <p>{review.quote}</p>
            <div className="reviewer">
                <img src={review.avatar} alt={review.name} />
                <div>
                    <h3>{review.name}</h3>
                    <span>{review.role}</span>
                </div>
            </div>
        </article>
    );
}

function HeaderAccountActions() {
    const user = getStoredAuthUser();

    if (!user) {
        return (
            <>
                <a className="ghost-button" href="/auth/login">
                    Đăng nhập
                </a>
                <a className="dark-button" href="/auth/register">
                    Đăng ký
                </a>
            </>
        );
    }

    const dashHref =
        user.role === 'ORGANIZER'
            ? '/organizer/events'
            : user.role === 'ADMIN'
              ? '/admin/events'
              : null;

    return (
        <>
            {dashHref && (
                <a className="dark-button" href={dashHref}>
                    Dashboard
                </a>
            )}
            <div className="user-chip">
                <span>{getInitials(user.name)}</span>
                <div>
                    <strong>{user.name}</strong>
                    <small>{getRoleLabel(user.role)}</small>
                </div>
            </div>
            <button className="header-logout-button" type="button" onClick={logout}>
                <MaterialIcon>logout</MaterialIcon>
                Đăng xuất
            </button>
        </>
    );
}

function App() {
    const path = window.location.pathname;
    const [homeEvents, setHomeEvents] = useState<PublicEventListItem[]>([]);
    const [homeEventsLoading, setHomeEventsLoading] = useState(false);
    const [homeEventsError, setHomeEventsError] = useState('');
    const [homeSearchQuery, setHomeSearchQuery] = useState('');

    useEffect(() => {
        if (path !== '/') return;

        let active = true;
        setHomeEventsLoading(true);
        setHomeEventsError('');

        listPublicEvents({ page: 1, limit: 8 })
            .then((page) => {
                if (!active) return;
                setHomeEvents(page.items);
            })
            .catch((err: unknown) => {
                if (!active) return;
                setHomeEvents([]);
                setHomeEventsError(
                    err instanceof Error
                        ? err.message
                        : 'Không thể tải danh sách sự kiện.',
                );
            })
            .finally(() => {
                if (active) setHomeEventsLoading(false);
            });

        return () => {
            active = false;
        };
    }, [path]);

    const heroEvent = homeEvents[0];
    const featuredEvents = homeEvents.slice(0, 6);
    const upcomingEvents = homeEvents.slice(0, 5);

    if (path === '/auth/login' || path === '/auth/register') {
        if (getStoredAuthUser()) {
            window.location.replace('/');
            return null;
        }

        return <AuthPage mode={path === '/auth/login' ? 'login' : 'register'} />;
    }

    if (path === '/events') {
        return <EventsPage />;
    }

    if (path.startsWith('/checkout/')) {
        return (
            <CheckoutPage
                reservationId={decodeURIComponent(path.replace('/checkout/', ''))}
            />
        );
    }

    if (path === '/payment-result') {
        return <PaymentResultPage />;
    }

    if (path === '/my-tickets') {
        return <MyTicketsPage />;
    }

    if (path.startsWith('/my-tickets/')) {
        return (
            <MyTicketDetailPage
                ticketId={decodeURIComponent(path.replace('/my-tickets/', ''))}
            />
        );
    }

    if (path.startsWith('/events/')) {
        return (
            <EventDetailPage
                eventId={decodeURIComponent(path.replace('/events/', ''))}
            />
        );
    }

    if (path === '/organizer/events') {
        return <OrganizerEventsPage />;
    }

    if (path === '/organizer/events/new') {
        return <EventFormPage mode="create" />;
    }

    if (
        path.startsWith('/organizer/events/') &&
        path.endsWith('/edit')
    ) {
        const eventId = path
            .replace('/organizer/events/', '')
            .replace('/edit', '');
        return <EventFormPage mode="edit" eventId={eventId} />;
    }

    if (path === '/admin/events') {
        return <AdminEventsPage />;
    }

    if (
        path.startsWith('/admin/events/') &&
        path.endsWith('/review')
    ) {
        const eventId = path
            .replace('/admin/events/', '')
            .replace('/review', '');
        return <AdminReviewPage eventId={eventId} />;
    }

    if (
        path.startsWith('/organizer/events/') &&
        !path.endsWith('/edit')
    ) {
        const eventId = path.replace('/organizer/events/', '');
        return <OrganizerEventDetailPage eventId={eventId} />;
    }

    return (
        <main className="landing-shell">
            <header className="site-header">
                <a className="brand" href="/">
                    <BrandMark />
                    <span>izTicket</span>
                </a>

                <nav className="main-nav" aria-label="Điều hướng chính">
                    <a className="active" href="#">
                        Trang chủ
                    </a>
                    <a href="/events">Sự kiện</a>
                    <a href="/#organizers">Dành cho tổ chức</a>
                    <a href="#about">Giới thiệu</a>
                    <a href="#support">Hỗ trợ</a>
                </nav>

                <div className="header-actions">
                    <button className="language-button" type="button">
                        <MaterialIcon>language</MaterialIcon>
                        VI
                        <MaterialIcon>expand_more</MaterialIcon>
                    </button>
                    <HeaderAccountActions />
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
                        onSubmit={(event) => {
                            event.preventDefault();
                            const search = homeSearchQuery.trim();
                            window.location.href = search
                                ? `/events?q=${encodeURIComponent(search)}`
                                : '/events';
                        }}
                    >
                        <label className="search-field">
                            <MaterialIcon>search</MaterialIcon>
                            <span className="sr-only">Từ khóa sự kiện</span>
                            <input
                                value={homeSearchQuery}
                                onChange={(event) => setHomeSearchQuery(event.target.value)}
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
                        <h2>{heroEvent?.title ?? 'Sự kiện đang mở bán'}</h2>
                        <div className="hero-event-meta">
                            <span>
                                <MaterialIcon>calendar_today</MaterialIcon>
                                {heroEvent ? formatHomeDate(heroEvent.startsAt) : 'Đang cập nhật'}
                            </span>
                            <span>
                                <MaterialIcon>location_on</MaterialIcon>
                                {heroEvent?.city ?? 'izTicket'}
                            </span>
                        </div>
                        <a href={heroEvent ? `/events/${heroEvent.id}` : '/events'}>
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
                    <a href="/events">
                        Xem tất cả
                        <MaterialIcon>arrow_forward</MaterialIcon>
                    </a>
                </div>
                <div className="event-grid">
                    {homeEventsLoading ? (
                        <p className="landing-event-state">Đang tải sự kiện...</p>
                    ) : homeEventsError ? (
                        <p className="landing-event-state">{homeEventsError}</p>
                    ) : featuredEvents.length === 0 ? (
                        <p className="landing-event-state">Chưa có sự kiện đang mở bán.</p>
                    ) : (
                        featuredEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))
                    )}
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

            <section className="category-showcase">
                <div className="section-title-row">
                    <div>
                        <h2>Sự kiện sắp diễn ra theo danh mục</h2>
                        <div className="category-tabs" aria-label="Danh mục sự kiện">
                            {categoryTabs.map((tab, index) => (
                                <button
                                    className={index === 0 ? 'active' : ''}
                                    key={tab.value}
                                    type="button"
                                    onClick={() => {
                                        window.location.href = `/events?category=${encodeURIComponent(tab.value)}`;
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <a href="/events">
                        Xem tất cả
                        <MaterialIcon>arrow_forward</MaterialIcon>
                    </a>
                </div>

                <div className="category-event-row">
                    {homeEventsLoading ? (
                        <p className="landing-event-state">Đang tải sự kiện...</p>
                    ) : homeEventsError ? (
                        <p className="landing-event-state">{homeEventsError}</p>
                    ) : upcomingEvents.length === 0 ? (
                        <p className="landing-event-state">Chưa có sự kiện phù hợp.</p>
                    ) : (
                        upcomingEvents.map((event) => (
                            <CategoryEventCard event={event} key={event.id} />
                        ))
                    )}
                    <a className="round-next-button" href="/events" aria-label="Xem thêm sự kiện">
                        <MaterialIcon>chevron_right</MaterialIcon>
                    </a>
                </div>
            </section>

            <section className="social-proof-section">
                <div className="reviews-block">
                    <h2>Khách hàng nói gì về izTicket</h2>
                    <div className="review-grid">
                        {reviews.map((review) => (
                            <ReviewCard key={review.name} review={review} />
                        ))}
                    </div>
                </div>

                <div className="sponsors-block">
                    <h2>Được tin dùng bởi</h2>
                    <div className="sponsor-grid">
                        {sponsors.map((sponsor) => (
                            <article className={`sponsor-card ${sponsor.tone}`} key={sponsor.name}>
                                {sponsor.name}
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="faq-section">
                <h2>Câu hỏi thường gặp</h2>
                <div className="faq-grid">
                    {faqs.map((question) => (
                        <details className="faq-item" key={question}>
                            <summary>
                                {question}
                                <MaterialIcon>expand_more</MaterialIcon>
                            </summary>
                            <p>
                                Đội ngũ izTicket luôn sẵn sàng hỗ trợ để giao dịch
                                của bạn diễn ra rõ ràng và an toàn.
                            </p>
                        </details>
                    ))}
                </div>
            </section>

            <section className="bottom-cta">
                <div>
                    <h2>Sẵn sàng khám phá sự kiện tiếp theo?</h2>
                    <p>Hàng ngàn sự kiện đang chờ bạn. Đừng bỏ lỡ!</p>
                </div>
                <a href="#events">
                    Tìm sự kiện ngay
                    <MaterialIcon>arrow_forward</MaterialIcon>
                </a>
            </section>

            <footer className="site-footer">
                <div className="footer-brand">
                    <a className="brand" href="#">
                        <BrandMark />
                        <span>izTicket</span>
                    </a>
                    <p>
                        Nền tảng vé sự kiện thông minh.
                        <br />
                        Kết nối bạn với những trải nghiệm đáng nhớ.
                    </p>
                    <div className="social-links" aria-label="Mạng xã hội">
                        {['facebook', 'photo_camera', 'music_note', 'smart_display'].map((icon) => (
                            <a href="#" key={icon}>
                                <MaterialIcon>{icon}</MaterialIcon>
                            </a>
                        ))}
                    </div>
                </div>

                {footerGroups.map((group) => (
                    <nav className="footer-column" key={group.title} aria-label={group.title}>
                        <h2>{group.title}</h2>
                        {group.links.map((link) => (
                            <a href="#" key={link}>
                                {link}
                            </a>
                        ))}
                    </nav>
                ))}

                <div className="footer-column contact-column" id="support">
                    <h2>Liên hệ</h2>
                    <span>
                        <MaterialIcon>mail</MaterialIcon>
                        support@izticket.vn
                    </span>
                    <span>
                        <MaterialIcon>call</MaterialIcon>
                        1900 1234
                    </span>
                    <span>
                        <MaterialIcon>location_on</MaterialIcon>
                        S9C Nguyễn Đình Chiểu, P. Võ Thị Sáu, Q.3, TP.HCM
                    </span>
                </div>

                <div className="footer-bottom">
                    <span>© 2026 izTicket. All rights reserved.</span>
                    <button className="footer-language" type="button">
                        VI
                        <MaterialIcon>expand_more</MaterialIcon>
                    </button>
                </div>
            </footer>
        </main>
    );
}

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(-2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function formatHomeDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value));
}

function formatHomePrice(value: number | null) {
    if (value === null) return 'Chưa mở bán';
    return `Từ ${new Intl.NumberFormat('vi-VN').format(value)}đ`;
}

export default App;
