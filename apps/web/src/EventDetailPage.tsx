import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
    MaterialIcon,
    PublicFooter,
    PublicHeader,
} from './PublicLayout';
import {
    getPublicEvent,
    type PublicEventDetail,
    type PublicTicketType,
} from './api/events.api';
import './EventDetailPage.css';

const fallbackImage =
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1400&q=90';

const ticketColors = ['#ff2f92', '#1e73ff', '#59c76a', '#a66df2', '#ff9f1c'];

function EventDetailPage({ eventId }: { eventId: string }) {
    const [event, setEvent] = useState<PublicEventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');

        getPublicEvent(eventId)
            .then((eventDetail) => {
                if (active) setEvent(eventDetail);
            })
            .catch((err: unknown) => {
                if (!active) return;
                setEvent(null);
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Không thể tải chi tiết sự kiện.',
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [eventId]);

    if (loading) {
        return (
            <DetailShell>
                <DetailState
                    icon="hourglass_top"
                    title="Đang tải sự kiện"
                    text="Chi tiết sự kiện sẽ hiển thị ngay khi API phản hồi."
                />
            </DetailShell>
        );
    }

    if (error || !event) {
        return (
            <DetailShell>
                <DetailState
                    icon="error"
                    title="Không thể tải sự kiện"
                    text={error || 'Sự kiện không tồn tại hoặc chưa được công bố.'}
                />
            </DetailShell>
        );
    }

    const dateRange = formatDateRange(event.startsAt, event.endsAt);
    const address = [
        event.venue.address,
        event.venue.district,
        event.venue.city,
    ]
        .filter(Boolean)
        .join(', ');

    return (
        <main className="event-detail-page" data-event-id={event.id}>
            <PublicHeader active="events" />

            <div className="detail-breadcrumb">
                <a href="/events">
                    <MaterialIcon>arrow_back</MaterialIcon>
                    Sự kiện
                </a>
                <MaterialIcon>chevron_right</MaterialIcon>
                <span>{event.title}</span>
            </div>

            <section className="detail-layout">
                <div className="detail-main">
                    <section className="event-hero-card">
                        <img
                            src={event.thumbnailUrl ?? fallbackImage}
                            alt={event.title}
                        />
                        <button className="hero-favorite" type="button" aria-label="Lưu sự kiện">
                            <MaterialIcon>favorite</MaterialIcon>
                        </button>
                        <div className="event-hero-overlay">
                            <span>Đang mở bán</span>
                            <h1>{event.title}</h1>
                            <div className="hero-meta-line">
                                <p>
                                    <MaterialIcon>calendar_today</MaterialIcon>
                                    {dateRange}
                                </p>
                                <p>
                                    <MaterialIcon>location_on</MaterialIcon>
                                    {event.venue.name}, {event.venue.city}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="info-card about-card">
                        <div>
                            <h2>Giới thiệu</h2>
                            <p>{event.description}</p>
                        </div>
                        <div className="event-facts">
                            <Fact icon="calendar_month" label="Thời gian" value={dateRange} />
                            <Fact icon="location_on" label="Địa điểm" value={`${event.venue.name}\n${address}`} />
                            <Fact icon="confirmation_number" label="Loại vé" value={`${event.ticketTypes.length} hạng vé`} />
                            <Fact icon="verified_user" label="Trạng thái" value="Đã được duyệt" />
                        </div>
                    </section>

                    <section className="info-card location-card">
                        <div>
                            <h2>Địa điểm</h2>
                            <h3>{event.venue.name}</h3>
                            <p>
                                <MaterialIcon>location_on</MaterialIcon>
                                {address}
                            </p>
                            {event.venue.mapUrl ? (
                                <a className="map-link" href={event.venue.mapUrl}>
                                    Xem đường đi
                                    <MaterialIcon>open_in_new</MaterialIcon>
                                </a>
                            ) : null}
                        </div>
                        <div className="map-preview">
                            <div>
                                <MaterialIcon>location_on</MaterialIcon>
                                <strong>{event.venue.name}</strong>
                            </div>
                        </div>
                    </section>

                    <section className="info-card detail-table-card">
                        <nav>
                            <a className="active" href="#info">Thông tin sự kiện</a>
                            <a href="#tickets">Vé</a>
                        </nav>
                        <div className="detail-table-grid">
                            <table>
                                <tbody>
                                    <tr>
                                        <th>Thời gian bắt đầu</th>
                                        <td>{formatDateTime(event.startsAt)}</td>
                                    </tr>
                                    <tr>
                                        <th>Thời gian kết thúc</th>
                                        <td>{formatDateTime(event.endsAt)}</td>
                                    </tr>
                                    <tr>
                                        <th>Địa điểm</th>
                                        <td>{event.venue.name}</td>
                                    </tr>
                                    <tr>
                                        <th>Thành phố</th>
                                        <td>{event.venue.city}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div>
                                <h3>Lưu ý</h3>
                                <ul>
                                    <li>Vé chỉ được giữ sau khi tạo reservation thành công.</li>
                                    <li>Số lượng còn lại có thể thay đổi khi người khác đặt vé.</li>
                                    <li>Hoàn tất thanh toán trước khi reservation hết hạn.</li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>

                <TicketSidebar tickets={event.ticketTypes} />
            </section>

            <PublicFooter />
        </main>
    );
}

function DetailShell({ children }: { children: ReactNode }) {
    return (
        <main className="event-detail-page">
            <PublicHeader active="events" />
            <div className="detail-breadcrumb">
                <a href="/events">
                    <MaterialIcon>arrow_back</MaterialIcon>
                    Sự kiện
                </a>
            </div>
            {children}
            <PublicFooter />
        </main>
    );
}

function DetailState({
    icon,
    text,
    title,
}: {
    icon: string;
    text: string;
    title: string;
}) {
    return (
        <section className="detail-state">
            <MaterialIcon>{icon}</MaterialIcon>
            <h1>{title}</h1>
            <p>{text}</p>
        </section>
    );
}

function Fact({
    icon,
    label,
    value,
}: {
    icon: string;
    label: string;
    value: string;
}) {
    return (
        <article>
            <span>
                <MaterialIcon>{icon}</MaterialIcon>
            </span>
            <div>
                <h3>{label}</h3>
                <p>{value}</p>
            </div>
        </article>
    );
}

function TicketSidebar({ tickets }: { tickets: PublicTicketType[] }) {
    const minPrice = useMemo(
        () => tickets.reduce<number | null>(
            (lowest, ticket) =>
                lowest === null ? ticket.price : Math.min(lowest, ticket.price),
            null,
        ),
        [tickets],
    );

    return (
        <aside className="ticket-sidebar" id="tickets">
            <section className="ticket-panel">
                <header>
                    <h2>Loại vé</h2>
                    <span>
                        <MaterialIcon>confirmation_number</MaterialIcon>
                        {tickets.length} hạng vé
                    </span>
                </header>

                {tickets.length === 0 ? (
                    <p className="ticket-empty">Sự kiện chưa cấu hình vé.</p>
                ) : (
                    <div className="ticket-options">
                        {tickets.map((ticket, index) => (
                            <article
                                key={ticket.id}
                                style={{
                                    '--ticket-color': ticketColors[index % ticketColors.length],
                                } as CSSProperties}
                            >
                                <div>
                                    <span />
                                    <h3>{ticket.name}</h3>
                                    <strong>{formatCurrency(ticket.price)}</strong>
                                </div>
                                <p>{ticket.description || 'Vé tham dự sự kiện.'}</p>
                                <div className="availability-row">
                                    <span>Còn lại</span>
                                    <strong>{ticket.availableQuantity}</strong>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                <footer className="ticket-total">
                    <div>
                        <span>Giá từ</span>
                        <strong>{minPrice === null ? 'Chưa mở bán' : formatCurrency(minPrice)}</strong>
                        <small>Chọn số lượng ở phần tiếp theo</small>
                    </div>
                    <button type="button" disabled>
                        Tiếp tục đặt vé
                        <MaterialIcon>arrow_forward</MaterialIcon>
                    </button>
                    <p>
                        <MaterialIcon>shield</MaterialIcon>
                        Reservation sẽ giữ vé trong 15 phút sau khi tạo thành công
                    </p>
                </footer>
            </section>

            <section className="ticket-benefits">
                {[
                    ['verified_user', 'Thanh toán an toàn', 'Được bảo mật bởi SePay'],
                    ['confirmation_number', 'Vé điện tử tiện lợi', 'Nhận vé qua tài khoản sau thanh toán'],
                    ['support_agent', 'Hỗ trợ khi cần', 'API errors sẽ hiển thị trực tiếp trên giao diện'],
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
    );
}

function formatCurrency(value: number) {
    return `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
}

function formatDateRange(startsAt: string, endsAt: string) {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const sameDay = start.toDateString() === end.toDateString();

    if (sameDay) {
        return `${formatDateTime(startsAt)} - ${new Intl.DateTimeFormat('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(end)}`;
    }

    return `${formatDateTime(startsAt)} - ${formatDateTime(endsAt)}`;
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

export default EventDetailPage;
