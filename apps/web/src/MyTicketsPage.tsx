import { useEffect, useMemo, useState } from 'react';
import {
    MaterialIcon,
    PublicFooter,
    PublicHeader,
} from './PublicLayout';
import { getStoredAuthUser } from './authSession';
import {
    listMyTickets,
    type CustomerTicket,
} from './api/tickets.api';
import './MyTicketsPage.css';

export function MyTicketsPage() {
    const user = useMemo(() => getStoredAuthUser(), []);
    const [tickets, setTickets] = useState<CustomerTicket[]>([]);
    const [loading, setLoading] = useState(Boolean(user));
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;

        let active = true;
        setLoading(true);
        setError('');

        listMyTickets()
            .then((response) => {
                if (active) setTickets(response.items);
            })
            .catch((err: unknown) => {
                if (!active) return;
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Không thể tải vé của bạn.',
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [user]);

    return (
        <main className="my-tickets-page">
            <PublicHeader active="events" />

            <section className="my-tickets-hero">
                <a href="/events">
                    <MaterialIcon>arrow_back</MaterialIcon>
                    Quay lại sự kiện
                </a>
                <h1>Vé của tôi</h1>
                <p>Theo dõi các vé đã được phát hành sau khi thanh toán thành công.</p>
            </section>

            {!user ? (
                <TicketsState
                    icon="lock"
                    title="Bạn cần đăng nhập"
                    text="Đăng nhập bằng tài khoản customer để xem vé đã mua."
                    actionHref="/auth/login"
                    actionLabel="Đăng nhập"
                />
            ) : loading ? (
                <TicketsState
                    icon="hourglass_top"
                    title="Đang tải vé"
                    text="Danh sách vé sẽ hiển thị ngay khi API phản hồi."
                />
            ) : error ? (
                <TicketsState
                    icon="error"
                    title="Không thể tải vé"
                    text={error}
                />
            ) : tickets.length === 0 ? (
                <TicketsState
                    icon="confirmation_number"
                    title="Chưa có vé"
                    text="Vé sẽ xuất hiện tại đây sau khi payment webhook xác nhận thanh toán."
                    actionHref="/events"
                    actionLabel="Tìm sự kiện"
                />
            ) : (
                <section className="my-tickets-grid">
                    {tickets.map((ticket) => (
                        <TicketCard ticket={ticket} key={ticket.id} />
                    ))}
                </section>
            )}

            <PublicFooter />
        </main>
    );
}

function TicketCard({ ticket }: { ticket: CustomerTicket }) {
    return (
        <article className="my-ticket-card">
            <div className="ticket-stub">
                <span>
                    <MaterialIcon>confirmation_number</MaterialIcon>
                </span>
                <StatusPill status={ticket.status} />
            </div>
            <div className="ticket-card-body">
                <div>
                    <h2>{ticket.eventTitle}</h2>
                    <p>{ticket.ticketTypeName}</p>
                </div>
                <div className="ticket-card-meta">
                    <span>Phát hành</span>
                    <strong>{formatDateTime(ticket.issuedAt)}</strong>
                </div>
                <div className="ticket-code-preview">
                    <span>QR payload</span>
                    <strong>{ticket.qrPayload}</strong>
                </div>
                <a href={`/my-tickets/${ticket.id}`}>
                    Xem vé
                    <MaterialIcon>arrow_forward</MaterialIcon>
                </a>
            </div>
        </article>
    );
}

function TicketsState({
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

function StatusPill({ status }: { status: CustomerTicket['status'] }) {
    return <span className={`ticket-status ${status.toLowerCase()}`}>{status}</span>;
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}
