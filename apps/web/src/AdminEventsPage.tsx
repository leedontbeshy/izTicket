import { useState, useEffect } from 'react';
import { getStoredAuthUser } from './authSession';
import { listPendingEvents, type PendingEvent } from './api/admin.api';
import { DashHeader, logout } from './DashboardLayout';

export function AdminEventsPage() {
    const [events, setEvents] = useState<PendingEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const user = getStoredAuthUser();

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') {
            window.location.href = '/auth/login';
            return;
        }

        listPendingEvents()
            .then((page) => setEvents(page.items))
            .catch(() => setError('Không thể tải danh sách sự kiện.'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="dash-shell">
            <DashHeader
                userName={user?.name}
                activeNav="events"
                role="ADMIN"
                onLogout={logout}
            />

            <main className="dash-main">
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#09090b', margin: '0 0 6px' }}>
                        Duyệt sự kiện
                    </h1>
                    <p style={{ fontSize: 14, color: '#71717a', margin: 0 }}>
                        Các sự kiện đang chờ phê duyệt.
                    </p>
                </div>

                {loading && <div className="dash-loading">Đang tải...</div>}
                {error && <div className="dash-error">{error}</div>}

                {!loading && !error && events.length === 0 && (
                    <div className="dash-empty">
                        <span className="material-symbols-outlined dash-empty-icon">
                            pending_actions
                        </span>
                        <p>Không có sự kiện nào chờ duyệt.</p>
                    </div>
                )}

                {!loading && events.length > 0 && (
                    <div className="org-events-grid">
                        {events.map((event) => (
                            <PendingEventCard key={event.id} event={event} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

function PendingEventCard({ event }: { event: PendingEvent }) {
    return (
        <div className="org-event-card">
            <div className="org-event-card-top">
                <span className="status-badge status-pending-review">Chờ duyệt</span>
                <span className="org-event-category">{event.category}</span>
            </div>

            <h3 className="org-event-title">{event.title}</h3>

            <div className="org-event-meta">
                <span>
                    <span className="material-symbols-outlined">person</span>
                    {event.organizer.name}
                </span>
                <span>
                    <span className="material-symbols-outlined">calendar_month</span>
                    {formatDate(event.startsAt)}
                </span>
                <span>
                    <span className="material-symbols-outlined">location_on</span>
                    {event.venue.city}
                </span>
                <span>
                    <span className="material-symbols-outlined">schedule</span>
                    Nộp: {formatDate(event.submittedAt)}
                </span>
            </div>

            <div className="org-event-card-foot">
                <a
                    className="btn-primary"
                    href={`/admin/events/${event.id}/review`}
                >
                    Xem xét
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
