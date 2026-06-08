import { useEffect, useMemo, useState } from 'react';
import {
    MaterialIcon,
    PublicFooter,
    PublicHeader,
} from './PublicLayout';
import {
    getPublicEvent,
    type PublicEventDetail,
} from './api/events.api';
import {
    createOrder,
    getOrder,
    listMyOrders,
    type Order,
    type OrdersPageResponse,
} from './api/orders.api';
import {
    createSepayPayment,
    type SepayPayment,
} from './api/payments.api';
import {
    cancelReservation,
    getReservation,
    type Reservation,
    type ReservationItem,
} from './api/reservations.api';
import {
    clearCheckoutSession,
    getCheckoutSessions,
    getCheckoutSession,
    patchCheckoutSession,
    saveCheckoutSession,
    type CheckoutSession,
} from './checkoutSession';
import './CheckoutPage.css';

export function CheckoutListPage() {
    const sessions = useMemo(() => getCheckoutSessions(), []);
    const [now, setNow] = useState(() => Date.now());
    const [eventsById, setEventsById] = useState<Record<string, PublicEventDetail>>({});

    useEffect(() => {
        const timerId = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timerId);
    }, []);

    useEffect(() => {
        let active = true;
        const eventIds = Array.from(new Set(sessions.map((session) => session.eventId)));

        Promise.all(
            eventIds.map(async (eventId) => {
                try {
                    return [eventId, await getPublicEvent(eventId)] as const;
                } catch {
                    return null;
                }
            }),
        ).then((entries) => {
            if (!active) return;
            setEventsById(
                Object.fromEntries(entries.filter((entry): entry is readonly [string, PublicEventDetail] => Boolean(entry))),
            );
        });

        return () => {
            active = false;
        };
    }, [sessions]);

    return (
        <main className="checkout-page">
            <PublicHeader active="events" />

            <section className="checkout-list-shell">
                <div className="checkout-heading">
                    <a href="/events">
                        <MaterialIcon>arrow_back</MaterialIcon>
                        Quay lại sự kiện
                    </a>
                    <h1>Checkout đang giữ</h1>
                    <p>Chọn một checkout để tiếp tục thanh toán hoặc hủy giữ vé.</p>
                </div>

                {sessions.length === 0 ? (
                    <CheckoutState
                        icon="shopping_cart"
                        title="Chưa có checkout đang giữ"
                        text="Khi bạn giữ vé thành công, checkout sẽ xuất hiện ở đây cho đến lúc hết hạn hoặc được hủy."
                    />
                ) : (
                    <div className="checkout-session-grid">
                        {sessions.map((session) => (
                            <CheckoutSessionCard
                                event={eventsById[session.eventId]}
                                now={now}
                                session={session}
                                key={session.reservationId}
                            />
                        ))}
                    </div>
                )}
            </section>

            <PublicFooter />
        </main>
    );
}

export function CheckoutPage({ reservationId }: { reservationId: string }) {
    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [event, setEvent] = useState<PublicEventDetail | null>(null);
    const [order, setOrder] = useState<Order | null>(null);
    const [payment, setPayment] = useState<SepayPayment | null>(null);
    const [loading, setLoading] = useState(true);
    const [creatingOrder, setCreatingOrder] = useState(false);
    const [creatingPayment, setCreatingPayment] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timerId = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timerId);
    }, []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');

        getReservation(reservationId)
            .then(async (reservationDetail) => {
                const [eventDetail, restoredOrder] = await Promise.all([
                    getPublicEvent(reservationDetail.eventId),
                    restoreOrder(reservationId),
                ]);
                const session = getCheckoutSession(reservationId);
                const matchingSession =
                    session &&
                    new Date(session.expiresAt).getTime() > Date.now()
                        ? session
                        : null;
                if (!active) return;
                if (session && !matchingSession) {
                    clearCheckoutSession(reservationId);
                }
                setReservation(reservationDetail);
                setEvent(eventDetail);
                setOrder(restoredOrder);
                setPayment(matchingSession?.payment ?? null);
                if (new Date(reservationDetail.expiresAt).getTime() > Date.now()) {
                    saveCheckoutSession({
                        eventId: reservationDetail.eventId,
                        reservationId: reservationDetail.id,
                        expiresAt: reservationDetail.expiresAt,
                        orderId: restoredOrder?.id ?? matchingSession?.orderId,
                        paymentId: matchingSession?.paymentId,
                        payment: matchingSession?.payment,
                    });
                } else {
                    clearCheckoutSession(reservationId);
                }
            })
            .catch((err: unknown) => {
                if (!active) return;
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Không thể tải reservation.',
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [reservationId]);

    const remainingMs = useMemo(() => {
        if (!reservation) return 0;
        return Math.max(0, new Date(reservation.expiresAt).getTime() - now);
    }, [now, reservation]);
    const isExpired = remainingMs === 0;
    const totalAmount = useMemo(
        () =>
            reservation?.totalAmount ??
            reservation?.items.reduce(
                (sum, item) => sum + getItemSubtotal(item),
                0,
            ) ??
            0,
        [reservation],
    );

    async function handleStartPayment() {
        if (
            !reservation ||
            creatingOrder ||
            creatingPayment ||
            isExpired ||
            payment
        ) {
            return;
        }

        setCreatingOrder(true);
        setCreatingPayment(true);
        setActionError('');

        try {
            const checkoutOrder = order ?? await createOrder(reservation.id);
            setOrder(checkoutOrder);
            patchCheckoutSession({ orderId: checkoutOrder.id }, reservation.id);

            const createdPayment = await createSepayPayment(checkoutOrder.id);
            setPayment(createdPayment);
            patchCheckoutSession({
                paymentId: createdPayment.paymentId,
                payment: createdPayment,
            }, reservation.id);
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : 'Không thể tạo thanh toán SePay. Vui lòng thử lại.',
            );
        } finally {
            setCreatingOrder(false);
            setCreatingPayment(false);
        }
    }

    async function handleCancelReservation() {
        if (!reservation || order || payment || cancelling) return;

        setCancelling(true);
        setActionError('');

        try {
            const cancelledReservation = await cancelReservation(reservation.id);
            setReservation(cancelledReservation);
            clearCheckoutSession(reservation.id);
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : 'Không thể hủy reservation. Vui lòng thử lại.',
            );
        } finally {
            setCancelling(false);
        }
    }

    return (
        <main className="checkout-page">
            <PublicHeader active="events" />

            {loading ? (
                <CheckoutState
                    icon="hourglass_top"
                    title="Đang tải checkout"
                    text="Reservation của bạn sẽ hiển thị ngay khi API phản hồi."
                />
            ) : error || !reservation ? (
                <CheckoutState
                    icon="error"
                    title="Không thể tải checkout"
                    text={error || 'Reservation không tồn tại hoặc không thuộc tài khoản này.'}
                />
            ) : (
                <section className="checkout-layout">
                    <div className="checkout-main">
                        <div className="checkout-heading">
                            <a href={`/events/${reservation.eventId}`}>
                                <MaterialIcon>arrow_back</MaterialIcon>
                                Quay lại sự kiện
                            </a>
                            <h1>Checkout</h1>
                            <p>{event?.title ?? 'Reservation của bạn'}</p>
                        </div>

                        <section className="checkout-card">
                            <header>
                                <div>
                                    <h2>Vé đã giữ</h2>
                                    <p>Reservation #{reservation.id}</p>
                                </div>
                                <StatusPill status={reservation.status} />
                            </header>

                            <div className="checkout-items">
                                {reservation.items.map((item) => (
                                    <ReservationItemRow
                                        event={event}
                                        item={item}
                                        key={item.id}
                                    />
                                ))}
                            </div>
                        </section>

                        {order ? (
                            <section className="checkout-card order-created">
                                <span>
                                    <MaterialIcon>task_alt</MaterialIcon>
                                </span>
                                <div>
                                    <h2>Order đã được tạo</h2>
                                    <p>
                                        Order #{order.id} đang chờ thanh toán. Mã SePay sẽ được
                                        hiển thị ngay bên dưới khi khởi tạo thành công.
                                    </p>
                                </div>
                            </section>
                        ) : null}

                        {payment ? <PaymentInstructions payment={payment} /> : null}
                    </div>

                    <aside className="checkout-summary">
                        <section>
                            <h2>Thời gian giữ vé</h2>
                            <strong className={isExpired ? 'expired' : ''}>
                                {formatRemaining(remainingMs)}
                            </strong>
                            <p>
                                Hoàn tất tạo order trước khi reservation hết hạn.
                            </p>
                        </section>

                        <section>
                            <div className="summary-line">
                                <span>Số lượng vé</span>
                                <strong>{getTotalQuantity(reservation.items)}</strong>
                            </div>
                            <div className="summary-line">
                                <span>Tổng tiền</span>
                                <strong>{formatCurrency(totalAmount)}</strong>
                            </div>
                        </section>

                        <button
                            type="button"
                            disabled={
                                creatingOrder ||
                                creatingPayment ||
                                isExpired ||
                                reservation.status !== 'ACTIVE' ||
                                Boolean(payment)
                            }
                            onClick={handleStartPayment}
                        >
                            {payment
                                ? 'Đã tạo thanh toán'
                                : creatingOrder || creatingPayment
                                  ? 'Đang tạo thanh toán...'
                                  : 'Tạo thanh toán SePay'}
                            <MaterialIcon>arrow_forward</MaterialIcon>
                        </button>

                        {!order && !payment && reservation.status === 'ACTIVE' ? (
                            <button
                                className="checkout-secondary-button"
                                type="button"
                                disabled={creatingOrder || cancelling}
                                onClick={handleCancelReservation}
                            >
                                <MaterialIcon>close</MaterialIcon>
                                {cancelling ? 'Đang hủy reservation...' : 'Hủy giữ vé'}
                            </button>
                        ) : null}

                        {isExpired ? (
                            <p className="checkout-error">
                                <MaterialIcon>error</MaterialIcon>
                                Reservation đã hết hạn. Vui lòng đặt lại vé.
                            </p>
                        ) : null}
                        {actionError ? (
                            <p className="checkout-error">
                                <MaterialIcon>error</MaterialIcon>
                                {actionError}
                            </p>
                        ) : null}
                    </aside>
                </section>
            )}

            <PublicFooter />
        </main>
    );
}

async function restoreOrder(reservationId: string) {
    const session = getCheckoutSession(reservationId);

    if (
        session &&
        new Date(session.expiresAt).getTime() <= Date.now()
    ) {
        clearCheckoutSession(reservationId);
        return null;
    }

    if (session?.orderId) {
        try {
            const order = await getOrder(session.orderId);
            if (order.reservationId === reservationId) return order;
        } catch {
            // Fall back to /orders/my below.
        }
    }

    try {
        const ordersPage = await listMyOrders(1, 20);
        return (
            getPageOrders(ordersPage).find(
                (order) => order.reservationId === reservationId,
            ) ?? null
        );
    } catch {
        return null;
    }
}

function getPageOrders(page: OrdersPageResponse) {
    if ('items' in page && Array.isArray(page.items)) return page.items;
    if ('data' in page && Array.isArray(page.data)) return page.data;
    return [];
}

function CheckoutSessionCard({
    event,
    now,
    session,
}: {
    event?: PublicEventDetail;
    now: number;
    session: CheckoutSession;
}) {
    const remainingMs = Math.max(
        0,
        new Date(session.expiresAt).getTime() - now,
    );
    const status = getCheckoutSessionStatus(session);
    const location = event
        ? `${event.venue.name}, ${event.venue.city}`
        : shortId(session.eventId);

    return (
        <a className="checkout-session-card" href={`/checkout/${session.reservationId}`}>
            <div className="checkout-ticket-ribbon">
                <span>
                    <MaterialIcon>confirmation_number</MaterialIcon>
                </span>
            </div>
            <div className="checkout-session-body">
                <div className="checkout-session-title-row">
                    <span className={`checkout-session-status ${status.tone}`}>
                        {status.label}
                    </span>
                    <small>{shortId(session.reservationId)}</small>
                </div>
                <h2>{event?.title ?? 'Checkout đang giữ vé'}</h2>
                <p>
                    <MaterialIcon>calendar_today</MaterialIcon>
                    {event ? formatCheckoutCardDate(event.startsAt) : 'Đang tải thời gian'}
                </p>
                <p>
                    <MaterialIcon>location_on</MaterialIcon>
                    {location}
                </p>
            </div>
            <div className="checkout-session-countdown">
                <span>Còn lại</span>
                <strong>{formatRemaining(remainingMs)}</strong>
            </div>
        </a>
    );
}

function ReservationItemRow({
    event,
    item,
}: {
    event: PublicEventDetail | null;
    item: ReservationItem;
}) {
    const ticketType = event?.ticketTypes.find(
        (ticket) => ticket.id === item.ticketTypeId,
    );

    return (
        <article className="checkout-item">
            <div>
                <h3>{ticketType?.name ?? 'Hạng vé'}</h3>
                <p>{item.ticketTypeId}</p>
            </div>
            <span>x{item.quantity}</span>
            <strong>{formatCurrency(getItemSubtotal(item))}</strong>
        </article>
    );
}

function PaymentInstructions({ payment }: { payment: SepayPayment }) {
    const instructions = payment.transferInstructions;

    return (
        <section className="checkout-card payment-card">
            <header>
                <div>
                    <h2>Thanh toán SePay</h2>
                    <p>Payment #{payment.paymentId}</p>
                </div>
                <span className="reservation-status active">{payment.status}</span>
            </header>

            <div className="payment-body">
                <img src={instructions.qrImageUrl} alt="QR thanh toán SePay" />
                <div className="payment-details">
                    <PaymentLine label="Ngân hàng" value={instructions.bankName} />
                    <PaymentLine
                        label="Số tài khoản"
                        value={instructions.accountNumber}
                    />
                    <PaymentLine
                        label="Số tiền"
                        value={formatCurrency(instructions.amountVnd)}
                    />
                    <PaymentLine
                        label="Nội dung"
                        value={instructions.transferContent}
                    />
                    <a
                        className="payment-result-link"
                        href={`/payment-result?paymentId=${encodeURIComponent(payment.paymentId)}`}
                    >
                        <MaterialIcon>receipt_long</MaterialIcon>
                        Kiểm tra kết quả thanh toán
                    </a>
                </div>
            </div>
        </section>
    );
}

function PaymentLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="payment-line">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

function CheckoutState({
    icon,
    text,
    title,
}: {
    icon: string;
    text: string;
    title: string;
}) {
    return (
        <section className="checkout-placeholder">
            <span>
                <MaterialIcon>{icon}</MaterialIcon>
            </span>
            <h1>{title}</h1>
            <p>{text}</p>
            <a href="/events">
                <MaterialIcon>arrow_back</MaterialIcon>
                Quay lại sự kiện
            </a>
        </section>
    );
}

function StatusPill({ status }: { status: Reservation['status'] }) {
    return <span className={`reservation-status ${status.toLowerCase()}`}>{status}</span>;
}

function getItemSubtotal(item: ReservationItem) {
    return item.subtotal ?? item.subtotalVnd;
}

function getTotalQuantity(items: ReservationItem[]) {
    return items.reduce((sum, item) => sum + item.quantity, 0);
}

function getCheckoutSessionStatus(session: CheckoutSession) {
    if (session.paymentId) return { label: 'Đã tạo mã SePay', tone: 'payment' };
    if (session.orderId) return { label: 'Đã tạo order', tone: 'order' };
    return { label: 'Đang giữ vé', tone: 'hold' };
}

function shortId(value: string) {
    return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

function formatCheckoutCardDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function formatCurrency(value: number) {
    return `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
}

function formatRemaining(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
