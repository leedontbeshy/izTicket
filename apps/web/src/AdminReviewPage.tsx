import { useEffect, useState, type ReactNode } from 'react';
import { getStoredAuthUser } from './authSession';
import {
    approveEvent,
    getAdminEventDetail,
    rejectEvent,
    type AdminEventDetail,
} from './api/admin.api';
import { MaterialIcon, PublicFooter, PublicHeader } from './PublicLayout';
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
    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        if (!isAdmin) {
            window.location.href = '/auth/login';
            return;
        }

        getAdminEventDetail(eventId)
            .then(setEvent)
            .catch(() => setError('Không thể tải thông tin sự kiện.'))
            .finally(() => setLoading(false));
    }, [eventId, isAdmin]);

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
            <AdminReviewShell>
                <ReviewState
                    icon="hourglass_top"
                    title="Đang tải hồ sơ sự kiện"
                    text="Thông tin xét duyệt sẽ hiển thị ngay khi API phản hồi."
                />
            </AdminReviewShell>
        );
    }

    if (!event) {
        return (
            <AdminReviewShell>
                <ReviewState
                    icon="error"
                    title="Không thể tải hồ sơ"
                    text={error || 'Sự kiện không tồn tại.'}
                />
            </AdminReviewShell>
        );
    }

    const statusClass = `status-${event.status.toLowerCase().replace(/_/g, '-')}`;
    const isPending = event.status === 'PENDING_REVIEW';

    return (
        <main className="admin-review-page">
            <PublicHeader active="events" />

            <section className="admin-review-shell">
                <a className="admin-review-back-link" href="/admin/events">
                    <MaterialIcon>arrow_back</MaterialIcon>
                    Danh sách chờ duyệt
                </a>

                <section className="admin-review-hero">
                    <div className="admin-review-hero-copy">
                        <span className={`admin-review-status ${statusClass}`}>
                            {STATUS_LABEL[event.status] ?? event.status}
                        </span>
                        <h1>{event.title}</h1>
                        <p>
                            {event.organizer.name} gửi sự kiện thuộc danh mục {event.category}.
                            Kiểm tra thông tin trước khi đưa ra quyết định.
                        </p>
                        <div className="admin-review-hero-meta">
                            <span>
                                <MaterialIcon>calendar_month</MaterialIcon>
                                {formatDateTime(event.startsAt)}
                            </span>
                            <span>
                                <MaterialIcon>location_on</MaterialIcon>
                                {event.venue.city}
                            </span>
                            <span>
                                <MaterialIcon>confirmation_number</MaterialIcon>
                                {event.ticketTypes.length} loại vé
                            </span>
                        </div>
                    </div>

                    {event.thumbnailUrl ? (
                        <img
                            className="admin-review-cover"
                            src={event.thumbnailUrl}
                            alt={event.title}
                        />
                    ) : null}
                </section>

                <div className="admin-review-grid">
                    <div className="admin-review-main-col">
                        <section className="admin-review-card">
                            <h2>Thông tin sự kiện</h2>
                            <dl className="admin-review-dl">
                                <div>
                                    <dt>Ban tổ chức</dt>
                                    <dd>
                                        {event.organizer.name}
                                        <span>{event.organizer.email}</span>
                                    </dd>
                                </div>
                                <div>
                                    <dt>Danh mục</dt>
                                    <dd>{event.category}</dd>
                                </div>
                                <div>
                                    <dt>Thời gian</dt>
                                    <dd>
                                        {formatDateTime(event.startsAt)} - {formatDateTime(event.endsAt)}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Địa điểm</dt>
                                    <dd>
                                        {event.venue.name}, {event.venue.address},
                                        {event.venue.district ? ` ${event.venue.district},` : ''} {event.venue.city}
                                    </dd>
                                </div>
                            </dl>
                        </section>

                        <section className="admin-review-card">
                            <h2>Mô tả</h2>
                            <p className="admin-review-description">{event.description}</p>
                        </section>

                        {event.ticketTypes.length > 0 ? (
                            <section className="admin-review-card">
                                <h2>Loại vé ({event.ticketTypes.length})</h2>
                                <div className="admin-review-ticket-list">
                                    {event.ticketTypes.map((ticketType) => (
                                        <article
                                            className="admin-review-ticket-row"
                                            key={ticketType.id}
                                        >
                                            <div>
                                                <h3>{ticketType.name}</h3>
                                                <p>
                                                    {formatDate(ticketType.saleStartsAt)} - {formatDate(ticketType.saleEndsAt)}
                                                </p>
                                            </div>
                                            <strong>
                                                {ticketType.priceVnd === 0
                                                    ? 'Miễn phí'
                                                    : `${ticketType.priceVnd.toLocaleString('vi-VN')} đ`}
                                            </strong>
                                            <span>{ticketType.totalQuantity} vé</span>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        ) : null}
                    </div>

                    <aside className="admin-review-side-col">
                        {isPending ? (
                            <section className="admin-review-card admin-review-action-card">
                                <h2>Quyết định</h2>
                                <p>
                                    Duyệt nếu nội dung đã đầy đủ và phù hợp; từ chối kèm lý do để organizer chỉnh sửa.
                                </p>

                                {actionError ? (
                                    <div className="admin-review-error">
                                        <MaterialIcon>error</MaterialIcon>
                                        {actionError}
                                    </div>
                                ) : null}

                                <button
                                    className="admin-review-approve-button"
                                    type="button"
                                    onClick={handleApprove}
                                    disabled={acting}
                                >
                                    <MaterialIcon>check_circle</MaterialIcon>
                                    {acting && !showRejectForm ? 'Đang duyệt...' : 'Duyệt sự kiện'}
                                </button>

                                {!showRejectForm ? (
                                    <button
                                        className="admin-review-reject-button"
                                        type="button"
                                        onClick={() => setShowRejectForm(true)}
                                        disabled={acting}
                                    >
                                        <MaterialIcon>cancel</MaterialIcon>
                                        Từ chối
                                    </button>
                                ) : (
                                    <div className="admin-review-reject-form">
                                        <label htmlFor="ar-reason">
                                            Lý do từ chối *
                                        </label>
                                        <textarea
                                            id="ar-reason"
                                            className="admin-review-reason-input"
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder="Nêu rõ lý do để organizer có thể chỉnh sửa..."
                                            rows={4}
                                        />
                                        <div className="admin-review-reject-actions">
                                            <button
                                                className="admin-review-secondary-button"
                                                type="button"
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
                                                className="admin-review-reject-confirm-button"
                                                type="button"
                                                onClick={handleReject}
                                                disabled={acting || !rejectReason.trim()}
                                            >
                                                {acting ? 'Đang gửi...' : 'Xác nhận từ chối'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </section>
                        ) : null}

                        {event.reviews.length > 0 ? (
                            <section className="admin-review-card">
                                <h2>Lịch sử duyệt</h2>
                                <div className="admin-review-history">
                                    {event.reviews.map((review) => (
                                        <article className="admin-review-history-item" key={review.id}>
                                            <div>
                                                <span
                                                    className={`admin-review-decision ${
                                                        review.decision === 'APPROVED'
                                                            ? 'approved'
                                                            : 'rejected'
                                                    }`}
                                                >
                                                    {review.decision === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                                                </span>
                                                <time>{formatDate(review.createdAt)}</time>
                                            </div>
                                            <p>bởi {review.reviewer.name}</p>
                                            {review.reason ? <p>{review.reason}</p> : null}
                                        </article>
                                    ))}
                                </div>
                            </section>
                        ) : null}
                    </aside>
                </div>
            </section>

            <PublicFooter />
        </main>
    );
}

function AdminReviewShell({ children }: { children: ReactNode }) {
    return (
        <main className="admin-review-page">
            <PublicHeader active="events" />
            <section className="admin-review-shell">{children}</section>
            <PublicFooter />
        </main>
    );
}

function ReviewState({
    icon,
    text,
    title,
}: {
    icon: string;
    text: string;
    title: string;
}) {
    return (
        <section className="admin-review-state">
            <MaterialIcon>{icon}</MaterialIcon>
            <h1>{title}</h1>
            <p>{text}</p>
            <a href="/admin/events">
                <MaterialIcon>arrow_back</MaterialIcon>
                Danh sách chờ duyệt
            </a>
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

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
