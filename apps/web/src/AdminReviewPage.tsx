import { useState, useEffect } from 'react';
import { getStoredAuthUser } from './authSession';
import {
    getAdminEventDetail,
    approveEvent,
    rejectEvent,
    type AdminEventDetail,
} from './api/admin.api';
import { DashHeader } from './DashboardLayout';
import { logout } from './dashboardLogout';
import './AdminReviewPage.css';

type Props = { eventId: string };

const STATUS_LABEL: Record<string, string> = {
    DRAFT: 'Bản nháp',
    PENDING_REVIEW: 'Chờ duyệt',
    PUBLISHED: 'Đã xuất bản',
    REJECTED: 'Bị từ chối',
    CANCELLED: 'Đã hủy',
};

export function AdminReviewPage({ eventId }: Props) {
    const [event, setEvent] = useState<AdminEventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [acting, setActing] = useState(false);
    const [actionError, setActionError] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const user = getStoredAuthUser();

    useEffect(() => {
        if (!user || user.role !== 'ADMIN') {
            window.location.href = '/auth/login';
            return;
        }

        getAdminEventDetail(eventId)
            .then(setEvent)
            .catch(() => setError('Không thể tải thông tin sự kiện.'))
            .finally(() => setLoading(false));
    }, []);

    async function handleApprove() {
        setActionError('');
        setActing(true);
        try {
            await approveEvent(eventId);
            window.location.href = '/admin/events';
        } catch (err) {
            setActionError(err instanceof Error ? err.message : 'Đã xảy ra lỗi.');
            setActing(false);
        }
    }

    async function handleReject() {
        if (!rejectReason.trim()) {
            setActionError('Vui lòng nhập lý do từ chối.');
            return;
        }
        setActionError('');
        setActing(true);
        try {
            await rejectEvent(eventId, rejectReason.trim());
            window.location.href = '/admin/events';
        } catch (err) {
            setActionError(err instanceof Error ? err.message : 'Đã xảy ra lỗi.');
            setActing(false);
        }
    }

    if (loading) {
        return (
            <div className="dash-shell">
                <DashHeader userName={user?.name} activeNav="events" role="ADMIN" onLogout={logout} />
                <main className="dash-main">
                    <div className="dash-loading">Đang tải...</div>
                </main>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="dash-shell">
                <DashHeader userName={user?.name} activeNav="events" role="ADMIN" onLogout={logout} />
                <main className="dash-main">
                    <div className="dash-error">{error || 'Sự kiện không tồn tại.'}</div>
                </main>
            </div>
        );
    }

    const statusClass = `status-${event.status.toLowerCase().replace(/_/g, '-')}`;
    const isPending = event.status === 'PENDING_REVIEW';

    return (
        <div className="dash-shell">
            <DashHeader userName={user?.name} activeNav="events" role="ADMIN" onLogout={logout} />

            <main className="dash-main">
                <a className="ef-back-link" href="/admin/events">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Danh sách chờ duyệt
                </a>

                <div className="ar-event-header">
                    <div className="ar-title-group">
                        <h1>{event.title}</h1>
                        <span className={`status-badge ${statusClass}`}>
                            {STATUS_LABEL[event.status] ?? event.status}
                        </span>
                    </div>
                </div>

                <div className="ar-grid">
                    <div className="ar-main-col">
                        <section className="ar-card">
                            <h2>Thông tin sự kiện</h2>
                            <dl className="ar-dl">
                                <div>
                                    <dt>Ban tổ chức</dt>
                                    <dd>{event.organizer.name} <span className="ar-muted">({event.organizer.email})</span></dd>
                                </div>
                                <div>
                                    <dt>Danh mục</dt>
                                    <dd>{event.category}</dd>
                                </div>
                                <div>
                                    <dt>Thời gian</dt>
                                    <dd>{formatDateTime(event.startsAt)} – {formatDateTime(event.endsAt)}</dd>
                                </div>
                                <div>
                                    <dt>Địa điểm</dt>
                                    <dd>
                                        {event.venue.name}, {event.venue.address},
                                        {event.venue.district ? ` ${event.venue.district},` : ''} {event.venue.city}
                                    </dd>
                                </div>
                                {event.thumbnailUrl && (
                                    <div>
                                        <dt>Ảnh bìa</dt>
                                        <dd>
                                            <img
                                                className="ar-thumbnail"
                                                src={event.thumbnailUrl}
                                                alt={event.title}
                                            />
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </section>

                        <section className="ar-card">
                            <h2>Mô tả</h2>
                            <p className="ar-description">{event.description}</p>
                        </section>

                        {event.ticketTypes.length > 0 && (
                            <section className="ar-card">
                                <h2>Loại vé ({event.ticketTypes.length})</h2>
                                <div className="ar-ticket-list">
                                    {event.ticketTypes.map((tt) => (
                                        <div key={tt.id} className="ar-ticket-row">
                                            <span className="ar-ticket-name">{tt.name}</span>
                                            <span className="ar-ticket-price">
                                                {tt.priceVnd === 0
                                                    ? 'Miễn phí'
                                                    : tt.priceVnd.toLocaleString('vi-VN') + ' đ'}
                                            </span>
                                            <span className="ar-muted">
                                                {tt.totalQuantity} vé · {formatDate(tt.saleStartsAt)} – {formatDate(tt.saleEndsAt)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="ar-side-col">
                        {isPending && (
                            <section className="ar-card ar-action-card">
                                <h2>Quyết định</h2>

                                {actionError && (
                                    <div className="dash-error" style={{ marginBottom: 12 }}>
                                        {actionError}
                                    </div>
                                )}

                                <button
                                    className="ar-approve-btn"
                                    type="button"
                                    onClick={handleApprove}
                                    disabled={acting}
                                >
                                    <span className="material-symbols-outlined">check_circle</span>
                                    {acting && !showRejectForm ? 'Đang duyệt...' : 'Duyệt sự kiện'}
                                </button>

                                {!showRejectForm ? (
                                    <button
                                        className="ar-reject-btn"
                                        type="button"
                                        onClick={() => setShowRejectForm(true)}
                                        disabled={acting}
                                    >
                                        <span className="material-symbols-outlined">cancel</span>
                                        Từ chối
                                    </button>
                                ) : (
                                    <div className="ar-reject-form">
                                        <label htmlFor="ar-reason" style={{ fontSize: 13, fontWeight: 500, color: '#3f3f46' }}>
                                            Lý do từ chối *
                                        </label>
                                        <textarea
                                            id="ar-reason"
                                            className="ar-reason-input"
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder="Nêu rõ lý do để organizer có thể chỉnh sửa..."
                                            rows={4}
                                        />
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button
                                                type="button"
                                                className="btn-outline"
                                                onClick={() => {
                                                    setShowRejectForm(false);
                                                    setRejectReason('');
                                                    setActionError('');
                                                }}
                                                disabled={acting}
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="button"
                                                className="ar-reject-confirm-btn"
                                                onClick={handleReject}
                                                disabled={acting || !rejectReason.trim()}
                                            >
                                                {acting ? 'Đang gửi...' : 'Xác nhận từ chối'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        {event.reviews.length > 0 && (
                            <section className="ar-card">
                                <h2>Lịch sử duyệt</h2>
                                <div className="ar-review-list">
                                    {event.reviews.map((review) => (
                                        <div key={review.id} className="ar-review-item">
                                            <div className="ar-review-header">
                                                <span
                                                    className={`ar-decision ${review.decision === 'APPROVED' ? 'ar-approved' : 'ar-rejected'}`}
                                                >
                                                    {review.decision === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                                                </span>
                                                <span className="ar-muted">{formatDate(review.createdAt)}</span>
                                            </div>
                                            <span className="ar-muted" style={{ fontSize: 12 }}>
                                                bởi {review.reviewer.name}
                                            </span>
                                            {review.reason && (
                                                <p className="ar-review-reason">{review.reason}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </main>
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

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
