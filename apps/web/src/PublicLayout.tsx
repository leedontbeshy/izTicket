import {
    getRoleLabel,
    getStoredAuthUser,
    type StoredAuthUser,
} from './authSession';
import { getActiveCheckoutSession } from './checkoutSession';
import { logout } from './dashboardLogout';

type PublicHeaderProps = {
    active: 'home' | 'events';
};

const footerGroups = [
    {
        title: 'Về izTicket',
        links: ['Giới thiệu', 'Tin tức', 'Tuyển dụng', 'Liên hệ'],
    },
    {
        title: 'Dành cho khách hàng',
        links: ['Hướng dẫn mua vé', 'Chính sách bảo mật', 'Điều khoản sử dụng', 'Câu hỏi thường gặp'],
    },
    {
        title: 'Dành cho tổ chức',
        links: ['Tạo sự kiện', 'Bảng giá', 'Tính năng', 'Tài liệu hướng dẫn'],
    },
];

export function MaterialIcon({
    children,
    className = '',
}: {
    children: string;
    className?: string;
}) {
    return (
        <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>
            {children}
        </span>
    );
}

export function BrandMark() {
    return (
        <span className="brand-mark" aria-hidden="true">
            <MaterialIcon>confirmation_number</MaterialIcon>
        </span>
    );
}

export function PublicHeader({ active }: PublicHeaderProps) {
    const user = getStoredAuthUser();
    const dashboardHref = user ? getDashboardHref(user.role) : null;
    const activeCheckout =
        user?.role === 'CUSTOMER' ? getActiveCheckoutSession() : null;

    return (
        <header className="site-header">
            <a className="brand" href="/">
                <BrandMark />
                <span>izTicket</span>
            </a>

            <nav className="main-nav" aria-label="Điều hướng chính">
                <a className={active === 'home' ? 'active' : ''} href="/">
                    Trang chủ
                </a>
                <a className={active === 'events' ? 'active' : ''} href="/events">
                    Sự kiện
                </a>
                <a href="/#organizers">Dành cho tổ chức</a>
                <a href="/#about">Giới thiệu</a>
                <a href="/#support">Hỗ trợ</a>
            </nav>

            <div className="header-actions">
                <button className="language-button" type="button">
                    <MaterialIcon>language</MaterialIcon>
                    VI
                    <MaterialIcon>expand_more</MaterialIcon>
                </button>
                {user ? (
                    <>
                        {dashboardHref ? (
                            <a className="dark-button" href={dashboardHref}>
                                Dashboard
                            </a>
                        ) : null}
                        {activeCheckout ? (
                            <a
                                className="header-icon-link"
                                href="/checkout"
                            >
                                <MaterialIcon>shopping_cart</MaterialIcon>
                                Vé đang giữ
                            </a>
                        ) : null}
                        <UserAccountMenu user={user} />
                    </>
                ) : (
                    <a className="dark-button" href="/auth/login">
                        Đăng nhập
                    </a>
                )}
            </div>
        </header>
    );
}

function getDashboardHref(role: StoredAuthUser['role']) {
    if (role === 'ORGANIZER') return '/organizer/events';
    if (role === 'ADMIN') return '/admin/events';
    return null;
}

function UserAccountMenu({ user }: { user: StoredAuthUser }) {
    return (
        <details className="user-menu">
            <summary className="user-chip" aria-label="Mở menu tài khoản">
                <span>{getInitials(user.name)}</span>
                <div>
                    <strong>{user.name}</strong>
                    <small>{getRoleLabel(user.role)}</small>
                </div>
                <MaterialIcon className="user-menu-chevron">expand_more</MaterialIcon>
            </summary>
            <div className="user-menu-panel">
                {user.role === 'CUSTOMER' ? (
                    <a href="/my-tickets">
                        <MaterialIcon>confirmation_number</MaterialIcon>
                        Vé của tôi
                    </a>
                ) : null}
                <button type="button" onClick={logout}>
                    <MaterialIcon>logout</MaterialIcon>
                    Đăng xuất
                </button>
            </div>
        </details>
    );
}

export function PublicFooter() {
    return (
        <footer className="site-footer public-footer">
            <div className="footer-brand">
                <a className="brand" href="/">
                    <BrandMark />
                    <span>izTicket</span>
                </a>
                <p>
                    Nền tảng vé sự kiện thông minh.
                    <br />
                    Kết nối bạn với những trải nghiệm đáng nhớ.
                </p>
                <div className="social-links" aria-label="Mạng xã hội">
                    {['facebook', 'photo_camera', 'music_note', 'smart_display'].map((icon) => (
                        <a href="#" key={icon}>
                            <MaterialIcon>{icon}</MaterialIcon>
                        </a>
                    ))}
                </div>
            </div>

            {footerGroups.map((group) => (
                <nav className="footer-column" key={group.title} aria-label={group.title}>
                    <h2>{group.title}</h2>
                    {group.links.map((link) => (
                        <a href="#" key={link}>
                            {link}
                        </a>
                    ))}
                </nav>
            ))}

            <div className="footer-column contact-column" id="support">
                <h2>Liên hệ</h2>
                <span>
                    <MaterialIcon>mail</MaterialIcon>
                    support@izticket.vn
                </span>
                <span>
                    <MaterialIcon>call</MaterialIcon>
                    1900 1234
                </span>
                <span>
                    <MaterialIcon>location_on</MaterialIcon>
                    S9C Nguyễn Đình Chiểu, P. Võ Thị Sáu, Q.3, TP.HCM
                </span>
            </div>

            <div className="footer-bottom">
                <span>© 2026 izTicket. All rights reserved.</span>
                <button className="footer-language" type="button">
                    VI
                    <MaterialIcon>expand_more</MaterialIcon>
                </button>
            </div>
        </footer>
    );
}

function getInitials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(-2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}
