import { useState, useEffect, type FormEvent } from 'react';
import { getStoredAuthUser } from './authSession';
import { listOrganizerEvents, type OrganizerEvent, type EventStatus } from './api/events.api';
import {
    listTicketTypes,
    createTicketType,
    type TicketType,
    type CreateTicketTypePayload,
} from './api/ticket-types.api';
import { listEventOrders, type OrganizerOrder, type OrderStatus } from './api/orders.api';
import { DashHeader, logout } from './DashboardLayout';
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

    useEffect(() => {
        if (!user || user.role !== 'ORGANIZER') {
            window.location.href = '/auth/login';
            return;
        }

        Promise.all([
            listOrganizerEvents(1, 100),
            listTicketTypes(eventId),
            listEventOrders(eventId),
        ])
            .then(([eventsPage, ttRes, ordersPage]) => {
                const found = eventsPage.items.find((e) => e.id === eventId);
                if (!found) {
                    window.location.href = '/organizer/events';
                    return;
                }
                setEvent(found);
                setTicketTypes(ttRes.items);
                setOrders(ordersPage.items);
            })
            .catch(() => setError('Không thể tải dữ liệu.'))
            .finally(() => setLoading(false));
    }, []);

    function setField(field: keyof TicketForm) {
        return (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        ) => setTicketForm((prev) => ({ ...prev, [field]: e.target.value }));
    }

    async function handleAddTicketType(e: FormEvent) {
        e.preventDefault();
        setFormError('');
        setSaving(true);

        try {
            const payload: CreateTicketTypePayload = {
                name: ticketForm.name,
                ...(ticketForm.description
                    ? { description: ticketForm.description }
                    : {}),
                price: parseInt(ticketForm.price, 10),
                totalQuantity: parseInt(ticketForm.totalQuantity, 10),
                ...(ticketForm.maxPerOrder
                    ? { maxPerOrder: parseInt(ticketForm.maxPerOrder, 10) }
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
            <div className="dash-shell">
                <DashHeader userName={user?.name} activeNav="events" role="ORGANIZER" onLogout={logout} />
                <main className="dash-main">
                    <div className="dash-loading">Đang tải...</div>
                </main>
            </div>
        );
    }

    if (!event) return null;

    const canEdit = event.status === 'DRAFT' || event.status === 'REJECTED';
    const statusClass = `status-${event.status.toLowerCase().replace(/_/g, '-')}`;

    return (
        <div className="dash-shell">
            <DashHeader userName={user?.name} activeNav="events" role="ORGANIZER" onLogout={logout} />

            <main className="dash-main">
                <a className="ef-back-link" href="/organizer/events">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Sự kiện của tôi
                </a>

                <div className="ed-event-header">
                    <div className="ed-event-title-group">
                        <h1>{event.title}</h1>
                        <span className={`status-badge ${statusClass}`}>
                            {STATUS_LABEL[event.status]}
                        </span>
                    </div>
                    <div className="ed-event-meta">
                        <span>
                            <span className="material-symbols-outlined">calendar_month</span>
                            {formatDate(event.startsAt)}
                        </span>
                        <span>
                            <span className="material-symbols-outlined">location_on</span>
                            {event.venue.city}
                        </span>
                    </div>
                    {canEdit && (
                        <a
                            className="btn-outline"
                            href={`/organizer/events/${eventId}/edit`}
                        >
                            Chỉnh sửa sự kiện
                        </a>
                    )}
                </div>

                {error && <div className="dash-error">{error}</div>}

                <section className="ed-section">
                    <div className="ed-section-header">
                        <h2>Loại vé</h2>
                        {canEdit && !showAddForm && (
                            <button
                                className="btn-primary"
                                type="button"
                                onClick={() => setShowAddForm(true)}
                            >
                                <span className="material-symbols-outlined">add</span>
                                Thêm loại vé
                            </button>
                        )}
                    </div>

                    {showAddForm && (
                        <form className="ed-ticket-form" onSubmit={handleAddTicketType}>
                            <h3>Loại vé mới</h3>

                            {formError && (
                                <div className="dash-error">{formError}</div>
                            )}

                            <div className="ef-row">
                                <div className="ef-field">
                                    <label htmlFor="tt-name">Tên loại vé *</label>
                                    <input
                                        id="tt-name"
                                        type="text"
                                        value={ticketForm.name}
                                        onChange={setField('name')}
                                        placeholder="VIP, Thường, Sinh viên..."
                                        required
                                        maxLength={120}
                                    />
                                </div>
                                <div className="ef-field">
                                    <label htmlFor="tt-price">Giá (VND) *</label>
                                    <input
                                        id="tt-price"
                                        type="number"
                                        value={ticketForm.price}
                                        onChange={setField('price')}
                                        placeholder="0"
                                        required
                                        min={0}
                                    />
                                </div>
                            </div>

                            <div className="ef-field">
                                <label htmlFor="tt-desc">
                                    Mô tả <span className="ef-optional">(tùy chọn)</span>
                                </label>
                                <textarea
                                    id="tt-desc"
                                    value={ticketForm.description}
                                    onChange={setField('description')}
                                    placeholder="Quyền lợi đi kèm..."
                                    rows={2}
                                />
                            </div>

                            <div className="ef-row">
                                <div className="ef-field">
                                    <label htmlFor="tt-qty">Số lượng *</label>
                                    <input
                                        id="tt-qty"
                                        type="number"
                                        value={ticketForm.totalQuantity}
                                        onChange={setField('totalQuantity')}
                                        placeholder="100"
                                        required
                                        min={1}
                                    />
                                </div>
                                <div className="ef-field">
                                    <label htmlFor="tt-max">
                                        Tối đa / đơn <span className="ef-optional">(tùy chọn)</span>
                                    </label>
                                    <input
                                        id="tt-max"
                                        type="number"
                                        value={ticketForm.maxPerOrder}
                                        onChange={setField('maxPerOrder')}
                                        placeholder="4"
                                        min={1}
                                    />
                                </div>
                            </div>

                            <div className="ef-row">
                                <div className="ef-field">
                                    <label htmlFor="tt-sale-start">Mở bán *</label>
                                    <input
                                        id="tt-sale-start"
                                        type="datetime-local"
                                        value={ticketForm.saleStartsAt}
                                        onChange={setField('saleStartsAt')}
                                        required
                                    />
                                </div>
                                <div className="ef-field">
                                    <label htmlFor="tt-sale-end">Kết thúc bán *</label>
                                    <input
                                        id="tt-sale-end"
                                        type="datetime-local"
                                        value={ticketForm.saleEndsAt}
                                        onChange={setField('saleEndsAt')}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="ef-actions">
                                <button
                                    type="button"
                                    className="btn-outline"
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
                                    className="btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? 'Đang lưu...' : 'Tạo loại vé'}
                                </button>
                            </div>
                        </form>
                    )}

                    {ticketTypes.length === 0 && !showAddForm ? (
                        <div className="dash-empty">
                            <span className="material-symbols-outlined dash-empty-icon">
                                confirmation_number
                            </span>
                            <p>Chưa có loại vé nào.</p>
                        </div>
                    ) : (
                        <div className="ed-ticket-list">
                            {ticketTypes.map((tt) => (
                                <TicketTypeCard key={tt.id} ticketType={tt} />
                            ))}
                        </div>
                    )}
                </section>

                <section className="ed-section">
                    <div className="ed-section-header">
                        <h2>Đơn hàng</h2>
                        <span className="ed-count">{orders.length} đơn</span>
                    </div>

                    {orders.length === 0 ? (
                        <div className="dash-empty">
                            <span className="material-symbols-outlined dash-empty-icon">
                                receipt_long
                            </span>
                            <p>Chưa có đơn hàng nào.</p>
                        </div>
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
            </main>
        </div>
    );
}

function TicketTypeCard({ ticketType }: { ticketType: TicketType }) {
    const soldPct = ticketType.totalQuantity > 0
        ? Math.round(((ticketType.totalQuantity - ticketType.availableQuantity) / ticketType.totalQuantity) * 100)
        : 0;

    return (
        <div className="ed-ticket-card">
            <div className="ed-ticket-card-top">
                <span className="ed-ticket-name">{ticketType.name}</span>
                <span className="ed-ticket-price">
                    {ticketType.price === 0
                        ? 'Miễn phí'
                        : ticketType.price.toLocaleString('vi-VN') + ' đ'}
                </span>
            </div>
            {ticketType.description && (
                <p className="ed-ticket-desc">{ticketType.description}</p>
            )}
            <div className="ed-ticket-stats">
                <span>
                    <span className="material-symbols-outlined">group</span>
                    {ticketType.totalQuantity - ticketType.availableQuantity}/{ticketType.totalQuantity} bán ({soldPct}%)
                </span>
                <span>
                    <span className="material-symbols-outlined">schedule</span>
                    {formatDate(ticketType.saleStartsAt)} – {formatDate(ticketType.saleEndsAt)}
                </span>
                {ticketType.maxPerOrder && (
                    <span>
                        <span className="material-symbols-outlined">person</span>
                        Tối đa {ticketType.maxPerOrder}/đơn
                    </span>
                )}
            </div>
        </div>
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
