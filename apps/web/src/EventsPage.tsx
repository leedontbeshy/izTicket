import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
    MaterialIcon,
    PublicFooter,
    PublicHeader,
} from './PublicLayout';
import {
    listPublicEvents,
    type PublicEventListItem,
} from './api/events.api';
import './EventsPage.css';

const fallbackImage =
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=720&q=80';

const categories = [
    { icon: 'grid_view', label: 'Tất cả', active: true },
    { icon: 'music_note', label: 'Âm nhạc' },
    { icon: 'emoji_events', label: 'Thể thao' },
    { icon: 'edit', label: 'Hội thảo' },
    { icon: 'theater_comedy', label: 'Giải trí' },
    { icon: 'handyman', label: 'Workshop' },
    { icon: 'sports_esports', label: 'Esports' },
    { icon: 'image', label: 'Triển lãm' },
];

const sidebarCategories = [
    ['Tất cả danh mục', ''],
    ['Âm nhạc', ''],
    ['Thể thao', ''],
    ['Hội thảo', ''],
    ['Giải trí', ''],
    ['Workshop', ''],
];

function EventsPage() {
    const [events, setEvents] = useState<PublicEventListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState('');
    const [city, setCity] = useState('');
    const [submittedFilters, setSubmittedFilters] = useState({
        q: '',
        city: '',
    });
    const [total, setTotal] = useState(0);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');

        listPublicEvents({
            page: 1,
            limit: 20,
            q: submittedFilters.q,
            city: submittedFilters.city,
        })
            .then((page) => {
                if (!active) return;
                setEvents(page.items);
                setTotal(page.total);
            })
            .catch((err: unknown) => {
                if (!active) return;
                setEvents([]);
                setTotal(0);
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Không thể tải danh sách sự kiện.',
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [submittedFilters]);

    const resultLabel = useMemo(() => {
        if (loading) return 'Đang tải sự kiện...';
        if (error) return 'Chưa thể tải sự kiện';
        return `Hiển thị ${events.length}/${total} sự kiện`;
    }, [error, events.length, loading, total]);

    function submitFilters(event: FormEvent) {
        event.preventDefault();
        setSubmittedFilters({
            q: query,
            city,
        });
    }

    return (
        <main className="events-page">
            <PublicHeader active="events" />

            <section className="events-hero">
                <div className="breadcrumb">
                    <a href="/">Trang chủ</a>
                    <MaterialIcon>chevron_right</MaterialIcon>
                    <span>Sự kiện</span>
                </div>
                <h1>Tất cả sự kiện</h1>
                <p>
                    Khám phá các sự kiện đã được duyệt và đang mở bán trên izTicket.
                </p>

                <form className="events-filter-bar" onSubmit={submitFilters}>
                    <label className="events-search">
                        <MaterialIcon>search</MaterialIcon>
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Tìm kiếm sự kiện..."
                        />
                    </label>
                    <label className="events-search">
                        <MaterialIcon>location_on</MaterialIcon>
                        <input
                            value={city}
                            onChange={(event) => setCity(event.target.value)}
                            placeholder="Thành phố"
                        />
                    </label>
                    <button type="button">
                        <MaterialIcon>calendar_today</MaterialIcon>
                        Tất cả thời gian
                        <MaterialIcon>expand_more</MaterialIcon>
                    </button>
                    <button className="filter-button" type="submit">
                        <MaterialIcon>tune</MaterialIcon>
                        Lọc
                    </button>
                </form>

                <div className="category-chip-row">
                    {categories.map((category) => (
                        <button
                            className={category.active ? 'active' : ''}
                            key={category.label}
                            type="button"
                        >
                            <MaterialIcon>{category.icon}</MaterialIcon>
                            {category.label}
                        </button>
                    ))}
                    <button
                        className="link-chip"
                        type="button"
                        onClick={() => {
                            setQuery('');
                            setCity('');
                            setSubmittedFilters({ q: '', city: '' });
                        }}
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            </section>

            <section className="events-content">
                <aside className="events-sidebar" aria-label="Bộ lọc sự kiện">
                    <FilterPanel title="Danh mục" expanded>
                        {sidebarCategories.map(([label, count], index) => (
                            <label className="filter-check" key={label}>
                                <input defaultChecked={index === 0} type="checkbox" />
                                <span>{label}</span>
                                <small>{count}</small>
                            </label>
                        ))}
                    </FilterPanel>
                    <FilterPanel title="Địa điểm" />
                    <FilterPanel title="Thời gian" />
                    <FilterPanel title="Giá vé" expanded>
                        <div className="price-range">
                            <div>
                                <span>0đ</span>
                                <span>5.000.000đ+</span>
                            </div>
                            <input defaultValue="100" type="range" />
                        </div>
                    </FilterPanel>
                </aside>

                <div className="events-results">
                    <div className="result-toolbar">
                        <p>{resultLabel}</p>
                        <div>
                            <button className="sort-button" type="button">
                                Sắp xếp: Sớm nhất
                                <MaterialIcon>expand_more</MaterialIcon>
                            </button>
                            <button className="view-button active" type="button">
                                <MaterialIcon>grid_view</MaterialIcon>
                            </button>
                            <button className="view-button" type="button">
                                <MaterialIcon>view_list</MaterialIcon>
                            </button>
                        </div>
                    </div>

                    {error ? (
                        <StateMessage icon="error" title="Không thể tải sự kiện" text={error} />
                    ) : loading ? (
                        <StateMessage
                            icon="hourglass_top"
                            title="Đang tải sự kiện"
                            text="Danh sách sẽ hiển thị ngay khi API phản hồi."
                        />
                    ) : events.length === 0 ? (
                        <StateMessage
                            icon="event_busy"
                            title="Chưa có sự kiện phù hợp"
                            text="Thử bỏ bớt bộ lọc hoặc quay lại sau khi organizer đăng sự kiện mới."
                        />
                    ) : (
                        <div className="event-list-grid">
                            {events.map((event) => (
                                <EventListCard event={event} key={event.id} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
            <PublicFooter />
        </main>
    );
}

function FilterPanel({
    children,
    expanded = false,
    title,
}: {
    children?: ReactNode;
    expanded?: boolean;
    title: string;
}) {
    return (
        <section className="filter-panel">
            <button type="button">
                {title}
                <MaterialIcon>{expanded ? 'expand_less' : 'expand_more'}</MaterialIcon>
            </button>
            {expanded ? <div className="filter-panel-body">{children}</div> : null}
        </section>
    );
}

function EventListCard({ event }: { event: PublicEventListItem }) {
    const date = formatShortDate(event.startsAt);

    return (
        <article className="event-list-card">
            <div className="event-list-image">
                <img src={event.thumbnailUrl ?? fallbackImage} alt={event.title} />
                <span className="status-pill blue">Đang mở bán</span>
                <button type="button" aria-label={`Lưu ${event.title}`}>
                    <MaterialIcon>favorite</MaterialIcon>
                </button>
                <div className="date-pill">
                    <MaterialIcon>calendar_today</MaterialIcon>
                    {date}
                </div>
            </div>
            <div className="event-list-body">
                <h2>
                    <a href={`/events/${event.id}`}>{event.title}</a>
                </h2>
                <p>
                    <MaterialIcon>location_on</MaterialIcon>
                    {event.city}
                </p>
                <p>
                    <MaterialIcon>apartment</MaterialIcon>
                    {event.venueName}
                </p>
                <strong>{formatPrice(event.minPrice)}</strong>
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
        <section className="events-state">
            <MaterialIcon>{icon}</MaterialIcon>
            <h2>{title}</h2>
            <p>{text}</p>
        </section>
    );
}

function formatPrice(value: number | null) {
    if (value === null) return 'Chưa mở bán';
    return `Từ ${new Intl.NumberFormat('vi-VN').format(value)}đ`;
}

function formatShortDate(value: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
    }).format(new Date(value));
}

export default EventsPage;
