import { useEffect, useState } from 'react';
import { getStoredAuthUser } from '../auth/authSession';
import { listOrganizerEvents, type OrganizerEvent } from '../../api/events.api';
import { MaterialIcon, PublicFooter, PublicHeader } from '../../shared/PublicLayout';
import './OrganizerEventsPage.css';

const fallbackImage =
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=720&q=80';

const STATUS_LABEL: Record<string, string> = {
    DRAFT: 'Bản nháp',
    PENDING_REVIEW: 'Chờ duyệt',
    PUBLISHED: 'Đã xuất bản',
    REJECTED: 'Bị từ chối',
    CANCELLED: 'Đã hủy',
};

export function OrganizerEventsPage() {
    const [events, setEvents] = useState<OrganizerEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const user = getStoredAuthUser();
    const isOrganizer = user?.role === 'ORGANIZER';

    useEffect(() => {
        if (!isOrganizer) {
            window.location.href = '/auth/login';
            return;
        }

        listOrganizerEvents()
            .then((page) => setEvents(page.items))
            .catch((err: unknown) =>
                setError(
                    err instanceof Error ? err.message : 'Đã xảy ra lỗi.',
                ),
            )
            .finally(() => setLoading(false));
    }, [isOrganizer]);

    const publishedCount = events.filter(
        (event) => event.status === 'PUBLISHED',
    ).length;
    const draftCount = events.filter(
        (event) => event.status === 'DRAFT' || event.status === 'REJECTED',
    ).length;
    const pendingCount = events.filter(
        (event) => event.status === 'PENDING_REVIEW',
    ).length;

    return (
        <main className="organizer-events-page">
            <PublicHeader active="events" />

            <section className="organizer-events-hero">
                <div>
                    <span className="organizer-eyebrow">
                        <MaterialIcon>dashboard</MaterialIcon>
                        Organizer dashboard
                    </span>
                    <h1>Sự kiện của tôi</h1>
                    <p>
                        Quản lý bản nháp, theo dõi trạng thái duyệt và mở trang
                        chi tiết để cấu hình loại vé.
                    </p>
                </div>
                <a className="organizer-create-button" href="/organizer/events/new">
                    <MaterialIcon>add</MaterialIcon>
                    Tạo sự kiện
                </a>
            </section>

            <section className="organizer-stats" aria-label="Tổng quan sự kiện">
                <StatCard icon="event" label="Tổng sự kiện" value={events.length} />
                <StatCard icon="published_with_changes" label="Đã xuất bản" value={publishedCount} />
                <StatCard icon="edit_calendar" label="Cần chỉnh sửa" value={draftCount} />
                <StatCard icon="rate_review" label="Chờ duyệt" value={pendingCount} />
            </section>

            <section className="organizer-events-content">
                <div className="organizer-section-title">
                    <div>
                        <h2>Danh sách sự kiện</h2>
                        <p>
                            {loading
                                ? 'Đang tải dữ liệu...'
                                : `${events.length} sự kiện`}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <StateMessage
                        icon="hourglass_top"
                        title="Đang tải sự kiện"
                        text="Danh sách sẽ hiển thị ngay khi API phản hồi."
                    />
                ) : null}

                {error ? (
                    <StateMessage
                        icon="error"
                        title="Không thể tải sự kiện"
                        text={error}
                    />
                ) : null}

                {!loading && !error && events.length === 0 ? (
                    <section className="organizer-empty">
                        <MaterialIcon>event</MaterialIcon>
                        <h2>Bạn chưa có sự kiện nào</h2>
                        <p>
                            Tạo bản nháp đầu tiên, sau đó thêm loại vé và gửi xét
                            duyệt.
                        </p>
                        <a className="organizer-create-button" href="/organizer/events/new">
                            <MaterialIcon>add</MaterialIcon>
                            Tạo sự kiện đầu tiên
                        </a>
                    </section>
                ) : null}

                {!loading && events.length > 0 ? (
                    <div className="organizer-event-grid">
                        {events.map((event) => (
                            <OrgEventCard key={event.id} event={event} />
                        ))}
                    </div>
                ) : null}
            </section>

            <PublicFooter />
        </main>
    );
}

function StatCard({
    icon,
    label,
    value,
}: {
    icon: string;
    label: string;
    value: number;
}) {
    return (
        <article>
            <span>
                <MaterialIcon>{icon}</MaterialIcon>
            </span>
            <div>
                <strong>{value}</strong>
                <p>{label}</p>
            </div>
        </article>
    );
}

function OrgEventCard({ event }: { event: OrganizerEvent }) {
    const canEdit =
        event.status === 'DRAFT' || event.status === 'REJECTED';
    const statusClass = `status-${event.status.toLowerCase().replace(/_/g, '-')}`;

    return (
        <article className="organizer-event-card">
            <div className="organizer-event-image">
                <img src={event.thumbnailUrl ?? fallbackImage} alt={event.title} />
                <span className={`organizer-status ${statusClass}`}>
                    {STATUS_LABEL[event.status] ?? event.status}
                </span>
            </div>

            <div className="organizer-event-body">
                <span className="organizer-event-category">{event.category}</span>
                <h3>{event.title}</h3>

                <div className="organizer-event-meta">
                    <span>
                        <MaterialIcon>calendar_month</MaterialIcon>
                        {formatDate(event.startsAt)}
                    </span>
                    <span>
                        <MaterialIcon>location_on</MaterialIcon>
                        {event.venue.name}, {event.venue.city}
                    </span>
                </div>

                <div className="organizer-event-actions">
                    {canEdit ? (
                        <a
                            className="organizer-secondary-action"
                            href={`/organizer/events/${event.id}/edit`}
                        >
                            Chỉnh sửa
                        </a>
                    ) : null}
                    <a
                        className="organizer-primary-action"
                        href={`/organizer/events/${event.id}`}
                    >
                        {canEdit ? 'Quản lý vé' : 'Xem chi tiết'}
                        <MaterialIcon>arrow_forward</MaterialIcon>
                    </a>
                </div>
            </div>
        </article>
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
        <section className="organizer-state">
            <MaterialIcon>{icon}</MaterialIcon>
            <h2>{title}</h2>
            <p>{text}</p>
        </section>
    );
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}
