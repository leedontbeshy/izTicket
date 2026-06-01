import {
    MaterialIcon,
    PublicFooter,
    PublicHeader,
} from './PublicLayout';
import './CheckoutPage.css';

export function CheckoutPage({ reservationId }: { reservationId: string }) {
    return (
        <main className="checkout-page">
            <PublicHeader active="events" />

            <section className="checkout-placeholder">
                <span>
                    <MaterialIcon>task_alt</MaterialIcon>
                </span>
                <h1>Đã giữ vé thành công</h1>
                <p>
                    Reservation <strong>{reservationId}</strong> đã được tạo. Bước
                    checkout chi tiết sẽ hiển thị countdown và tạo order ở phần tiếp theo.
                </p>
                <a href="/events">
                    <MaterialIcon>arrow_back</MaterialIcon>
                    Quay lại sự kiện
                </a>
            </section>

            <PublicFooter />
        </main>
    );
}
