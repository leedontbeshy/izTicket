import { useState, useEffect, type FormEvent } from 'react';
import { getStoredAuthUser } from './authSession';
import {
    listOrganizerEvents,
    createEvent,
    updateEvent,
    submitEvent,
    type OrganizerEvent,
    type CreateEventPayload,
    type EventStatus,
} from './api/events.api';
import { DashHeader, logout } from './DashboardLayout';
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

    const user = getStoredAuthUser();
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
        if (!user || user.role !== 'ORGANIZER') {
            window.location.href = '/auth/login';
            return;
        }

        if (!isEdit || !eventId) return;

        listOrganizerEvents(1, 100)
            .then((page) => {
                const found = page.items.find((e) => e.id === eventId);
                if (!found) {
                    window.location.href = '/organizer/events';
                    return;
                }
                setEventStatus(found.status);
                setForm(eventToForm(found));
            })
            .catch(() => {
                window.location.href = '/organizer/events';
            })
            .finally(() => setLoading(false));
    }, []);

    function set(field: keyof FormState) {
        return (
            e: React.ChangeEvent<
                HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
            >,
        ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
    }

    async function handleSave(e: FormEvent) {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            const payload = formToPayload(form);
            if (isEdit && eventId) {
                await updateEvent(eventId, payload);
            } else {
                await createEvent(payload);
            }
            window.location.href = '/organizer/events';
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

function isoToDateTimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
