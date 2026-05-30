import { useMemo, useState, type CSSProperties } from 'react';
import {
    MaterialIcon,
    PublicFooter,
    PublicHeader,
} from './PublicLayout';
import './EventDetailPage.css';

type TicketType = {
    id: string;
    color: string;
    description: string;
    name: string;
    price: number;
    selected?: boolean;
};

type RelatedEvent = {
    date: string;
    image: string;
    location: string;
    price: string;
    status: string;
    statusTone: 'blue' | 'red';
    title: string;
};

const tickets: TicketType[] = [
    {
        id: 'vip-standing',
        color: '#ff2f92',
        description:
            'Khu vực đứng gần sân khấu nhất, ưu tiên vào cổng riêng, tặng kèm quà lưu niệm.',
        name: 'VIP Standing',
        price: 2_500_000,
        selected: true,
    },
    {
        id: 'ga-standing',
        color: '#1e73ff',
        description: 'Khu vực đứng tự do, tầm nhìn tốt.',
        name: 'GA Standing',
        price: 1_200_000,
    },
    {
        id: 'ga-seating',
        color: '#59c76a',
        description: 'Khu vực ghế ngồi có số, tầm nhìn toàn sân khấu.',
        name: 'GA Seating',
        price: 800_000,
    },
    {
        id: 'early-bird',
        color: '#a66df2',
        description: 'Vé 2 ngày với ưu đãi đặc biệt, số lượng có hạn.',
        name: 'Early Bird 2-Day Pass',
        price: 3_500_000,
    },
];

const artists = [
    ['Sơn Tùng M-TP', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80'],
    ['AMEE', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'],
    ['Binz', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=120&q=80'],
    ['Suboi', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'],
    ['The 1975', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=120&q=80'],
    ['Hoàng Thùy Linh', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=120&q=80'],
    ['JP Saxe', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80'],
];

const relatedEvents: RelatedEvent[] = [
    {
        date: '31 MAY',
        image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=560&q=80',
        location: 'SVĐ Mỹ Đình, Hà Nội',
        price: 'Từ 450.000đ',
        status: 'Sắp diễn ra',
        statusTone: 'red',
        title: 'Đen Vâu Live in Concert',
    },
    {
        date: '07 JUN',
        image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=560&q=80',
        location: 'Cung Văn hóa Hữu nghị, Hà Nội',
        price: 'Từ 390.000đ',
        status: 'Sắp diễn ra',
        statusTone: 'red',
        title: 'AMEE Show: Dreamy Night',
    },
    {
        date: '20 JUN',
        image: 'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?auto=format&fit=crop&w=560&q=80',
        location: 'Nhà thi đấu Quân khu 7, TP.HCM',
        price: 'Từ 300.000đ',
        status: 'Sắp diễn ra',
        statusTone: 'red',
        title: 'Vietgangz Brotherhood',
    },
    {
        date: '12 JUL',
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=560&q=80',
        location: 'Hoàng Thành Thăng Long, Hà Nội',
        price: 'Từ 650.000đ',
        status: 'Mới mở bán',
        statusTone: 'blue',
        title: 'GENFest 2026',
    },
];

function EventDetailPage({ eventId }: { eventId: string }) {
    const [quantities, setQuantities] = useState<Record<string, number>>({
        'vip-standing': 2,
    });
    const currentEventId = eventId || 'monsoon-music-festival-2026';

    const total = useMemo(
        () =>
            tickets.reduce(
                (sum, ticket) => sum + (quantities[ticket.id] ?? 0) * ticket.price,
                0,
            ),
        [quantities],
    );

    function updateQuantity(ticketId: string, delta: number) {
        setQuantities((current) => {
            const nextQuantity = Math.max(0, (current[ticketId] ?? 0) + delta);
            return { ...current, [ticketId]: nextQuantity };
        });
    }

    return (
        <main className="event-detail-page" data-event-id={currentEventId}>
            <PublicHeader active="events" />

            <div className="detail-breadcrumb">
                <a href="/events">
                    <MaterialIcon>arrow_back</MaterialIcon>
                    Trang chủ
                </a>
                <MaterialIcon>chevron_right</MaterialIcon>
                <a href="/events">Sự kiện</a>
                <MaterialIcon>chevron_right</MaterialIcon>
                <span>Monsoon Music Festival 2026</span>
            </div>

            <section className="detail-layout">
                <div className="detail-main">
                    <section className="event-hero-card">
                        <img
                            src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1400&q=90"
                            alt="Monsoon Music Festival 2026"
                        />
                        <button className="hero-favorite" type="button" aria-label="Lưu sự kiện">
                            <MaterialIcon>favorite</MaterialIcon>
                        </button>
                        <div className="event-hero-overlay">
                            <span>Sắp diễn ra</span>
                            <h1>Monsoon Music Festival 2026</h1>
                            <div className="hero-meta-line">
                                <p>
                                    <MaterialIcon>calendar_today</MaterialIcon>
                                    24 - 25.06.2026
                                </p>
                                <p>
                                    <MaterialIcon>location_on</MaterialIcon>
                                    Hoàng Thành Thăng Long, Hà Nội
                                </p>
                            </div>
                            <div className="hero-tags">
                                {['Âm nhạc', 'Festival', 'Outdoor', '18+'].map((tag) => (
                                    <strong key={tag}>{tag}</strong>
                                ))}
                            </div>
                        </div>
                        <button className="photo-button" type="button">
                            <MaterialIcon>grid_view</MaterialIcon>
                            Xem tất cả 18 ảnh
                        </button>
                    </section>

                    <section className="info-card about-card">
                        <div>
                            <h2>Giới thiệu</h2>
                            <p>
                                Monsoon Music Festival trở lại mùa hè 2026 với 2
                                ngày bùng nổ cùng dàn nghệ sĩ hàng đầu Việt Nam.
                                Trải nghiệm sân khấu hoành tráng, âm thanh đỉnh
                                cao và không khí lễ hội khó quên!
                            </p>
                            <a href="#more">
                                Xem thêm
                                <MaterialIcon>expand_more</MaterialIcon>
                            </a>
                        </div>
                        <div className="event-facts">
                            {[
                                ['calendar_month', 'Thời gian', '24 - 25.06.2026'],
                                ['schedule', 'Cổng mở cửa', '15:00'],
                                ['location_on', 'Địa điểm', 'Hoàng Thành Thăng Long\n19C Hoàng Diệu, Ba Đình, Hà Nội'],
                                ['group', 'Độ tuổi', '18+ (Có ID khi tham dự)'],
                            ].map(([icon, label, value]) => (
                                <article key={label}>
                                    <span>
                                        <MaterialIcon>{icon}</MaterialIcon>
                                    </span>
                                    <div>
                                        <h3>{label}</h3>
                                        <p>{value}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="info-card lineup-card">
                        <h2>Line-up nổi bật</h2>
                        <div className="artist-row">
                            {artists.map(([name, avatar]) => (
                                <article key={name}>
                                    <img src={avatar} alt={name} />
                                    <span>{name}</span>
                                </article>
                            ))}
                            <article className="more-artists">
                                <span>And more...</span>
                            </article>
                        </div>
                    </section>

                    <section className="info-card location-card">
                        <div>
                            <h2>Địa điểm</h2>
                            <h3>Hoàng Thành Thăng Long</h3>
                            <p>
                                <MaterialIcon>location_on</MaterialIcon>
                                19C Hoàng Diệu, Ba Đình, Hà Nội
                            </p>
                            <p>
                                Khu di tích lịch sử kết hợp không gian tổ chức sự
                                kiện ngoài trời rộng lớn, thuận tiện di chuyển.
                            </p>
                            <button type="button">
                                Xem đường đi
                                <MaterialIcon>open_in_new</MaterialIcon>
                            </button>
                        </div>
                        <div className="map-preview">
                            <div>
                                <MaterialIcon>location_on</MaterialIcon>
                                <strong>Hoàng Thành Thăng Long</strong>
                            </div>
                        </div>
                    </section>

                    <section className="info-card detail-table-card">
                        <nav>
                            <a className="active" href="#info">Thông tin sự kiện</a>
                            <a href="#rules">Quy định tham dự</a>
                            <a href="#policy">Chính sách vé</a>
                        </nav>
                        <div className="detail-table-grid">
                            <table>
                                <tbody>
                                    {[
                                        ['Thời gian', '24 - 25.06.2026\n(2 ngày)'],
                                        ['Cổng mở cửa', '15:00'],
                                        ['Thời lượng', '~ 8 giờ / ngày'],
                                        ['Thể loại', 'Âm nhạc, Festival'],
                                        ['Ngôn ngữ', 'Tiếng Việt, Tiếng Anh'],
                                    ].map(([label, value]) => (
                                        <tr key={label}>
                                            <th>{label}</th>
                                            <td>{value}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div>
                                <h3>Lưu ý</h3>
                                <ul>
                                    <li>Không mang đồ ăn, thức uống từ bên ngoài.</li>
                                    <li>Không mang vũ khí, chất cháy nổ.</li>
                                    <li>Tuân thủ hướng dẫn của BTC và nhân viên an ninh.</li>
                                    <li>Sự kiện có thể quay/chụp hình và dùng cho mục đích truyền thông.</li>
                                </ul>
                                <a href="#rules">Xem chi tiết quy định</a>
                            </div>
                        </div>
                    </section>

                    <section className="reviews-section">
                        <h2>Đánh giá từ người tham dự</h2>
                        <div className="review-summary">
                            <article className="rating-card">
                                <strong>4.8<span>/5</span></strong>
                                <div className="review-stars">
                                    {[0, 1, 2, 3, 4].map((star) => (
                                        <MaterialIcon key={star}>star</MaterialIcon>
                                    ))}
                                </div>
                                <p>Dựa trên 128 đánh giá</p>
                            </article>
                            <article className="rating-bars">
                                {[['5', '89%'], ['4', '8%'], ['3', '2%'], ['2', '1%'], ['1', '0%']].map(
                                    ([star, percent]) => (
                                        <div key={star}>
                                            <span>{star} ★</span>
                                            <i>
                                                <b style={{ width: percent }} />
                                            </i>
                                            <small>{percent}</small>
                                        </div>
                                    ),
                                )}
                            </article>
                            {['Minh Anh', 'Tuấn Kiệt', 'Hà Linh'].map((name, index) => (
                                <article className="attendee-review" key={name}>
                                    <div>
                                        <img
                                            src={`https://images.unsplash.com/photo-${index === 0 ? '1494790108377-be9c29b29330' : index === 1 ? '1500648767791-00dcc994a43e' : '1508214751196-bcfd4ca60f91'}?auto=format&fit=crop&w=100&q=80`}
                                            alt={name}
                                        />
                                        <span>
                                            <strong>{name}</strong>
                                            <small>{18 - index}.08.2024</small>
                                        </span>
                                    </div>
                                    <div className="review-stars">
                                        {[0, 1, 2, 3, 4].map((star) => (
                                            <MaterialIcon key={star}>star</MaterialIcon>
                                        ))}
                                    </div>
                                    <p>
                                        {index === 0
                                            ? 'Sân khấu cực cháy! Âm thanh, ánh sáng đỉnh cao. Sẽ quay lại vào năm sau!'
                                            : index === 1
                                              ? 'Tổ chức chuyên nghiệp, đổi vé nhanh, nhân viên hỗ trợ nhiệt tình.'
                                              : 'Line-up chất lượng, không khí tuyệt vời! Highly recommend!'}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="related-section">
                        <div className="section-title-row">
                            <h2>Bạn có thể quan tâm</h2>
                            <button type="button" aria-label="Xem thêm">
                                <MaterialIcon>chevron_right</MaterialIcon>
                            </button>
                        </div>
                        <div className="related-grid">
                            {relatedEvents.map((event) => (
                                <article className="related-card" key={event.title}>
                                    <div>
                                        <img src={event.image} alt={event.title} />
                                        <span className={`status-pill ${event.statusTone}`}>{event.status}</span>
                                    </div>
                                    <section>
                                        <time>{event.date}</time>
                                        <div>
                                            <h3>{event.title}</h3>
                                            <p>{event.location}</p>
                                            <strong>{event.price}</strong>
                                        </div>
                                        <button type="button" aria-label={`Lưu ${event.title}`}>
                                            <MaterialIcon>favorite</MaterialIcon>
                                        </button>
                                    </section>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>

                <aside className="ticket-sidebar">
                    <section className="ticket-panel">
                        <header>
                            <h2>Chọn loại vé</h2>
                            <span>
                                <MaterialIcon>timer</MaterialIcon>
                                Vé đang được giữ trong <strong>99:48</strong>
                            </span>
                        </header>

                        <div className="ticket-options">
                            {tickets.map((ticket) => (
                                <article
                                    className={ticket.selected ? 'selected' : ''}
                                    key={ticket.id}
                                    style={{ '--ticket-color': ticket.color } as CSSProperties}
                                >
                                    <div>
                                        <span />
                                        <h3>{ticket.name}</h3>
                                        {ticket.selected ? <em>Được chọn</em> : null}
                                        <strong>{formatCurrency(ticket.price)}</strong>
                                    </div>
                                    <p>{ticket.description}</p>
                                    <div className="quantity-row">
                                        <label>Số lượng</label>
                                        <div>
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(ticket.id, -1)}
                                            >
                                                <MaterialIcon>remove</MaterialIcon>
                                            </button>
                                            <span>{quantities[ticket.id] ?? 0}</span>
                                            <button
                                                type="button"
                                                onClick={() => updateQuantity(ticket.id, 1)}
                                            >
                                                <MaterialIcon>add</MaterialIcon>
                                            </button>
                                        </div>
                                        <small>
                                            Tạm tính
                                            <strong>
                                                {formatCurrency((quantities[ticket.id] ?? 0) * ticket.price)}
                                            </strong>
                                        </small>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <footer className="ticket-total">
                            <div>
                                <span>Tổng cộng</span>
                                <strong>{formatCurrency(total)}</strong>
                                <small>Đã bao gồm VAT (nếu có)</small>
                            </div>
                            <button type="button" disabled={total === 0}>
                                Tiếp tục đặt vé
                                <MaterialIcon>arrow_forward</MaterialIcon>
                            </button>
                            <p>
                                <MaterialIcon>shield</MaterialIcon>
                                Bạn sẽ chọn chỗ (nếu có) ở bước tiếp theo
                            </p>
                        </footer>
                    </section>

                    <section className="ticket-benefits">
                        {[
                            ['verified_user', 'Thanh toán an toàn', 'Được bảo mật bởi SePay'],
                            ['confirmation_number', 'Vé điện tử tiện lợi', 'Nhận vé qua email hoặc trong tài khoản'],
                            ['support_agent', 'Hỗ trợ 24/7', 'Luôn sẵn sàng giúp bạn'],
                        ].map(([icon, title, text]) => (
                            <article key={title}>
                                <span>
                                    <MaterialIcon>{icon}</MaterialIcon>
                                </span>
                                <div>
                                    <h3>{title}</h3>
                                    <p>{text}</p>
                                </div>
                            </article>
                        ))}
                    </section>
                </aside>
            </section>

            <PublicFooter />
        </main>
    );
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
}

export default EventDetailPage;
