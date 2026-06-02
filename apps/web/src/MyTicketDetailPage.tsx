import { useEffect, useMemo, useState } from 'react';
import {
    MaterialIcon,
    PublicFooter,
    PublicHeader,
} from './PublicLayout';
import { getStoredAuthUser } from './authSession';
import {
    getTicket,
    type TicketDetail,
} from './api/tickets.api';
import './MyTicketsPage.css';

export function MyTicketDetailPage({ ticketId }: { ticketId: string }) {
    const user = useMemo(() => getStoredAuthUser(), []);
    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState(Boolean(user));
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;

        let active = true;
        setLoading(true);
        setError('');

        getTicket(ticketId)
            .then((ticketDetail) => {
                if (active) setTicket(ticketDetail);
            })
            .catch((err: unknown) => {
                if (!active) return;
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Không thể tải chi tiết vé.',
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [ticketId, user]);

    return (
        <main className="my-tickets-page">
            <PublicHeader active="events" />

            <section className="my-tickets-hero">
                <a href="/my-tickets">
                    <MaterialIcon>arrow_back</MaterialIcon>
                    Vé của tôi
                </a>
                <h1>Chi tiết vé</h1>
                <p>Thông tin vé điện tử dùng để đối chiếu khi tham dự sự kiện.</p>
            </section>

            {!user ? (
                <TicketDetailState
                    icon="lock"
                    title="Bạn cần đăng nhập"
                    text="Đăng nhập bằng tài khoản customer để xem vé đã mua."
                    actionHref="/auth/login"
                    actionLabel="Đăng nhập"
                />
            ) : loading ? (
                <TicketDetailState
                    icon="hourglass_top"
                    title="Đang tải vé"
                    text="Chi tiết vé sẽ hiển thị ngay khi API phản hồi."
                />
            ) : error || !ticket ? (
                <TicketDetailState
                    icon="error"
                    title="Không thể tải vé"
                    text={error || 'Vé không tồn tại hoặc bạn không có quyền xem vé này.'}
                />
            ) : (
                <section className="ticket-detail-layout">
                    <article className="ticket-detail-card">
                        <header>
                            <div>
                                <h2>{ticket.eventTitle}</h2>
                                <p>{ticket.ticketTypeName}</p>
                            </div>
                            <span className={`ticket-status ${ticket.status.toLowerCase()}`}>
                                {ticket.status}
                            </span>
                        </header>

                        <div className="ticket-qr-box">
                            <MaterialIcon>qr_code_2</MaterialIcon>
                            <strong>{ticket.qrPayload}</strong>
                        </div>

                        <div className="ticket-detail-grid">
                            <DetailLine label="Mã vé" value={ticket.ticketCode} />
                            <DetailLine label="Order" value={ticket.orderId} />
                            <DetailLine label="Phát hành" value={formatDateTime(ticket.issuedAt)} />
                            <DetailLine label="Bắt đầu" value={formatDateTime(ticket.eventStartsAt)} />
                            <DetailLine label="Kết thúc" value={formatDateTime(ticket.eventEndsAt)} />
                            <DetailLine
                                label="Địa điểm"
                                value={`${ticket.venue.name}, ${ticket.venue.address}, ${ticket.venue.city}`}
                            />
                        </div>
                    </article>
                </section>
            )}

            <PublicFooter />
        </main>
    );
}

function DetailLine({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

function TicketDetailState({
    actionHref,
    actionLabel,
    icon,
    text,
    title,
}: {
    actionHref?: string;
    actionLabel?: string;
    icon: string;
    text: string;
    title: string;
}) {
    return (
        <section className="my-tickets-state">
            <span>
                <MaterialIcon>{icon}</MaterialIcon>
            </span>
            <h2>{title}</h2>
            <p>{text}</p>
            {actionHref && actionLabel ? (
                <a href={actionHref}>
                    {actionLabel}
                    <MaterialIcon>arrow_forward</MaterialIcon>
                </a>
            ) : null}
        </section>
    );
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}
