import type { ReactNode } from 'react';
import {
    MaterialIcon,
    PublicFooter,
    PublicHeader,
} from './PublicLayout';
import './EventsPage.css';

type EventListItem = {
    title: string;
    date: string;
    location: string;
    venue: string;
    price: string;
    image: string;
    status: string;
    statusTone: 'blue' | 'red';
};

const eventItems: EventListItem[] = [
    {
        title: 'Đen Vâu Live in Concert',
        date: '10.06',
        location: 'TP. Hồ Chí Minh',
        venue: 'Nhà thi đấu Phú Thọ',
        price: 'Từ 450.000đ',
        status: 'Sắp diễn ra',
        statusTone: 'red',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=720&q=80',
    },
    {
        title: 'AMEE Show: Dreamy Night',
        date: '18.06',
        location: 'Hà Nội',
        venue: 'Cung Văn hóa Hữu nghị Việt Xô',
        price: 'Từ 390.000đ',
        status: 'Sắp diễn ra',
        statusTone: 'red',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=720&q=80',
    },
    {
        title: 'V.League 2026 - Vòng 10',
        date: '01.07',
        location: 'Hà Nội',
        venue: 'SVĐ Quốc gia Mỹ Đình',
        price: 'Từ 120.000đ',
        status: 'Sắp diễn ra',
        statusTone: 'red',
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=720&q=80',
    },
    {
        title: 'Tech Summit Vietnam 2026',
        date: '15.07',
        location: 'TP. Hồ Chí Minh',
        venue: 'SECC',
        price: 'Từ 990.000đ',
        status: 'Mới mở bán',
        statusTone: 'blue',
        image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=720&q=80',
    },
    {
        title: 'Disney On Ice Vietnam',
        date: '20.09',
        location: 'Đà Nẵng',
        venue: 'Cung thể thao Tiên Sơn',
        price: 'Từ 300.000đ',
        status: 'Sắp diễn ra',
        statusTone: 'red',
        image: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?auto=format&fit=crop&w=720&q=80',
    },
    {
        title: 'Hài Độc Thoại: Cười Xuyên Việt',
        date: '05.09',
        location: 'Hà Nội',
        venue: 'Nhà hát Lớn Hà Nội',
        price: 'Từ 250.000đ',
        status: 'Sắp diễn ra',
        statusTone: 'red',
        image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=720&q=80',
    },
    {
        title: 'VALORANT Champions Tour',
        date: '12.09',
        location: 'TP. Hồ Chí Minh',
        venue: 'Nhà thi đấu Quân khu 7',
        price: 'Từ 200.000đ',
        status: 'Mới mở bán',
        statusTone: 'blue',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=720&q=80',
    },
    {
        title: 'Hội thảo: AI & Tương lai công việc',
        date: '25.09',
        location: 'Hà Nội',
        venue: 'Trung tâm Hội nghị Quốc gia',
        price: 'Từ 350.000đ',
        status: 'Sắp diễn ra',
        statusTone: 'red',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=720&q=80',
    },
];

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
    ['Tất cả danh mục', '1.236'],
    ['Âm nhạc', '425'],
    ['Thể thao', '218'],
    ['Hội thảo', '198'],
    ['Giải trí', '162'],
    ['Workshop', '121'],
    ['Esports', '73'],
    ['Triển lãm', '39'],
];

function EventsPage() {
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
                    Khám phá hàng ngàn sự kiện hấp dẫn: âm nhạc, thể thao, hội
                    thảo và nhiều hơn thế nữa.
                </p>

                <div className="events-filter-bar">
                    <label className="events-search">
                        <MaterialIcon>search</MaterialIcon>
                        <input placeholder="Tìm kiếm sự kiện, nghệ sĩ, địa điểm..." />
                    </label>
                    <button type="button">
                        <MaterialIcon>location_on</MaterialIcon>
                        Tất cả địa điểm
                        <MaterialIcon>expand_more</MaterialIcon>
                    </button>
                    <button type="button">
                        <MaterialIcon>calendar_today</MaterialIcon>
                        Tất cả thời gian
                        <MaterialIcon>expand_more</MaterialIcon>
                    </button>
                    <button className="filter-button" type="button">
                        <MaterialIcon>tune</MaterialIcon>
                        Bộ lọc
                        <span>1</span>
                    </button>
                </div>

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
                    <a href="#clear">Xóa bộ lọc</a>
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
                        <p>Hiển thị 1.236 sự kiện</p>
                        <div>
                            <button className="sort-button" type="button">
                                Sắp xếp: Mới nhất
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

                    <div className="event-list-grid">
                        {eventItems.map((event) => (
                            <EventListCard event={event} key={event.title} />
                        ))}
                    </div>

                    <nav className="pagination" aria-label="Phân trang sự kiện">
                        <button type="button">
                            <MaterialIcon>chevron_left</MaterialIcon>
                        </button>
                        {[1, 2, 3, 4, 5].map((page) => (
                            <button
                                className={page === 1 ? 'active' : ''}
                                key={page}
                                type="button"
                            >
                                {page}
                            </button>
                        ))}
                        <span>...</span>
                        <button type="button">31</button>
                        <button type="button">
                            <MaterialIcon>chevron_right</MaterialIcon>
                        </button>
                    </nav>
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

function EventListCard({ event }: { event: EventListItem }) {
    return (
        <article className="event-list-card">
            <div className="event-list-image">
                <img src={event.image} alt={event.title} />
                <span className={`status-pill ${event.statusTone}`}>{event.status}</span>
                <button type="button" aria-label={`Lưu ${event.title}`}>
                    <MaterialIcon>favorite</MaterialIcon>
                </button>
                <div className="date-pill">
                    <MaterialIcon>calendar_today</MaterialIcon>
                    {event.date}
                </div>
            </div>
            <div className="event-list-body">
                <h2>
                    <a href={`/events/${toEventSlug(event.title)}`}>
                        {event.title}
                    </a>
                </h2>
                <p>
                    <MaterialIcon>location_on</MaterialIcon>
                    {event.location}
                </p>
                <p>
                    <MaterialIcon>apartment</MaterialIcon>
                    {event.venue}
                </p>
                <strong>{event.price}</strong>
            </div>
        </article>
    );
}

export default EventsPage;

function toEventSlug(title: string) {
    return title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
