import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { getStoredAuthUser } from './authSession';
import {
    getOrganizerEvent,
    type EventStatus,
    type OrganizerEvent,
} from './api/events.api';
import {
    listEventOrders,
    type OrderStatus,
    type OrganizerOrder,
} from './api/orders.api';
import {
    createTicketType,
    listTicketTypes,
    type CreateTicketTypePayload,
    type TicketType,
} from './api/ticket-types.api';
import { MaterialIcon, PublicFooter, PublicHeader } from './PublicLayout';
import './OrganizerEventDetailPage.css';

type Props = { eventId: string };

type TicketForm = {
    name: string;
    description: string;
    price: string;
    totalQuantity: string;
    maxPerOrder: string;
    saleStartsAt: string;
    saleEndsAt: string;
};

const EMPTY_TICKET_FORM: TicketForm = {
    name: '',
    description: '',
    price: '',
    totalQuantity: '',
    maxPerOrder: '',
    saleStartsAt: '',
    saleEndsAt: '',
};

const fallbackImage =
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=90';

const STATUS_LABEL: Record<EventStatus, string> = {
    DRAFT: 'Bản nháp',
    PENDING_REVIEW: 'Chờ duyệt',
    PUBLISHED: 'Đã xuất bản',
    REJECTED: 'Bị từ chối',
    CANCELLED: 'Đã hủy',
};

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
    PENDING_PAYMENT: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    CANCELLED: 'Đã hủy',
    EXPIRED: 'Hết hạn',
    PAYMENT_REVIEW: 'Cần đối soát',
};

export function OrganizerEventDetailPage({ eventId }: Props) {
    const [event, setEvent] = useState<OrganizerEvent | null>(null);
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
    const [orders, setOrders] = useState<OrganizerOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [ticketForm, setTicketForm] = useState<TicketForm>(EMPTY_TICKET_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const user = getStoredAuthUser();
    const isOrganizer = user?.role === 'ORGANIZER';

    useEffect(() => {
        if (!isOrganizer) {
            window.location.href = '/auth/login';
            return;
        }

        Promise.all([
            getOrganizerEvent(eventId),
            listTicketTypes(eventId),
            listEventOrders(eventId),
        ])
            .then(([eventDetail, ttRes, ordersPage]) => {
                setEvent(eventDetail);
                setTicketTypes(ttRes.items);
                setOrders(ordersPage.items);
            })
            .catch(() => setError('Không thể tải dữ liệu sự kiện.'))
            .finally(() => setLoading(false));
    }, [eventId, isOrganizer]);

    function setField(field: keyof TicketForm) {
        return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setTicketForm((prev) => ({ ...prev, [field]: e.target.value }));
    }

    async function handleAddTicketType(e: FormEvent) {
        e.preventDefault();
        setFormError('');
        setSaving(true);

        try {
            const payload: CreateTicketTypePayload = {
                name: ticketForm.name.trim(),
                ...(ticketForm.description
                    ? { description: ticketForm.description.trim() }
                    : {}),
                price: Number(ticketForm.price),
                totalQuantity: Number(ticketForm.totalQuantity),
                ...(ticketForm.maxPerOrder
                    ? { maxPerOrder: Number(ticketForm.maxPerOrder) }
                    : {}),
                saleStartsAt: new Date(ticketForm.saleStartsAt).toISOString(),
                saleEndsAt: new Date(ticketForm.saleEndsAt).toISOString(),
            };

            const created = await createTicketType(eventId, payload);
            setTicketTypes((prev) => [...prev, created]);
            setTicketForm(EMPTY_TICKET_FORM);
            setShowAddForm(false);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Đã xảy ra lỗi.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <DetailShell>
                <StateMessage
                    icon="hourglass_top"
                    title="Đang tải sự kiện"
                    text="Thông tin quản lý sẽ hiển thị ngay khi API phản hồi."
                />
            </DetailShell>
        );
    }

    if (!event) {
        return (
            <DetailShell>
                <StateMessage
                    icon="error"
                    title="Không thể tải sự kiện"
                    text={
                        error ||
                        'Sự kiện không tồn tại hoặc bạn không có quyền truy cập.'
                    }
                />
            </DetailShell>
        );
    }

    const canEdit = event.status === 'DRAFT' || event.status === 'REJECTED';
    const statusClass = `status-${event.status.toLowerCase().replace(/_/g, '-')}`;
    const address = [
        event.venue.address,
        event.venue.district,
        event.venue.city,
    ]
        .filter(Boolean)
        .join(', ');

    return (
        <main className="organizer-event-detail-page">
            <PublicHeader active="events" />

            <div className="ed-breadcrumb">
                <a href="/organizer/events">
                    <MaterialIcon>arrow_back</MaterialIcon>
                    Sự kiện của tôi
                </a>
                <MaterialIcon>chevron_right</MaterialIcon>
                <span>{event.title}</span>
            </div>

            <section className="ed-hero">
                <img
                    src={event.thumbnailUrl ?? fallbackImage}
                    alt={event.title}
                />
                <div className="ed-hero-overlay">
                    <span className={`ed-status ${statusClass}`}>
                        {STATUS_LABEL[event.status]}
                    </span>
                    <h1>{event.title}</h1>
                    <div className="ed-hero-meta">
                        <span>
                            <MaterialIcon>calendar_month</MaterialIcon>
                            {formatDateTime(event.startsAt)}
                        </span>
                        <span>
                            <MaterialIcon>location_on</MaterialIcon>
                            {event.venue.name}, {event.venue.city}
                        </span>
                    </div>
                </div>
            </section>

            {error ? <div className="ed-error">{error}</div> : null}

            <section className="ed-detail-grid">
                <article className="ed-info-panel">
                    <div className="ed-section-heading">
                        <div>
                            <h2>Thông tin sự kiện</h2>
                            <p>{event.category}</p>
                        </div>
                        {canEdit ? (
                            <a
                                className="ed-secondary-button"
                                href={`/organizer/events/${eventId}/edit`}
                            >
                                <MaterialIcon>edit</MaterialIcon>
                                Chỉnh sửa
                            </a>
                        ) : null}
                    </div>
                    <p className="ed-description">{event.description}</p>
                    <div className="ed-fact-grid">
                        <Fact
                            icon="calendar_today"
                            label="Bắt đầu"
                            value={formatDateTime(event.startsAt)}
                        />
                        <Fact
                            icon="event_available"
                            label="Kết thúc"
                            value={formatDateTime(event.endsAt)}
                        />
                        <Fact
                            icon="apartment"
                            label="Địa điểm"
                            value={event.venue.name}
                        />
                        <Fact
                            icon="location_on"
                            label="Địa chỉ"
                            value={address}
                        />
                    </div>
                </article>

                <aside className="ed-edit-panel">
                    <span>
                        <MaterialIcon>
                            {canEdit ? 'edit_calendar' : 'lock'}
                        </MaterialIcon>
                    </span>
                    <h2>Chỉnh sửa sự kiện</h2>
                    <p>
                        {canEdit
                            ? 'Cập nhật thông tin, địa điểm, thời gian hoặc ảnh bìa trước khi gửi duyệt.'
                            : `Sự kiện đang ở trạng thái ${STATUS_LABEL[event.status]}, không thể chỉnh sửa.`}
                    </p>
                    {canEdit ? (
                        <a
                            className="ed-primary-button"
                            href={`/organizer/events/${eventId}/edit`}
                        >
                            Mở trang chỉnh sửa
                            <MaterialIcon>arrow_forward</MaterialIcon>
                        </a>
                    ) : null}
                </aside>
            </section>

            <section className="ed-section">
                <div className="ed-section-heading">
                    <div>
                        <h2>Loại vé</h2>
                        <p>{ticketTypes.length} loại vé</p>
                    </div>
                    {canEdit && !showAddForm ? (
                        <button
                            className="ed-primary-button"
                            type="button"
                            onClick={() => setShowAddForm(true)}
                        >
                            <MaterialIcon>add</MaterialIcon>
                            Thêm loại vé
                        </button>
                    ) : null}
                </div>

                {showAddForm ? (
                    <form
                        className="ed-ticket-form"
                        onSubmit={handleAddTicketType}
                    >
                        <h3>Loại vé mới</h3>

                        {formError ? (
                            <div className="ed-error">{formError}</div>
                        ) : null}

                        <div className="ed-row">
                            <Field id="tt-name" label="Tên loại vé *">
                                <input
                                    id="tt-name"
                                    type="text"
                                    value={ticketForm.name}
                                    onChange={setField('name')}
                                    placeholder="VIP, Thường, Sinh viên..."
                                    required
                                    maxLength={120}
                                />
                            </Field>
                            <Field id="tt-price" label="Giá (VND) *">
                                <input
                                    id="tt-price"
                                    type="number"
                                    value={ticketForm.price}
                                    onChange={setField('price')}
                                    placeholder="0"
                                    required
                                    min={0}
                                />
                            </Field>
                        </div>

                        <Field id="tt-desc" label="Mô tả">
                            <textarea
                                id="tt-desc"
                                value={ticketForm.description}
                                onChange={setField('description')}
                                placeholder="Quyền lợi đi kèm..."
                                rows={2}
                            />
                        </Field>

                        <div className="ed-row">
                            <Field id="tt-qty" label="Số lượng *">
                                <input
                                    id="tt-qty"
                                    type="number"
                                    value={ticketForm.totalQuantity}
                                    onChange={setField('totalQuantity')}
                                    placeholder="100"
                                    required
                                    min={1}
                                />
                            </Field>
                            <Field id="tt-max" label="Tối đa / đơn">
                                <input
                                    id="tt-max"
                                    type="number"
                                    value={ticketForm.maxPerOrder}
                                    onChange={setField('maxPerOrder')}
                                    placeholder="4"
                                    min={1}
                                />
                            </Field>
                        </div>

                        <div className="ed-row">
                            <Field id="tt-sale-start" label="Mở bán *">
                                <input
                                    id="tt-sale-start"
                                    type="datetime-local"
                                    value={ticketForm.saleStartsAt}
                                    onChange={setField('saleStartsAt')}
                                    required
                                />
                            </Field>
                            <Field id="tt-sale-end" label="Kết thúc bán *">
                                <input
                                    id="tt-sale-end"
                                    type="datetime-local"
                                    value={ticketForm.saleEndsAt}
                                    onChange={setField('saleEndsAt')}
                                    required
                                />
                            </Field>
                        </div>

                        <div className="ed-actions">
                            <button
                                type="button"
                                className="ed-secondary-button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setTicketForm(EMPTY_TICKET_FORM);
                                    setFormError('');
                                }}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="ed-primary-button"
                                disabled={saving}
                            >
                                {saving ? 'Đang lưu...' : 'Tạo loại vé'}
                            </button>
                        </div>
                    </form>
                ) : null}

                {ticketTypes.length === 0 && !showAddForm ? (
                    <EmptyState
                        icon="confirmation_number"
                        text="Chưa có loại vé nào."
                    />
                ) : (
                    <div className="ed-ticket-list">
                        {ticketTypes.map((tt) => (
                            <TicketTypeCard key={tt.id} ticketType={tt} />
                        ))}
                    </div>
                )}
            </section>

            <section className="ed-section">
                <div className="ed-section-heading">
                    <div>
                        <h2>Đơn hàng</h2>
                        <p>{orders.length} đơn</p>
                    </div>
                </div>

                {orders.length === 0 ? (
                    <EmptyState
                        icon="receipt_long"
                        text="Chưa có đơn hàng nào."
                    />
                ) : (
                    <div className="ed-orders-table-wrap">
                        <table className="ed-orders-table">
                            <thead>
                                <tr>
                                    <th>Khách hàng</th>
                                    <th>Email</th>
                                    <th>Trạng thái</th>
                                    <th>Tổng tiền</th>
                                    <th>Ngày đặt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <OrderRow key={order.id} order={order} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <PublicFooter />
        </main>
    );
}

function DetailShell({ children }: { children: ReactNode }) {
    return (
        <main className="organizer-event-detail-page">
            <PublicHeader active="events" />
            <div className="ed-breadcrumb">
                <a href="/organizer/events">
                    <MaterialIcon>arrow_back</MaterialIcon>
                    Sự kiện của tôi
                </a>
            </div>
            {children}
            <PublicFooter />
        </main>
    );
}

function StateMessage({
    icon,
    text,
    title,
}: {
    icon: string;
    text: string;
    title: string;
}) {
    return (
        <section className="ed-state">
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

function Field({
    children,
    id,
    label,
}: {
    children: ReactNode;
    id: string;
    label: string;
}) {
    return (
        <div className="ed-field">
            <label htmlFor={id}>{label}</label>
            {children}
        </div>
    );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
    return (
        <div className="ed-empty">
            <MaterialIcon>{icon}</MaterialIcon>
            <p>{text}</p>
        </div>
    );
}

function TicketTypeCard({ ticketType }: { ticketType: TicketType }) {
    const soldCount = ticketType.totalQuantity - ticketType.availableQuantity;
    const soldPct =
        ticketType.totalQuantity > 0
            ? Math.round((soldCount / ticketType.totalQuantity) * 100)
            : 0;

    return (
        <article className="ed-ticket-card">
            <div className="ed-ticket-card-top">
                <span className="ed-ticket-name">{ticketType.name}</span>
                <span className="ed-ticket-price">
                    {ticketType.price === 0
                        ? 'Miễn phí'
                        : `${ticketType.price.toLocaleString('vi-VN')} đ`}
                </span>
            </div>
            {ticketType.description ? (
                <p className="ed-ticket-desc">{ticketType.description}</p>
            ) : null}
            <div className="ed-ticket-stats">
                <span>
                    <MaterialIcon>group</MaterialIcon>
                    {soldCount}/{ticketType.totalQuantity} bán ({soldPct}%)
                </span>
                <span>
                    <MaterialIcon>schedule</MaterialIcon>
                    {formatDate(ticketType.saleStartsAt)} -{' '}
                    {formatDate(ticketType.saleEndsAt)}
                </span>
                {ticketType.maxPerOrder ? (
                    <span>
                        <MaterialIcon>person</MaterialIcon>
                        Tối đa {ticketType.maxPerOrder}/đơn
                    </span>
                ) : null}
            </div>
        </article>
    );
}

function OrderRow({ order }: { order: OrganizerOrder }) {
    const statusClass = `order-status-${order.status.toLowerCase().replace(/_/g, '-')}`;

    return (
        <tr>
            <td>{order.customer.name}</td>
            <td className="ed-muted">{order.customer.email}</td>
            <td>
                <span className={`ed-order-status ${statusClass}`}>
                    {ORDER_STATUS_LABEL[order.status] ?? order.status}
                </span>
            </td>
            <td>{order.totalAmountVnd.toLocaleString('vi-VN')} đ</td>
            <td className="ed-muted">{formatDate(order.createdAt)}</td>
        </tr>
    );
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function formatDateTime(iso: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(iso));
}
