import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { getStoredAuthUser } from '../auth/authSession';
import {
    createEvent,
    getOrganizerEvent,
    submitEvent,
    updateEvent,
    type CreateEventPayload,
    type EventStatus,
    type OrganizerEvent,
} from '../../api/events.api';
import {
    createTicketType,
    type CreateTicketTypePayload,
} from '../../api/ticket-types.api';
import { MaterialIcon, PublicFooter, PublicHeader } from '../../shared/PublicLayout';
import './EventFormPage.css';

type Props = { mode: 'create' } | { mode: 'edit'; eventId: string };

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
    const eventId = isEdit
        ? (props as { mode: 'edit'; eventId: string }).eventId
        : null;
    const canEdit =
        !eventStatus || eventStatus === 'DRAFT' || eventStatus === 'REJECTED';
    const canSubmit =
        isEdit && (eventStatus === 'DRAFT' || eventStatus === 'REJECTED');
    const statusClass = eventStatus
        ? `status-${eventStatus.toLowerCase().replace(/_/g, '-')}`
        : '';
    const cancelHref = eventId
        ? `/organizer/events/${eventId}`
        : '/organizer/events';

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
        return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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
                window.location.href = `/organizer/events/${eventId}`;
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
            window.location.href = `/organizer/events/${eventId}`;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi.');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <FormShell>
                <StateMessage
                    icon="hourglass_top"
                    title="Đang tải sự kiện"
                    text="Biểu mẫu chỉnh sửa sẽ hiển thị ngay khi API phản hồi."
                />
            </FormShell>
        );
    }

    return (
        <main className="event-form-page">
            <PublicHeader active="events" />

            <section className="ef-hero">
                <div>
                    <div className="ef-breadcrumb">
                        <a href="/organizer/events">
                            <MaterialIcon>arrow_back</MaterialIcon>
                            Sự kiện của tôi
                        </a>
                    </div>
                    <span className="ef-eyebrow">
                        <MaterialIcon>
                            {isEdit ? 'edit_calendar' : 'add_circle'}
                        </MaterialIcon>
                        Organizer dashboard
                    </span>
                    <h1>{isEdit ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}</h1>
                    <p>
                        {isEdit
                            ? 'Cập nhật thông tin sự kiện, địa điểm và thời gian tổ chức.'
                            : 'Tạo bản nháp sự kiện, cấu hình vé ban đầu và tiếp tục quản lý trước khi gửi duyệt.'}
                    </p>
                </div>
                <div className="ef-hero-actions">
                    {eventStatus ? (
                        <span className={`ef-status ${statusClass}`}>
                            {STATUS_LABEL[eventStatus]}
                        </span>
                    ) : null}
                    {canSubmit ? (
                        <button
                            className="ef-review-button"
                            type="button"
                            onClick={handleSubmitForReview}
                            disabled={submitting}
                        >
                            <MaterialIcon>send</MaterialIcon>
                            {submitting ? 'Đang gửi...' : 'Nộp xét duyệt'}
                        </button>
                    ) : null}
                </div>
            </section>

            {error ? <div className="ef-error">{error}</div> : null}

            <form className="ef-form" onSubmit={handleSave}>
                <section className="ef-section">
                    <SectionTitle
                        icon="event"
                        title="Thông tin sự kiện"
                        text="Tên, danh mục, mô tả và ảnh đại diện của sự kiện."
                    />

                    <Field id="ef-title" label="Tên sự kiện *">
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
                    </Field>

                    <Field id="ef-category" label="Danh mục *">
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
                    </Field>

                    <Field id="ef-description" label="Mô tả *">
                        <textarea
                            id="ef-description"
                            value={form.description}
                            onChange={set('description')}
                            placeholder="Mô tả chi tiết về sự kiện..."
                            required
                            disabled={!canEdit}
                            rows={5}
                        />
                    </Field>

                    <Field id="ef-thumbnail" label="URL ảnh bìa">
                        <input
                            id="ef-thumbnail"
                            type="url"
                            value={form.thumbnailUrl}
                            onChange={set('thumbnailUrl')}
                            placeholder="https://..."
                            disabled={!canEdit}
                        />
                    </Field>
                </section>

                <section className="ef-section">
                    <SectionTitle
                        icon="location_on"
                        title="Địa điểm"
                        text="Thông tin nơi diễn ra sự kiện."
                    />

                    <div className="ef-row">
                        <Field id="ef-venue-name" label="Tên địa điểm *">
                            <input
                                id="ef-venue-name"
                                type="text"
                                value={form.venueName}
                                onChange={set('venueName')}
                                placeholder="Nhà thi đấu, sân khấu..."
                                required
                                disabled={!canEdit}
                            />
                        </Field>

                        <Field id="ef-venue-city" label="Thành phố *">
                            <input
                                id="ef-venue-city"
                                type="text"
                                value={form.venueCity}
                                onChange={set('venueCity')}
                                placeholder="Hà Nội, TP.HCM..."
                                required
                                disabled={!canEdit}
                            />
                        </Field>
                    </div>

                    <Field id="ef-venue-address" label="Địa chỉ *">
                        <input
                            id="ef-venue-address"
                            type="text"
                            value={form.venueAddress}
                            onChange={set('venueAddress')}
                            placeholder="Số nhà, tên đường..."
                            required
                            disabled={!canEdit}
                        />
                    </Field>

                    <div className="ef-row">
                        <Field id="ef-venue-district" label="Quận / Huyện">
                            <input
                                id="ef-venue-district"
                                type="text"
                                value={form.venueDistrict}
                                onChange={set('venueDistrict')}
                                placeholder="Quận 1, Hoàn Kiếm..."
                                disabled={!canEdit}
                            />
                        </Field>

                        <Field id="ef-venue-map" label="Link bản đồ">
                            <input
                                id="ef-venue-map"
                                type="url"
                                value={form.venueMapUrl}
                                onChange={set('venueMapUrl')}
                                placeholder="https://maps.google.com/..."
                                disabled={!canEdit}
                            />
                        </Field>
                    </div>
                </section>

                <section className="ef-section">
                    <SectionTitle
                        icon="calendar_month"
                        title="Thời gian tổ chức"
                        text="Khoảng thời gian sự kiện bắt đầu và kết thúc."
                    />

                    <div className="ef-row">
                        <Field id="ef-starts-at" label="Bắt đầu *">
                            <input
                                id="ef-starts-at"
                                type="datetime-local"
                                value={form.startsAt}
                                onChange={set('startsAt')}
                                required
                                disabled={!canEdit}
                            />
                        </Field>

                        <Field id="ef-ends-at" label="Kết thúc *">
                            <input
                                id="ef-ends-at"
                                type="datetime-local"
                                value={form.endsAt}
                                onChange={set('endsAt')}
                                required
                                disabled={!canEdit}
                            />
                        </Field>
                    </div>
                </section>

                {!isEdit ? (
                    <section className="ef-section ef-ticket-section">
                        <div className="ef-section-title-row">
                            <SectionTitle
                                icon="confirmation_number"
                                title="Loại vé ban đầu"
                                text="Thiết lập vé để sẵn sàng mở bán sau khi sự kiện được duyệt."
                            />
                            <button
                                type="button"
                                className="ef-secondary-button"
                                onClick={addTicketForm}
                            >
                                <MaterialIcon>add</MaterialIcon>
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
                                            onClick={() =>
                                                removeTicketForm(index)
                                            }
                                        >
                                            Xóa
                                        </button>
                                    </div>

                                    <div className="ef-row">
                                        <Field
                                            id={`ef-ticket-name-${index}`}
                                            label="Tên loại vé"
                                        >
                                            <input
                                                id={`ef-ticket-name-${index}`}
                                                type="text"
                                                value={ticket.name}
                                                onChange={setTicketField(
                                                    index,
                                                    'name',
                                                )}
                                                placeholder="VIP, Thường, Sinh viên..."
                                                maxLength={120}
                                            />
                                        </Field>
                                        <Field
                                            id={`ef-ticket-price-${index}`}
                                            label="Giá (VND)"
                                        >
                                            <input
                                                id={`ef-ticket-price-${index}`}
                                                type="number"
                                                value={ticket.price}
                                                onChange={setTicketField(
                                                    index,
                                                    'price',
                                                )}
                                                placeholder="150000"
                                                min={0}
                                            />
                                        </Field>
                                    </div>

                                    <Field
                                        id={`ef-ticket-desc-${index}`}
                                        label="Mô tả"
                                    >
                                        <textarea
                                            id={`ef-ticket-desc-${index}`}
                                            value={ticket.description}
                                            onChange={setTicketField(
                                                index,
                                                'description',
                                            )}
                                            placeholder="Quyền lợi đi kèm..."
                                            rows={2}
                                        />
                                    </Field>

                                    <div className="ef-row">
                                        <Field
                                            id={`ef-ticket-qty-${index}`}
                                            label="Số lượng"
                                        >
                                            <input
                                                id={`ef-ticket-qty-${index}`}
                                                type="number"
                                                value={ticket.totalQuantity}
                                                onChange={setTicketField(
                                                    index,
                                                    'totalQuantity',
                                                )}
                                                placeholder="200"
                                                min={1}
                                            />
                                        </Field>
                                        <Field
                                            id={`ef-ticket-max-${index}`}
                                            label="Tối đa / đơn"
                                        >
                                            <input
                                                id={`ef-ticket-max-${index}`}
                                                type="number"
                                                value={ticket.maxPerOrder}
                                                onChange={setTicketField(
                                                    index,
                                                    'maxPerOrder',
                                                )}
                                                placeholder="4"
                                                min={1}
                                            />
                                        </Field>
                                    </div>

                                    <div className="ef-row">
                                        <Field
                                            id={`ef-ticket-sale-start-${index}`}
                                            label="Mở bán"
                                        >
                                            <input
                                                id={`ef-ticket-sale-start-${index}`}
                                                type="datetime-local"
                                                value={ticket.saleStartsAt}
                                                onChange={setTicketField(
                                                    index,
                                                    'saleStartsAt',
                                                )}
                                            />
                                        </Field>
                                        <Field
                                            id={`ef-ticket-sale-end-${index}`}
                                            label="Kết thúc bán"
                                        >
                                            <input
                                                id={`ef-ticket-sale-end-${index}`}
                                                type="datetime-local"
                                                value={ticket.saleEndsAt}
                                                onChange={setTicketField(
                                                    index,
                                                    'saleEndsAt',
                                                )}
                                            />
                                        </Field>
                                    </div>
                                </div>
                            ))
                        )}
                    </section>
                ) : null}

                {!canEdit && eventStatus ? (
                    <div className="ef-readonly-note">
                        <MaterialIcon>info</MaterialIcon>
                        Sự kiện đang ở trạng thái{' '}
                        <strong>{STATUS_LABEL[eventStatus]}</strong>, không thể
                        chỉnh sửa.
                    </div>
                ) : null}

                {canEdit ? (
                    <div className="ef-actions">
                        <a className="ef-secondary-button" href={cancelHref}>
                            Hủy
                        </a>
                        <button
                            className="ef-primary-button"
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
                ) : null}
            </form>

            <PublicFooter />
        </main>
    );
}

function FormShell({ children }: { children: ReactNode }) {
    return (
        <main className="event-form-page">
            <PublicHeader active="events" />
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
        <section className="ef-state">
            <MaterialIcon>{icon}</MaterialIcon>
            <h1>{title}</h1>
            <p>{text}</p>
        </section>
    );
}

function SectionTitle({
    icon,
    text,
    title,
}: {
    icon: string;
    text: string;
    title: string;
}) {
    return (
        <div className="ef-section-title">
            <span>
                <MaterialIcon>{icon}</MaterialIcon>
            </span>
            <div>
                <h2>{title}</h2>
                <p>{text}</p>
            </div>
        </div>
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
        <div className="ef-field">
            <label htmlFor={id}>{label}</label>
            {children}
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
    return ticketForms.filter(hasTicketInput).map((ticket) => {
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
            throw new Error(
                'Số vé tối đa mỗi đơn phải là số nguyên từ 1 trở lên.',
            );
        }

        if (saleEndsAt.getTime() <= saleStartsAt.getTime()) {
            throw new Error(
                'Thời gian kết thúc bán vé phải sau thời gian mở bán.',
            );
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
