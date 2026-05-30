import { useEffect } from 'react';
import './App.css';

type FeaturedEvent = {
    title: string;
    venue: string;
    price: string;
    image: string;
    alt: string;
    badge?: string;
    soldOut?: boolean;
    waitlist?: boolean;
    grayscale?: boolean;
    attendeeCount?: string;
};

type Category = {
    title: string;
    description: string;
    image?: string;
    alt?: string;
    large?: boolean;
    accent?: boolean;
};

const logos = ['LiveNation', 'TicketMaster', 'EventBrite', 'Dice', 'SeatGeek'];

const featuredEvents: FeaturedEvent[] = [
    {
        title: 'Midnight Jazz Collective',
        venue: 'Blue Note Venue • Tomorrow, 9 PM',
        price: '$45',
        badge: 'Selling Fast',
        attendeeCount: '+12',
        alt: 'Jazz Night',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxrFo3cht94DaecZ-l-aOdXdqNgr66ySrXFM0V_TAWoI0x3ClVR8U0dr-dmoYKNTCpfZ5fOBoq1C4isJfGNrvlatKdePTdl4AzVm1gpkpuJHTDUNxXzTmIezsDUHtbkj1k7SaUC3eeRjZT-X3KfOrvjpiq8b4vhCtWc3gV5lz8sWGxWbkRjXITeGf1ov0k5kdp97HnjW-9oyF-eEnopjDcAcx8NpGUOl18YfeCAJg_QEfa6aPaEDZrF0aOsR1vdV5YhyGj4IILSqw',
    },
    {
        title: 'Summer Solstice Fest',
        venue: 'Grand Park • Aug 15-17',
        price: '$120',
        badge: 'Sold Out',
        soldOut: true,
        waitlist: true,
        grayscale: true,
        alt: 'Festival',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBR2eOF9aaWkIO0va-9QcodffzNlLHK_Y_VOotBqwD_mjxMRaA2vR4yS2mD0uFToNRsjH4mpUGeAVWw06exIhjnoI7HoglG7O56rX6czIYzaeSL38uWGrKxl1XN1H25X6wmiSsztl5mAuTMINYiiRLBLDIzW4MSdIP-V6ym3bK6vlX3fP6nO0eCaPSQZUWAntJcIXbfNqtz-HPK80irRXxhNk8jEx3PvtDMBzlAVlEvQjQzUAVKNA-IJ2-eGdbow-JEa0LsAMuhdOc',
    },
    {
        title: 'FutureForward Summit',
        venue: 'Convention Center • Sep 10',
        price: '$299',
        alt: 'Tech Conference',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZkUuA5h02JRzcXKunSAaEj6XpuIowSZfqGu1IAAlCd8a_dQ54Qj1vde4K28AizgYHHsE0ixAs5XjsFgy2w-_3zAGxybd2qQ4MU1tEMUoHtRw7_RktL8tXRzanStAlWv3yLecu1oRjQpUQ8n1NLWYsClGylKKCV-HddXu6RZMEmbnmpgLeBgVikHckX47OOh4aUkRDeLpI3An_H08WB6fFt87qkb6rdyljzUxXHJjXzTZpI21EHSRiJhuirz8YS27kLfZwpI3Ypk4',
    },
];

const categories: Category[] = [
    {
        title: 'Live Music',
        description:
            'Feel the bass. Experience the energy. Book your next concert.',
        large: true,
        alt: 'Live Concert',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUa4Zzez2mT_ONveLWOe1ZW_yOjaKSqCmI8U4RxtFqNwgxNAqsJWWhbSW0wm2FTkE6dNsgvviyRQ_ikXDtl_kmNi6F-JJh2LAQ07yh07vQyzq4iexXuJnnbRpFqjIiK-70LXolR1FYoiJBO17zpXedU6CRfga8sMq5KYXeKb90hYe7ynHx7J9gPSbbBxnQVTDP84QExhTVuufbdYPEyIoudq0VOcrW3HQ9lYqMHFAcm5Hukvmb208Wgfng7_jY2jjUgMi1Re20Peg',
    },
    {
        title: 'Conferences',
        description: 'Connect & Learn',
        alt: 'Conference',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyESM4gKbq_Z_u_DnzHJ-r_6jbZF64ol9h8GxFDkGRis-f5YXf5RHUoUIz8Q1AAnZczHpFEHlJxiudD-Ld1VcQ5moCd9z37d6yeNsyiYLVejuBm0sO0rEQipTR2OC9mObP5x3A4rHZVKG3bbesCV8Ayfx1dD6CHGneXx_2mfQG2ZSNPERvf3E5hyWkIpY579Q53-CyEJnq2Nt2LSNnGkFD9Z27n3wdEQvIpL0lYA4y3WkxAx3-hzRn6EhD2I8nxUWaGmTSMxVA4Sg',
    },
    {
        title: 'Arts & Theater',
        description: 'Discover local performances and world-class shows.',
        accent: true,
    },
];

function MaterialIcon({
    children,
    className = '',
}: {
    children: string;
    className?: string;
}) {
    return (
        <span className={`material-symbols-outlined ${className}`}>
            {children}
        </span>
    );
}

function LogoTicker() {
    return (
        <section className="logo-ticker reveal">
            <div className="ticker-track">
                {[0, 1].map((group) => (
                    <div className="ticker-group" key={group}>
                        {logos.map((logo) => (
                            <span key={`${group}-${logo}`}>{logo}</span>
                        ))}
                    </div>
                ))}
            </div>
        </section>
    );
}

function FeaturedEventCard({ event }: { event: FeaturedEvent }) {
    return (
        <article className="featured-card card-shadow">
            <img
                alt={event.alt}
                className={event.grayscale ? 'event-image grayscale' : 'event-image'}
                src={event.image}
            />
            <div className="card-gradient" />
            {event.badge ? (
                <div className={event.soldOut ? 'event-badge sold-out' : 'event-badge'}>
                    {event.badge}
                </div>
            ) : null}
            <div className="featured-content">
                <div>
                    <h3>{event.title}</h3>
                    <p>{event.venue}</p>
                </div>
                <div className="event-actions">
                    <span className="price-pill">{event.price}</span>
                    {event.waitlist ? (
                        <a className="waitlist-link" href="#waitlist">
                            Join Waitlist
                        </a>
                    ) : (
                        <div className="attendee-stack" aria-label="Interested attendees">
                            <span />
                            <span />
                            {event.attendeeCount ? <span>{event.attendeeCount}</span> : null}
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}

function CategoryCard({ category }: { category: Category }) {
    if (category.accent) {
        return (
            <article className="category-card accent-card card-shadow">
                <MaterialIcon className="theater-icon">theater_comedy</MaterialIcon>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <button type="button">Explore</button>
            </article>
        );
    }

    return (
        <article
            className={
                category.large
                    ? 'category-card category-large card-shadow'
                    : 'category-card card-shadow'
            }
        >
            {category.image ? (
                <img alt={category.alt} className="category-image" src={category.image} />
            ) : null}
            <div className="card-gradient" />
            <div className="category-content">
                <h3>{category.title}</h3>
                <p>{category.description}</p>
            </div>
            {category.large ? (
                <div className="category-arrow" aria-hidden="true">
                    <MaterialIcon>arrow_forward</MaterialIcon>
                </div>
            ) : null}
        </article>
    );
}

function App() {
    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            document
                .querySelectorAll('.fade-up-target')
                .forEach((element) => element.classList.add('fade-up-active'));
        });

        const observer = new IntersectionObserver(
            (entries, currentObserver) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        currentObserver.unobserve(entry.target);
                    }
                });
            },
            { root: null, rootMargin: '0px', threshold: 0.15 },
        );

        document
            .querySelectorAll('.reveal')
            .forEach((element) => observer.observe(element));

        return () => {
            window.cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, []);

    return (
        <>
            <header className="top-nav">
                <div className="glass-panel nav-shell">
                    <div className="nav-left">
                        <a className="brand" href="#">
                            izTicket
                        </a>
                        <div className="search-box">
                            <MaterialIcon className="search-symbol">search</MaterialIcon>
                            <input placeholder="Search events..." type="text" />
                        </div>
                    </div>

                    <nav className="main-nav" aria-label="Main navigation">
                        <a href="#">Browse Events</a>
                        <a href="#">Venues</a>
                        <a href="#">About</a>
                    </nav>

                    <div className="nav-actions">
                        <button className="login-button" type="button">
                            Login
                        </button>
                        <button className="register-button" type="button">
                            Register
                        </button>
                    </div>
                </div>
            </header>

            <main className="landing-page">
                <section className="hero-section">
                    <div className="hero-grid">
                        <div className="hero-title-wrap">
                            <h1 className="fade-up-enter fade-up-target delay-100">
                                Sống trọn <span>đam mê,</span>
                                <br />
                                Kết nối sự kiện
                            </h1>
                        </div>
                        <div>
                            <p className="hero-copy fade-up-enter fade-up-target delay-200">
                                Discover premium live experiences. From underground
                                raves to massive stadium tours, find your next
                                unforgettable moment.
                            </p>
                            <div className="hero-form fade-up-enter fade-up-target delay-300">
                                <input placeholder="Enter your email" type="email" />
                                <button type="button">Explore Now</button>
                            </div>
                        </div>
                    </div>
                </section>

                <LogoTicker />

                <section className="problem-section reveal">
                    <div className="problem-panel card-shadow">
                        <div>
                            <h2>
                                The event industry is broken.
                                <br />
                                <span>We're fixing it.</span>
                            </h2>
                            <button type="button">See How It Works</button>
                        </div>
                        <div className="problem-list">
                            <div>
                                <h3>
                                    <span>Forget about</span> ticket fraud
                                </h3>
                            </div>
                            <div>
                                <h3>
                                    <span>No more</span> long queues
                                </h3>
                            </div>
                            <div>
                                <h3>
                                    <span>End the frustration of</span> hidden fees
                                </h3>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="featured-section reveal">
                    <div className="section-heading">
                        <div>
                            <h2>Trending Now</h2>
                            <p>The most anticipated events this week.</p>
                        </div>
                        <div className="carousel-actions">
                            <button aria-label="Previous" type="button">
                                <MaterialIcon>arrow_back</MaterialIcon>
                            </button>
                            <button aria-label="Next" type="button">
                                <MaterialIcon>arrow_forward</MaterialIcon>
                            </button>
                        </div>
                    </div>

                    <div className="featured-track">
                        {featuredEvents.map((event) => (
                            <FeaturedEventCard event={event} key={event.title} />
                        ))}
                    </div>
                </section>

                <section className="categories-section reveal">
                    <h2>Curated Experiences</h2>
                    <div className="category-grid">
                        {categories.map((category) => (
                            <CategoryCard category={category} key={category.title} />
                        ))}
                    </div>
                </section>
            </main>

            <footer className="site-footer">
                <div className="footer-shell">
                    <div className="footer-brand">
                        <span>izTicket</span>
                        <p>© 2024 izTicket. High-contrast event access.</p>
                    </div>
                    <nav aria-label="Footer navigation">
                        <a href="#">Terms of Service</a>
                        <a href="#">Privacy Policy</a>
                        <a href="#">Refund Policy</a>
                        <a href="#">Contact Support</a>
                    </nav>
                </div>
            </footer>
        </>
    );
}

export default App;
