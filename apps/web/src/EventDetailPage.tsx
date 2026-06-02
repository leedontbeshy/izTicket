import {
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
    type ChangeEvent,
    type ReactNode,
} from 'react';
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
import { createReservation } from './api/reservations.api';
import { getStoredAuthUser } from './authSession';
import {
    getActiveCheckoutSession,
    saveCheckoutSession,
} from './checkoutSession';
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

                <TicketSidebar eventId={event.id} tickets={event.ticketTypes} />
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

function TicketSidebar({
    eventId,
    tickets,
}: {
    eventId: string;
    tickets: PublicTicketType[];
}) {
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [reservationError, setReservationError] = useState('');
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const activeSession = getActiveCheckoutSession(eventId);

    const selectedCount = useMemo(
        () =>
            tickets.reduce(
                (count, ticket) => count + (quantities[ticket.id] ?? 0),
                0,
            ),
        [quantities, tickets],
    );
    const total = useMemo(
        () =>
            tickets.reduce(
                (sum, ticket) => sum + (quantities[ticket.id] ?? 0) * ticket.price,
                0,
            ),
        [quantities, tickets],
    );

    function updateQuantity(ticket: PublicTicketType, delta: number) {
        setQuantities((current) => {
            const nextQuantity = clamp(
                (current[ticket.id] ?? 0) + delta,
                0,
                ticket.availableQuantity,
            );

            return { ...current, [ticket.id]: nextQuantity };
        });
    }

    function setQuantity(ticket: PublicTicketType, value: number) {
        const quantity = Number.isFinite(value) ? value : 0;

        setQuantities((current) => ({
            ...current,
            [ticket.id]: clamp(quantity, 0, ticket.availableQuantity),
        }));
    }

    function handleQuantityInput(
        ticket: PublicTicketType,
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const digits = event.target.value.replace(/\D/g, '');
        const normalized = digits.replace(/^0+(?=\d)/, '');
        setQuantity(ticket, normalized === '' ? 0 : Number(normalized));
    }

    async function submitReservation() {
        if (selectedCount === 0 || submitting) return;

        const user = getStoredAuthUser();
        if (!user || user.role !== 'CUSTOMER') {
            setReservationError('');
            setShowLoginPrompt(true);
            return;
        }

        setSubmitting(true);
        setReservationError('');

        try {
            const reservation = await createReservation({
                eventId,
                items: tickets
                    .map((ticket) => ({
                        ticketTypeId: ticket.id,
                        quantity: quantities[ticket.id] ?? 0,
                    }))
                    .filter((item) => item.quantity > 0),
            });

            saveCheckoutSession({
                eventId,
                reservationId: reservation.id,
                expiresAt: reservation.expiresAt,
            });
            window.location.assign(`/checkout/${reservation.id}`);
        } catch (err) {
            setReservationError(
                err instanceof Error
                    ? err.message
                    : 'Không thể tạo reservation. Vui lòng thử lại.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
        <aside className="ticket-sidebar" id="tickets">
            <section className="ticket-panel">
                <header>
                    <h2>Loại vé</h2>
                    <span>
                        <MaterialIcon>confirmation_number</MaterialIcon>
                        {tickets.length} hạng vé
                    </span>
                </header>

                {activeSession ? (
                    <div className="active-checkout-box">
                        <span>
                            <MaterialIcon>timer</MaterialIcon>
                        </span>
                        <div>
                            <h3>Bạn đang giữ vé</h3>
                            <p>Reservation còn hiệu lực, bạn có thể tiếp tục checkout.</p>
                        </div>
                        <a href={`/checkout/${activeSession.reservationId}`}>
                            Tiếp tục
                        </a>
                    </div>
                ) : null}

                {tickets.length === 0 ? (
                    <p className="ticket-empty">Sự kiện chưa cấu hình vé.</p>
                ) : (
                    <div className="ticket-options">
                        {tickets.map((ticket, index) => {
                            const quantity = quantities[ticket.id] ?? 0;
                            const soldOut = ticket.availableQuantity === 0;

                            return (
                                <article
                                    className={quantity > 0 ? 'selected' : ''}
                                    key={ticket.id}
                                    style={{
                                        '--ticket-color':
                                            ticketColors[index % ticketColors.length],
                                    } as CSSProperties}
                                >
                                    <div>
                                        <span />
                                        <h3>{ticket.name}</h3>
                                        {quantity > 0 ? <em>Đã chọn</em> : null}
                                        <strong>{formatCurrency(ticket.price)}</strong>
                                    </div>
                                    <p>{ticket.description || 'Vé tham dự sự kiện.'}</p>
                                    <div className="availability-row">
                                        <span>
                                            {soldOut
                                                ? 'Hết vé'
                                                : `Còn ${ticket.availableQuantity} vé`}
                                        </span>
                                        <strong>
                                            {formatCurrency(quantity * ticket.price)}
                                        </strong>
                                    </div>
                                    <div className="quantity-row">
                                        <label>Số lượng</label>
                                        <div>
                                            <button
                                                type="button"
                                                disabled={quantity === 0}
                                                onClick={() => updateQuantity(ticket, -1)}
                                            >
                                                <MaterialIcon>remove</MaterialIcon>
                                            </button>
                                            <input
                                                aria-label={`Số lượng ${ticket.name}`}
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                type="text"
                                                value={quantity}
                                                onChange={(event) =>
                                                    handleQuantityInput(ticket, event)
                                                }
                                            />
                                            <button
                                                type="button"
                                                disabled={
                                                    quantity >= ticket.availableQuantity
                                                }
                                                onClick={() => updateQuantity(ticket, 1)}
                                            >
                                                <MaterialIcon>add</MaterialIcon>
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                <footer className="ticket-total">
                    <div>
                        <span>Tổng cộng</span>
                        <strong>{formatCurrency(total)}</strong>
                        <small>
                            {selectedCount > 0
                                ? `${selectedCount} vé đã chọn`
                                : 'Chọn số lượng vé muốn giữ'}
                        </small>
                    </div>
                    <button
                        type="button"
                        disabled={selectedCount === 0 || submitting}
                        onClick={submitReservation}
                    >
                        {submitting ? 'Đang giữ vé...' : 'Tiếp tục đặt vé'}
                        <MaterialIcon>arrow_forward</MaterialIcon>
                    </button>
                    {reservationError ? (
                        <p className="reservation-error">
                            <MaterialIcon>error</MaterialIcon>
                            {reservationError}
                        </p>
                    ) : null}
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
        {showLoginPrompt ? (
            <section className="reservation-login-prompt" role="dialog" aria-modal="true">
                <div>
                    <span>
                        <MaterialIcon>lock</MaterialIcon>
                    </span>
                    <h2>Cần đăng nhập để đặt vé</h2>
                    <p>
                        Đăng nhập bằng tài khoản khách hàng để giữ vé và tiếp tục
                        thanh toán.
                    </p>
                    <div>
                        <a href="/auth/login">Đăng nhập</a>
                        <button
                            type="button"
                            onClick={() => setShowLoginPrompt(false)}
                        >
                            Quay lại
                        </button>
                    </div>
                </div>
            </section>
        ) : null}
        </>
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

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export default EventDetailPage;
