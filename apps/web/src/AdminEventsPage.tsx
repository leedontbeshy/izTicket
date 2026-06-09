import { useState, useEffect } from 'react';
import { getStoredAuthUser } from './authSession';
import { listPendingEvents, type PendingEvent } from './api/admin.api';
import { MaterialIcon, PublicFooter, PublicHeader } from './PublicLayout';
import './AdminEventsPage.css';

export function AdminEventsPage() {
    const [events, setEvents] = useState<PendingEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const user = getStoredAuthUser();
    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        if (!isAdmin) {
            window.location.href = '/auth/login';
            return;
        }

        listPendingEvents()
            .then((page) => setEvents(page.items))
            .catch(() => setError('Không thể tải danh sách sự kiện.'))
            .finally(() => setLoading(false));
    }, [isAdmin]);

    return (
        <main className="admin-events-page">
            <PublicHeader active="events" />

            <section className="admin-events-shell">
                <div className="admin-events-heading">
                    <div>
                        <span className="admin-events-eyebrow">
                            <MaterialIcon>admin_panel_settings</MaterialIcon>
                            Admin xét duyệt
                        </span>
                        <h1>
                            Duyệt sự kiện
                        </h1>
                        <p>
                            Kiểm tra các sự kiện organizer vừa gửi trước khi xuất bản.
                        </p>
                    </div>
                    <div className="admin-events-count">
                        <span>Đang chờ</span>
                        <strong>{loading ? '--' : events.length}</strong>
                    </div>
                </div>

                <section className="admin-events-content">
                    <div className="admin-events-section-title">
                        <div>
                            <h2>
                                Hàng chờ duyệt
                            </h2>
                            <p>
                                {loading
                                    ? 'Đang tải dữ liệu...'
                                    : `${events.length} sự kiện cần xem xét`}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <StateMessage
                            icon="hourglass_top"
                            title="Đang tải sự kiện"
                            text="Danh sách chờ duyệt sẽ hiển thị ngay khi API phản hồi."
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
                        <StateMessage
                            icon="task_alt"
                            title="Không có sự kiện nào chờ duyệt"
                            text="Khi organizer gửi sự kiện mới, hồ sơ xét duyệt sẽ xuất hiện tại đây."
                        />
                    ) : null}

                    {!loading && events.length > 0 ? (
                        <div className="admin-event-grid">
                            {events.map((event) => (
                                <PendingEventCard key={event.id} event={event} />
                            ))}
                        </div>
                    ) : null}
                </section>
            </section>

            <PublicFooter />
        </main>
    );
}

function PendingEventCard({ event }: { event: PendingEvent }) {
    return (
        <article className="admin-event-card">
            <div className="admin-event-card-top">
                <span className="admin-status-badge">Chờ duyệt</span>
                <span className="admin-event-category">{event.category}</span>
            </div>

            <h3>{event.title}</h3>

            <div className="admin-event-meta">
                <span>
                    <MaterialIcon>person</MaterialIcon>
                    {event.organizer.name}
                </span>
                <span>
                    <MaterialIcon>calendar_month</MaterialIcon>
                    {formatDate(event.startsAt)}
                </span>
                <span>
                    <MaterialIcon>location_on</MaterialIcon>
                    {event.venue.city}
                </span>
                <span>
                    <MaterialIcon>schedule</MaterialIcon>
                    Nộp: {formatDate(event.submittedAt)}
                </span>
            </div>

            <div className="admin-event-card-foot">
                <span>{event.venue.name}</span>
                <a
                    className="admin-review-link"
                    href={`/admin/events/${event.id}/review`}
                >
                    Xem xét
                    <MaterialIcon>arrow_forward</MaterialIcon>
                </a>
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
        <section className="admin-events-state">
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
