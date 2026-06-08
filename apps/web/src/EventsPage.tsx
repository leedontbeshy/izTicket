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

type CategoryOption = {
    icon: string;
    label: string;
    value: string;
};

type SortMode = 'soonest' | 'latest' | 'priceAsc' | 'priceDesc';
type TimeFilter = 'all' | 'today' | 'week' | 'month';

const categories: CategoryOption[] = [
    { icon: 'grid_view', label: 'Tất cả', value: '' },
    { icon: 'music_note', label: 'Âm nhạc', value: 'music' },
    { icon: 'emoji_events', label: 'Thể thao', value: 'sports' },
    { icon: 'edit', label: 'Hội thảo', value: 'conference' },
    { icon: 'theater_comedy', label: 'Giải trí', value: 'entertainment' },
    { icon: 'handyman', label: 'Workshop', value: 'workshop' },
    { icon: 'sports_esports', label: 'Esports', value: 'esports' },
    { icon: 'image', label: 'Triển lãm', value: 'exhibition' },
];

const sortLabels: Record<SortMode, string> = {
    soonest: 'Sớm nhất',
    latest: 'Mới nhất',
    priceAsc: 'Giá thấp',
    priceDesc: 'Giá cao',
};

const timeLabels: Record<TimeFilter, string> = {
    all: 'Tất cả thời gian',
    today: 'Hôm nay',
    week: '7 ngày tới',
    month: '30 ngày tới',
};

function EventsPage() {
    const initialSearch = new URLSearchParams(window.location.search);
    const initialQuery = initialSearch.get('q') ?? '';
    const initialCity = initialSearch.get('city') ?? '';
    const initialCategory = initialSearch.get('category') ?? '';
    const [events, setEvents] = useState<PublicEventListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [query, setQuery] = useState(initialQuery);
    const [city, setCity] = useState(initialCity);
    const [category, setCategory] = useState(initialCategory);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
    const [sortMode, setSortMode] = useState<SortMode>('soonest');
    const [submittedFilters, setSubmittedFilters] = useState({
        q: initialQuery,
        city: initialCity,
        category: initialCategory,
        from: '',
        to: '',
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
            category: submittedFilters.category,
            from: submittedFilters.from,
            to: submittedFilters.to,
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

    const sortedEvents = useMemo(() => {
        return [...events].sort((first, second) => {
            if (sortMode === 'latest') {
                return getTime(second.startsAt) - getTime(first.startsAt);
            }

            if (sortMode === 'priceAsc') {
                return getPrice(first.minPrice) - getPrice(second.minPrice);
            }

            if (sortMode === 'priceDesc') {
                return getPrice(second.minPrice) - getPrice(first.minPrice);
            }

            return getTime(first.startsAt) - getTime(second.startsAt);
        });
    }, [events, sortMode]);

    const resultLabel = useMemo(() => {
        if (loading) return 'Đang tải sự kiện...';
        if (error) return 'Chưa thể tải sự kiện';
        return `Hiển thị ${events.length}/${total} sự kiện`;
    }, [error, events.length, loading, total]);

    function applyFilters(next = {
        q: query,
        city,
        category,
        timeFilter,
    }) {
        const range = getTimeRange(next.timeFilter);
        setSubmittedFilters({
            q: next.q,
            city: next.city,
            category: next.category,
            from: range.from,
            to: range.to,
        });
    }

    function submitFilters(event: FormEvent) {
        event.preventDefault();
        applyFilters();
    }

    function selectCategory(value: string) {
        setCategory(value);
        applyFilters({ q: query, city, category: value, timeFilter });
    }

    function cycleTimeFilter() {
        const next = getNextTimeFilter(timeFilter);
        setTimeFilter(next);
        applyFilters({ q: query, city, category, timeFilter: next });
    }

    function cycleSortMode() {
        const order: SortMode[] = ['soonest', 'latest', 'priceAsc', 'priceDesc'];
        const currentIndex = order.indexOf(sortMode);
        setSortMode(order[(currentIndex + 1) % order.length]);
    }

    function resetFilters() {
        setQuery('');
        setCity('');
        setCategory('');
        setTimeFilter('all');
        setSortMode('soonest');
        setSubmittedFilters({ q: '', city: '', category: '', from: '', to: '' });
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
                    <button type="button" onClick={cycleTimeFilter}>
                        <MaterialIcon>calendar_today</MaterialIcon>
                        {timeLabels[timeFilter]}
                        <MaterialIcon>expand_more</MaterialIcon>
                    </button>
                    <button className="filter-button" type="submit">
                        <MaterialIcon>tune</MaterialIcon>
                        Lọc
                    </button>
                </form>

                <div className="category-chip-row">
                    {categories.map((item) => (
                        <button
                            className={category === item.value ? 'active' : ''}
                            key={item.value || 'all'}
                            type="button"
                            onClick={() => selectCategory(item.value)}
                        >
                            <MaterialIcon>{item.icon}</MaterialIcon>
                            {item.label}
                        </button>
                    ))}
                    <button
                        className="link-chip"
                        type="button"
                        onClick={resetFilters}
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            </section>

            <section className="events-content">
                <aside className="events-sidebar" aria-label="Bộ lọc sự kiện">
                    <FilterPanel title="Danh mục" expanded>
                        {categories.map((item) => (
                            <label className="filter-check" key={item.value || 'all'}>
                                <input
                                    checked={category === item.value}
                                    type="checkbox"
                                    onChange={() => selectCategory(item.value)}
                                />
                                <span>{item.label === 'Tất cả' ? 'Tất cả danh mục' : item.label}</span>
                                <small />
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
                            <button
                                className="sort-button"
                                type="button"
                                onClick={cycleSortMode}
                            >
                                Sắp xếp: {sortLabels[sortMode]}
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
                    ) : sortedEvents.length === 0 ? (
                        <StateMessage
                            icon="event_busy"
                            title="Chưa có sự kiện phù hợp"
                            text="Thử bỏ bớt bộ lọc hoặc quay lại sau khi organizer đăng sự kiện mới."
                        />
                    ) : (
                        <div className="event-list-grid">
                            {sortedEvents.map((event) => (
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

function getTime(value: string) {
    return new Date(value).getTime();
}

function getPrice(value: number | null) {
    return value ?? Number.MAX_SAFE_INTEGER;
}

function getNextTimeFilter(value: TimeFilter): TimeFilter {
    if (value === 'all') return 'today';
    if (value === 'today') return 'week';
    if (value === 'week') return 'month';
    return 'all';
}

function getTimeRange(value: TimeFilter) {
    if (value === 'all') return { from: '', to: '' };

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    if (value === 'today') {
        end.setDate(end.getDate() + 1);
    } else if (value === 'week') {
        end.setDate(end.getDate() + 7);
    } else {
        end.setDate(end.getDate() + 30);
    }

    return {
        from: start.toISOString(),
        to: end.toISOString(),
    };
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
