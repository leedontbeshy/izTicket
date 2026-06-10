import './dashboard.css';

type DashHeaderProps = {
    userName?: string;
    activeNav?: 'events';
    role?: 'ORGANIZER' | 'ADMIN';
    onLogout: () => void;
};

export function DashHeader({
    userName,
    activeNav,
    role = 'ORGANIZER',
    onLogout,
}: DashHeaderProps) {
    const navLinks =
        role === 'ADMIN'
            ? [{ href: '/admin/events', label: 'Duyệt sự kiện', key: 'events' }]
            : [{ href: '/organizer/events', label: 'Sự kiện', key: 'events' }];

    return (
        <header className="dash-header">
            <a className="dash-brand" href="/">
                <span className="material-symbols-outlined">confirmation_number</span>
                izTicket
            </a>

            <nav className="dash-nav" aria-label="Dashboard navigation">
                {navLinks.map((link) => (
                    <a
                        key={link.key}
                        href={link.href}
                        className={activeNav === link.key ? 'active' : ''}
                    >
                        {link.label}
                    </a>
                ))}
            </nav>

            <div className="dash-actions">
                {userName && (
                    <span className="dash-user-name">{userName}</span>
                )}
                <button
                    className="btn-ghost"
                    type="button"
                    onClick={onLogout}
                >
                    <span className="material-symbols-outlined">logout</span>
                    Đăng xuất
                </button>
            </div>
        </header>
    );
}
