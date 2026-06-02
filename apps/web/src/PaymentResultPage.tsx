import { useEffect, useMemo, useState } from 'react';
import {
    MaterialIcon,
    PublicFooter,
    PublicHeader,
} from './PublicLayout';
import {
    getPayment,
    type PaymentStatus,
    type SepayPayment,
} from './api/payments.api';
import {
    clearCheckoutSession,
    getActiveCheckoutSession,
} from './checkoutSession';
import './PaymentResultPage.css';

type ResultView = {
    icon: string;
    tone: 'pending' | 'success' | 'failed' | 'review';
    title: string;
    text: string;
};

export function PaymentResultPage() {
    const params = useMemo(
        () => new URLSearchParams(window.location.search),
        [],
    );
    const paymentId = params.get('paymentId') ?? '';
    const orderId = params.get('orderId') ?? '';
    const statusParam = params.get('status') as PaymentStatus | null;
    const [payment, setPayment] = useState<SepayPayment | null>(null);
    const [loading, setLoading] = useState(Boolean(paymentId));
    const [error, setError] = useState('');

    useEffect(() => {
        if (!paymentId) return;

        let active = true;
        setLoading(true);
        setError('');

        getPayment(paymentId)
            .then((paymentDetail) => {
                if (active) setPayment(paymentDetail);
            })
            .catch((err: unknown) => {
                if (!active) return;
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Không thể tải trạng thái thanh toán.',
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [paymentId]);

    const currentStatus = payment?.status ?? statusParam;
    const activeCheckout = getActiveCheckoutSession();

    useEffect(() => {
        if (currentStatus === 'SUCCEEDED') {
            clearCheckoutSession();
        }
    }, [currentStatus]);

    const view = getResultView(currentStatus);
    const displayOrderId = payment?.orderId ?? orderId;
    const isSuccess = currentStatus === 'SUCCEEDED';

    return (
        <main className="payment-result-page">
            <PublicHeader active="events" />

            <section className={`payment-result-card ${view.tone}`}>
                <span className="payment-result-icon">
                    <MaterialIcon>{loading ? 'hourglass_top' : view.icon}</MaterialIcon>
                </span>
                <div className="payment-result-copy">
                    <p className="payment-result-kicker">Kết quả thanh toán</p>
                    <h1>{loading ? 'Đang kiểm tra thanh toán' : view.title}</h1>
                    <p>{loading ? 'Hệ thống đang tải trạng thái mới nhất của giao dịch.' : view.text}</p>
                </div>

                {error ? (
                    <p className="payment-result-error">
                        <MaterialIcon>error</MaterialIcon>
                        {error}
                    </p>
                ) : null}

                <div className="payment-result-meta">
                    <PaymentMeta label="Payment" value={payment?.paymentId ?? (paymentId || 'Đang cập nhật')} />
                    <PaymentMeta label="Order" value={displayOrderId || 'Đang cập nhật'} />
                    <PaymentMeta label="Trạng thái" value={currentStatus ?? 'Đang chờ webhook'} />
                </div>

                <div className="payment-result-actions">
                    {isSuccess ? (
                        <a className="primary" href="/my-tickets">
                            <MaterialIcon>confirmation_number</MaterialIcon>
                            Xem vé của tôi
                        </a>
                    ) : paymentId ? (
                        <button
                            className="primary"
                            type="button"
                            onClick={() => window.location.reload()}
                        >
                            <MaterialIcon>refresh</MaterialIcon>
                            Kiểm tra lại
                        </button>
                    ) : null}
                    {!isSuccess && activeCheckout ? (
                        <a href={`/checkout/${activeCheckout.reservationId}`}>
                            <MaterialIcon>shopping_cart</MaterialIcon>
                            Quay lại checkout
                        </a>
                    ) : null}
                    {!isSuccess ? (
                        <a href="/my-tickets">
                            <MaterialIcon>confirmation_number</MaterialIcon>
                            Vé của tôi
                        </a>
                    ) : null}
                    <a href="/events">
                        <MaterialIcon>event</MaterialIcon>
                        Xem sự kiện
                    </a>
                </div>
            </section>

            <PublicFooter />
        </main>
    );
}

function PaymentMeta({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

function getResultView(status: PaymentStatus | null): ResultView {
    if (status === 'SUCCEEDED') {
        return {
            icon: 'task_alt',
            tone: 'success',
            title: 'Thanh toán thành công',
            text: 'Thanh toán đã được xác nhận. Vé sẽ sẵn sàng sau khi hệ thống phát hành ticket.',
        };
    }

    if (status === 'FAILED') {
        return {
            icon: 'cancel',
            tone: 'failed',
            title: 'Thanh toán thất bại',
            text: 'Giao dịch chưa hoàn tất. Bạn có thể quay lại checkout nếu reservation còn hiệu lực.',
        };
    }

    if (status === 'REQUIRES_REVIEW') {
        return {
            icon: 'manage_search',
            tone: 'review',
            title: 'Thanh toán cần đối soát',
            text: 'Hệ thống đã nhận tín hiệu thanh toán nhưng cần kiểm tra thêm trước khi phát hành vé.',
        };
    }

    return {
        icon: 'pending_actions',
        tone: 'pending',
        title: 'Đang chờ xác nhận thanh toán',
        text: 'Nếu bạn đã chuyển khoản, vui lòng chờ webhook SePay cập nhật kết quả trong ít phút.',
    };
}
