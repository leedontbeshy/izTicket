import { useState, useEffect, type FormEvent } from 'react';
import { getStoredAuthUser } from './authSession';
import {
    getOrganizerEvent,
    createEvent,
    updateEvent,
    submitEvent,
    type OrganizerEvent,
    type CreateEventPayload,
    type EventStatus,
} from './api/events.api';
import {
    createTicketType,
    type CreateTicketTypePayload,
} from './api/ticket-types.api';
import { DashHeader } from './DashboardLayout';
import { logout } from './dashboardLogout';
import './EventFormPage.css';

type Props =
    | { mode: 'create' }
    | { mode: 'edit'; eventId: string };

type FormState = {
    title: string;
    description: string;
    category: string;
    thumbnailUrl: string;
    startsAt: string;
    endsAt: string;
    venueName: string;
    venueAddress: string;
    venueCity: string;
    venueDistrict: string;
    venueMapUrl: string;
};

type TicketForm = {
    name: string;
    description: string;
    price: string;
    totalQuantity: string;
    maxPerOrder: string;
    saleStartsAt: string;
    saleEndsAt: string;
};

const EMPTY_FORM: FormState = {
    title: '',
    description: '',
    category: '',
    thumbnailUrl: '',
    startsAt: '',
    endsAt: '',
    venueName: '',
    venueAddress: '',
    venueCity: '',
    venueDistrict: '',
    venueMapUrl: '',
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

const CATEGORIES: { value: string; label: string }[] = [
    { value: 'music', label: 'Âm nhạc' },
    { value: 'sports', label: 'Thể thao' },
    { value: 'tech', label: 'Công nghệ' },
    { value: 'arts', label: 'Nghệ thuật' },
    { value: 'food', label: 'Ẩm thực' },
    { value: 'culture', label: 'Văn hóa' },
    { value: 'education', label: 'Giáo dục' },
    { value: 'business', label: 'Kinh doanh' },
    { value: 'entertainment', label: 'Giải trí' },
    { value: 'other', label: 'Khác' },
];

const STATUS_LABEL: Record<EventStatus, string> = {
    DRAFT: 'Bản nháp',
    PENDING_REVIEW: 'Chờ duyệt',
    PUBLISHED: 'Đã xuất bản',
    REJECTED: 'Bị từ chối',
    CANCELLED: 'Đã hủy',
};

export function EventFormPage(props: Props) {
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [eventStatus, setEventStatus] = useState<EventStatus | null>(null);
    const [loading, setLoading] = useState(props.mode === 'edit');
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [ticketForms, setTicketForms] = useState<TicketForm[]>(
        props.mode === 'create' ? [createEmptyTicketForm()] : [],
    );

    const user = getStoredAuthUser();
    const isOrganizer = user?.role === 'ORGANIZER';
    const isEdit = props.mode === 'edit';
    const eventId = isEdit ? (props as { mode: 'edit'; eventId: string }).eventId : null;
    const canEdit =
        !eventStatus ||
        eventStatus === 'DRAFT' ||
        eventStatus === 'REJECTED';
    const canSubmit =
        isEdit &&
        (eventStatus === 'DRAFT' || eventStatus === 'REJECTED');

    useEffect(() => {
        if (!isOrganizer) {
            window.location.href = '/auth/login';
            return;
        }

        if (!isEdit || !eventId) return;

        getOrganizerEvent(eventId)
            .then((event) => {
                setEventStatus(event.status);
                setForm(eventToForm(event));
            })
            .catch(() => {
                window.location.href = '/organizer/events';
            })
            .finally(() => setLoading(false));
    }, [eventId, isEdit, isOrganizer]);

    function set(field: keyof FormState) {
        return (
            e: React.ChangeEvent<
                HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            >,
        ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
    }

    function setTicketField(index: number, field: keyof TicketForm) {
        return (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        ) =>
            setTicketForms((current) =>
                current.map((ticket, ticketIndex) =>
                    ticketIndex === index
                        ? { ...ticket, [field]: e.target.value }
                        : ticket,
                ),
            );
    }

    function addTicketForm() {
        setTicketForms((current) => [...current, createEmptyTicketForm()]);
    }

    function removeTicketForm(index: number) {
        setTicketForms((current) =>
            current.filter((_, ticketIndex) => ticketIndex !== index),
        );
    }

    async function handleSave(e: FormEvent) {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            const payload = formToPayload(form);
            const ticketPayloads = isEdit
                ? []
                : ticketFormsToPayloads(ticketForms);

            if (isEdit && eventId) {
                await updateEvent(eventId, payload);
                window.location.href = '/organizer/events';
            } else {
                const created = await createEvent(payload);
                for (const ticketPayload of ticketPayloads) {
                    await createTicketType(created.id, ticketPayload);
                }
                window.location.href = `/organizer/events/${created.id}`;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi.');
        } finally {
            setSaving(false);
        }
    }

    async function handleSubmitForReview() {
        if (!eventId) return;
        setError('');
        setSubmitting(true);
        try {
            await submitEvent(eventId);
            window.location.href = '/organizer/events';
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="dash-shell">
                <DashHeader
                    userName={user?.name}
                    activeNav="events"
                    role="ORGANIZER"
                    onLogout={logout}
                />
                <main className="dash-main">
                    <div className="dash-loading">Đang tải...</div>
                </main>
            </div>
        );
    }

    const statusClass = eventStatus
        ? `status-${eventStatus.toLowerCase().replace(/_/g, '-')}`
        : '';

    return (
        <div className="dash-shell">
            <DashHeader
                userName={user?.name}
                activeNav="events"
                role="ORGANIZER"
                onLogout={logout}
            />

            <main className="dash-main">
                <a className="ef-back-link" href="/organizer/events">
                    <span className="material-symbols-outlined">
                        arrow_back
                    </span>
                    Sự kiện của tôi
                </a>

                <div className="ef-title-row">
                    <div className="ef-title-group">
                        <h1>
                            {isEdit
                                ? 'Chỉnh sửa sự kiện'
                                : 'Tạo sự kiện mới'}
                        </h1>
                        {eventStatus && (
                            <span
                                className={`status-badge ${statusClass}`}
                            >
                                {STATUS_LABEL[eventStatus]}
                            </span>
                        )}
                    </div>

                    {canSubmit && (
                        <button
                            className="btn-submit-review"
                            type="button"
                            onClick={handleSubmitForReview}
                            disabled={submitting}
                        >
                            <span className="material-symbols-outlined">
                                send
                            </span>
                            {submitting ? 'Đang gửi...' : 'Nộp xét duyệt'}
                        </button>
                    )}
                </div>

                {error && <div className="dash-error">{error}</div>}

                <form className="ef-form" onSubmit={handleSave}>
                    <section className="ef-section">
                        <h2>Thông tin sự kiện</h2>

                        <div className="ef-field">
                            <label htmlFor="ef-title">Tên sự kiện *</label>
                            <input
                                id="ef-title"
                                type="text"
                                value={form.title}
                                onChange={set('title')}
                                placeholder="Nhập tên sự kiện"
                                required
                                disabled={!canEdit}
                                maxLength={180}
                            />
                        </div>

                        <div className="ef-field">
                            <label htmlFor="ef-category">Danh mục *</label>
                            <select
                                id="ef-category"
                                value={form.category}
                                onChange={set('category')}
                                required
                                disabled={!canEdit}
                            >
                                <option value="">Chọn danh mục</option>
                                {CATEGORIES.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="ef-field">
                            <label htmlFor="ef-description">Mô tả *</label>
                            <textarea
                                id="ef-description"
                                value={form.description}
                                onChange={set('description')}
                                placeholder="Mô tả chi tiết về sự kiện..."
                                required
                                disabled={!canEdit}
                                rows={5}
                            />
                        </div>

                        <div className="ef-field">
                            <label htmlFor="ef-thumbnail">
                                URL ảnh bìa
                                <span className="ef-optional">(tùy chọn)</span>
                            </label>
                            <input
                                id="ef-thumbnail"
                                type="url"
                                value={form.thumbnailUrl}
                                onChange={set('thumbnailUrl')}
                                placeholder="https://..."
                                disabled={!canEdit}
                            />
                        </div>
                    </section>

                    <section className="ef-section">
                        <h2>Địa điểm</h2>

                        <div className="ef-row">
                            <div className="ef-field">
                                <label htmlFor="ef-venue-name">
                                    Tên địa điểm *
                                </label>
                                <input
                                    id="ef-venue-name"
                                    type="text"
                                    value={form.venueName}
                                    onChange={set('venueName')}
                                    placeholder="Nhà thi đấu, sân khấu..."
                                    required
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="ef-field">
                                <label htmlFor="ef-venue-city">
                                    Thành phố *
                                </label>
                                <input
                                    id="ef-venue-city"
                                    type="text"
                                    value={form.venueCity}
                                    onChange={set('venueCity')}
                                    placeholder="Hà Nội, TP.HCM..."
                                    required
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>

                        <div className="ef-field">
                            <label htmlFor="ef-venue-address">
                                Địa chỉ *
                            </label>
                            <input
                                id="ef-venue-address"
                                type="text"
                                value={form.venueAddress}
                                onChange={set('venueAddress')}
                                placeholder="Số nhà, tên đường..."
                                required
                                disabled={!canEdit}
                            />
                        </div>

                        <div className="ef-row">
                            <div className="ef-field">
                                <label htmlFor="ef-venue-district">
                                    Quận / Huyện
                                    <span className="ef-optional">(tùy chọn)</span>
                                </label>
                                <input
                                    id="ef-venue-district"
                                    type="text"
                                    value={form.venueDistrict}
                                    onChange={set('venueDistrict')}
                                    placeholder="Quận 1, Hoàn Kiếm..."
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="ef-field">
                                <label htmlFor="ef-venue-map">
                                    Link bản đồ
                                    <span className="ef-optional">(tùy chọn)</span>
                                </label>
                                <input
                                    id="ef-venue-map"
                                    type="url"
                                    value={form.venueMapUrl}
                                    onChange={set('venueMapUrl')}
                                    placeholder="https://maps.google.com/..."
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="ef-section">
                        <h2>Thời gian tổ chức</h2>

                        <div className="ef-row">
                            <div className="ef-field">
                                <label htmlFor="ef-starts-at">
                                    Bắt đầu *
                                </label>
                                <input
                                    id="ef-starts-at"
                                    type="datetime-local"
                                    value={form.startsAt}
                                    onChange={set('startsAt')}
                                    required
                                    disabled={!canEdit}
                                />
                            </div>

                            <div className="ef-field">
                                <label htmlFor="ef-ends-at">
                                    Kết thúc *
                                </label>
                                <input
                                    id="ef-ends-at"
                                    type="datetime-local"
                                    value={form.endsAt}
                                    onChange={set('endsAt')}
                                    required
                                    disabled={!canEdit}
                                />
                            </div>
                        </div>
                    </section>

                    {!isEdit && (
                        <section className="ef-section ef-ticket-section">
                            <div className="ef-section-title-row">
                                <div>
                                    <h2>Loại vé ban đầu</h2>
                                    <p>
                                        API tạo event trước, sau đó tạo loại vé
                                        theo mã event vừa sinh.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="btn-outline"
                                    onClick={addTicketForm}
                                >
                                    <span className="material-symbols-outlined">
                                        add
                                    </span>
                                    Thêm loại vé
                                </button>
                            </div>

                            {ticketForms.length === 0 ? (
                                <div className="ef-ticket-empty">
                                    Có thể tạo bản nháp trước và thêm vé sau.
                                </div>
                            ) : (
                                ticketForms.map((ticket, index) => (
                                    <div className="ef-ticket-block" key={index}>
                                        <div className="ef-ticket-block-header">
                                            <h3>Loại vé {index + 1}</h3>
                                            <button
                                                type="button"
                                                onClick={() => removeTicketForm(index)}
                                            >
                                                Xóa
                                            </button>
                                        </div>

                                        <div className="ef-row">
                                            <div className="ef-field">
                                                <label htmlFor={`ef-ticket-name-${index}`}>
                                                    Tên loại vé
                                                </label>
                                                <input
                                                    id={`ef-ticket-name-${index}`}
                                                    type="text"
                                                    value={ticket.name}
                                                    onChange={setTicketField(index, 'name')}
                                                    placeholder="VIP, Thường, Sinh viên..."
                                                    maxLength={120}
                                                />
                                            </div>
                                            <div className="ef-field">
                                                <label htmlFor={`ef-ticket-price-${index}`}>
                                                    Giá (VND)
                                                </label>
                                                <input
                                                    id={`ef-ticket-price-${index}`}
                                                    type="number"
                                                    value={ticket.price}
                                                    onChange={setTicketField(index, 'price')}
                                                    placeholder="150000"
                                                    min={0}
                                                />
                                            </div>
                                        </div>

                                        <div className="ef-field">
                                            <label htmlFor={`ef-ticket-desc-${index}`}>
                                                Mô tả{' '}
                                                <span className="ef-optional">(tùy chọn)</span>
                                            </label>
                                            <textarea
                                                id={`ef-ticket-desc-${index}`}
                                                value={ticket.description}
                                                onChange={setTicketField(index, 'description')}
                                                placeholder="Quyền lợi đi kèm..."
                                                rows={2}
                                            />
                                        </div>

                                        <div className="ef-row">
                                            <div className="ef-field">
                                                <label htmlFor={`ef-ticket-qty-${index}`}>
                                                    Số lượng
                                                </label>
                                                <input
                                                    id={`ef-ticket-qty-${index}`}
                                                    type="number"
                                                    value={ticket.totalQuantity}
                                                    onChange={setTicketField(index, 'totalQuantity')}
                                                    placeholder="200"
                                                    min={1}
                                                />
                                            </div>
                                            <div className="ef-field">
                                                <label htmlFor={`ef-ticket-max-${index}`}>
                                                    Tối đa / đơn{' '}
                                                    <span className="ef-optional">(tùy chọn)</span>
                                                </label>
                                                <input
                                                    id={`ef-ticket-max-${index}`}
                                                    type="number"
                                                    value={ticket.maxPerOrder}
                                                    onChange={setTicketField(index, 'maxPerOrder')}
                                                    placeholder="4"
                                                    min={1}
                                                />
                                            </div>
                                        </div>

                                        <div className="ef-row">
                                            <div className="ef-field">
                                                <label htmlFor={`ef-ticket-sale-start-${index}`}>
                                                    Mở bán
                                                </label>
                                                <input
                                                    id={`ef-ticket-sale-start-${index}`}
                                                    type="datetime-local"
                                                    value={ticket.saleStartsAt}
                                                    onChange={setTicketField(index, 'saleStartsAt')}
                                                />
                                            </div>
                                            <div className="ef-field">
                                                <label htmlFor={`ef-ticket-sale-end-${index}`}>
                                                    Kết thúc bán
                                                </label>
                                                <input
                                                    id={`ef-ticket-sale-end-${index}`}
                                                    type="datetime-local"
                                                    value={ticket.saleEndsAt}
                                                    onChange={setTicketField(index, 'saleEndsAt')}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </section>
                    )}

                    {!canEdit && eventStatus && (
                        <div className="ef-readonly-note">
                            <span className="material-symbols-outlined">
                                info
                            </span>
                            Sự kiện đang ở trạng thái{' '}
                            <strong>{STATUS_LABEL[eventStatus]}</strong> —
                            không thể chỉnh sửa.
                        </div>
                    )}

                    {canEdit && (
                        <div className="ef-actions">
                            <a
                                className="btn-outline"
                                href="/organizer/events"
                            >
                                Hủy
                            </a>
                            <button
                                className="btn-primary"
                                type="submit"
                                disabled={saving}
                            >
                                {saving
                                    ? 'Đang lưu...'
                                    : isEdit
                                      ? 'Lưu thay đổi'
                                      : 'Tạo sự kiện'}
                            </button>
                        </div>
                    )}
                </form>
            </main>
        </div>
    );
}

function eventToForm(event: OrganizerEvent): FormState {
    return {
        title: event.title,
        description: event.description,
        category: event.category,
        thumbnailUrl: event.thumbnailUrl ?? '',
        startsAt: isoToDateTimeLocal(event.startsAt),
        endsAt: isoToDateTimeLocal(event.endsAt),
        venueName: event.venue.name,
        venueAddress: event.venue.address,
        venueCity: event.venue.city,
        venueDistrict: event.venue.district ?? '',
        venueMapUrl: event.venue.mapUrl ?? '',
    };
}

function formToPayload(form: FormState): CreateEventPayload {
    return {
        title: form.title,
        description: form.description,
        category: form.category,
        ...(form.thumbnailUrl ? { thumbnailUrl: form.thumbnailUrl } : {}),
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        venue: {
            name: form.venueName,
            address: form.venueAddress,
            city: form.venueCity,
            ...(form.venueDistrict ? { district: form.venueDistrict } : {}),
            ...(form.venueMapUrl ? { mapUrl: form.venueMapUrl } : {}),
        },
    };
}

function ticketFormsToPayloads(
    ticketForms: TicketForm[],
): CreateTicketTypePayload[] {
    return ticketForms
        .filter(hasTicketInput)
        .map((ticket) => {
            if (
                !ticket.name ||
                !ticket.price ||
                !ticket.totalQuantity ||
                !ticket.saleStartsAt ||
                !ticket.saleEndsAt
            ) {
                throw new Error(
                    'Vui lòng điền đủ tên, giá, số lượng và thời gian bán vé.',
                );
            }

            const saleStartsAt = new Date(ticket.saleStartsAt);
            const saleEndsAt = new Date(ticket.saleEndsAt);
            const price = Number(ticket.price);
            const totalQuantity = Number(ticket.totalQuantity);
            const maxPerOrder = ticket.maxPerOrder
                ? Number(ticket.maxPerOrder)
                : null;

            if (
                Number.isNaN(saleStartsAt.getTime()) ||
                Number.isNaN(saleEndsAt.getTime())
            ) {
                throw new Error('Thời gian bán vé không hợp lệ.');
            }

            if (!Number.isInteger(price) || price < 0) {
                throw new Error('Giá vé phải là số nguyên không âm.');
            }

            if (!Number.isInteger(totalQuantity) || totalQuantity < 1) {
                throw new Error('Số lượng vé phải là số nguyên từ 1 trở lên.');
            }

            if (
                maxPerOrder !== null &&
                (!Number.isInteger(maxPerOrder) || maxPerOrder < 1)
            ) {
                throw new Error('Số vé tối đa mỗi đơn phải là số nguyên từ 1 trở lên.');
            }

            if (saleEndsAt.getTime() <= saleStartsAt.getTime()) {
                throw new Error('Thời gian kết thúc bán vé phải sau thời gian mở bán.');
            }

            return {
                name: ticket.name.trim(),
                ...(ticket.description
                    ? { description: ticket.description.trim() }
                    : {}),
                price,
                totalQuantity,
                ...(maxPerOrder !== null ? { maxPerOrder } : {}),
                saleStartsAt: saleStartsAt.toISOString(),
                saleEndsAt: saleEndsAt.toISOString(),
            };
        });
}

function hasTicketInput(ticket: TicketForm) {
    return Object.values(ticket).some((value) => value.trim() !== '');
}

function createEmptyTicketForm(): TicketForm {
    return { ...EMPTY_TICKET_FORM };
}

function isoToDateTimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
