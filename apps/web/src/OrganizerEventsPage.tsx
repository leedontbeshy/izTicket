import { useState, useEffect } from 'react';
import { getStoredAuthUser } from './authSession';
import { listOrganizerEvents, type OrganizerEvent } from './api/events.api';
import { DashHeader, logout } from './DashboardLayout';
import './OrganizerEventsPage.css';

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

    useEffect(() => {
        if (!user || user.role !== 'ORGANIZER') {
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
    }, []);

    return (
        <div className="dash-shell">
            <DashHeader
                userName={user?.name}
                activeNav="events"
                role="ORGANIZER"
                onLogout={logout}
            />

            <main className="dash-main">
                <div className="org-page-heading">
                    <div>
                        <h1>Sự kiện của tôi</h1>
                        <p className="org-page-sub">
                            Quản lý và theo dõi các sự kiện bạn tổ chức.
                        </p>
                    </div>
                    <a className="btn-primary" href="/organizer/events/new">
                        <span className="material-symbols-outlined">add</span>
                        Tạo sự kiện
                    </a>
                </div>

                {loading && (
                    <div className="dash-loading">Đang tải...</div>
                )}

                {error && <div className="dash-error">{error}</div>}

                {!loading && !error && events.length === 0 && (
                    <div className="dash-empty">
                        <span className="material-symbols-outlined dash-empty-icon">
                            event
                        </span>
                        <p>Bạn chưa có sự kiện nào.</p>
                        <a
                            className="btn-primary"
                            href="/organizer/events/new"
                        >
                            Tạo sự kiện đầu tiên
                        </a>
                    </div>
                )}

                {!loading && events.length > 0 && (
                    <div className="org-events-grid">
                        {events.map((event) => (
                            <OrgEventCard
                                key={event.id}
                                event={event}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function OrgEventCard({ event }: { event: OrganizerEvent }) {
    const canEdit =
        event.status === 'DRAFT' || event.status === 'REJECTED';
    const statusClass = `status-${event.status.toLowerCase().replace(/_/g, '-')}`;

    return (
        <div className="org-event-card">
            <div className="org-event-card-top">
                <span className={`status-badge ${statusClass}`}>
                    {STATUS_LABEL[event.status] ?? event.status}
                </span>
                <span className="org-event-category">{event.category}</span>
            </div>

            <h3 className="org-event-title">{event.title}</h3>

            <div className="org-event-meta">
                <span>
                    <span className="material-symbols-outlined">
                        calendar_month
                    </span>
                    {formatDate(event.startsAt)}
                </span>
                <span>
                    <span className="material-symbols-outlined">
                        location_on
                    </span>
                    {event.venue.city}
                </span>
            </div>

            <div className="org-event-card-foot">
                {canEdit && (
                    <a
                        className="btn-outline-sm"
                        href={`/organizer/events/${event.id}/edit`}
                    >
                        Chỉnh sửa
                    </a>
                )}
                <a
                    className="btn-ghost-sm"
                    href={`/organizer/events/${event.id}`}
                >
                    {canEdit ? 'Quản lý vé' : 'Xem chi tiết'}
                </a>
            </div>
        </div>
    );
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}
