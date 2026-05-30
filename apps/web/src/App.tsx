import { useEffect } from 'react';
import './App.css';

type FeaturedEvent = {
    title: string;
    date: string;
    location: string;
    price: string;
    image: string;
    alt: string;
    status: string;
    statusVariant: 'available' | 'selling-fast' | 'sold-out';
    action: string;
    waitlist?: boolean;
    grayscale?: boolean;
    attendeeCount?: string;
};

type Category = {
    eyebrow: string;
    title: string;
    description: string;
    action: string;
    image?: string;
    alt?: string;
    large?: boolean;
    accent?: boolean;
};

type ProblemItem = {
    icon: string;
    title: string;
    description: string;
};

type HowStep = {
    icon: string;
    title: string;
    description: string;
};

type Testimonial = {
    initials: string;
    name: string;
    role: string;
    review: string;
    rating: string;
};

type FooterGroup = {
    title: string;
    links: string[];
};

const logos = [
    'LiveNation',
    'AEG Presents',
    'Goldenvoice',
    'Boiler Room',
    'TEDx',
];

const featuredEvents: FeaturedEvent[] = [
    {
        title: 'Midnight Jazz Collective',
        date: 'Tomorrow, 9 PM',
        location: 'Blue Note Venue, New York',
        price: 'From $45',
        status: 'Selling fast',
        statusVariant: 'selling-fast',
        action: 'View tickets',
        attendeeCount: '+12',
        alt: 'Jazz Night',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxrFo3cht94DaecZ-l-aOdXdqNgr66ySrXFM0V_TAWoI0x3ClVR8U0dr-dmoYKNTCpfZ5fOBoq1C4isJfGNrvlatKdePTdl4AzVm1gpkpuJHTDUNxXzTmIezsDUHtbkj1k7SaUC3eeRjZT-X3KfOrvjpiq8b4vhCtWc3gV5lz8sWGxWbkRjXITeGf1ov0k5kdp97HnjW-9oyF-eEnopjDcAcx8NpGUOl18YfeCAJg_QEfa6aPaEDZrF0aOsR1vdV5YhyGj4IILSqw',
    },
    {
        title: 'Summer Solstice Fest',
        date: 'Aug 15-17',
        location: 'Grand Park, Chicago',
        price: 'From $120',
        status: 'Sold out',
        statusVariant: 'sold-out',
        action: 'Join waitlist',
        waitlist: true,
        grayscale: true,
        alt: 'Festival',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBR2eOF9aaWkIO0va-9QcodffzNlLHK_Y_VOotBqwD_mjxMRaA2vR4yS2mD0uFToNRsjH4mpUGeAVWw06exIhjnoI7HoglG7O56rX6czIYzaeSL38uWGrKxl1XN1H25X6wmiSsztl5mAuTMINYiiRLBLDIzW4MSdIP-V6ym3bK6vlX3fP6nO0eCaPSQZUWAntJcIXbfNqtz-HPK80irRXxhNk8jEx3PvtDMBzlAVlEvQjQzUAVKNA-IJ2-eGdbow-JEa0LsAMuhdOc',
    },
    {
        title: 'FutureForward Summit',
        date: 'Sep 10, 9 AM',
        location: 'Convention Center, San Francisco',
        price: 'From $299',
        status: 'Available',
        statusVariant: 'available',
        action: 'View tickets',
        alt: 'Tech Conference',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZkUuA5h02JRzcXKunSAaEj6XpuIowSZfqGu1IAAlCd8a_dQ54Qj1vde4K28AizgYHHsE0ixAs5XjsFgy2w-_3zAGxybd2qQ4MU1tEMUoHtRw7_RktL8tXRzanStAlWv3yLecu1oRjQpUQ8n1NLWYsClGylKKCV-HddXu6RZMEmbnmpgLeBgVikHckX47OOh4aUkRDeLpI3An_H08WB6fFt87qkb6rdyljzUxXHJjXzTZpI21EHSRiJhuirz8YS27kLfZwpI3Ypk4',
    },
];

const categories: Category[] = [
    {
        eyebrow: 'Music',
        title: 'Live Music',
        description:
            'Concerts, festivals, and intimate performances with verified access.',
        action: 'Explore music',
        large: true,
        alt: 'Live Concert',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUa4Zzez2mT_ONveLWOe1ZW_yOjaKSqCmI8U4RxtFqNwgxNAqsJWWhbSW0wm2FTkE6dNsgvviyRQ_ikXDtl_kmNi6F-JJh2LAQ07yh07vQyzq4iexXuJnnbRpFqjIiK-70LXolR1FYoiJBO17zpXedU6CRfga8sMq5KYXeKb90hYe7ynHx7J9gPSbbBxnQVTDP84QExhTVuufbdYPEyIoudq0VOcrW3HQ9lYqMHFAcm5Hukvmb208Wgfng7_jY2jjUgMi1Re20Peg',
    },
    {
        eyebrow: 'Business',
        title: 'Conferences',
        description:
            'Summits, talks, and professional gatherings worth your time.',
        action: 'Explore conferences',
        alt: 'Conference',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyESM4gKbq_Z_u_DnzHJ-r_6jbZF64ol9h8GxFDkGRis-f5YXf5RHUoUIz8Q1AAnZczHpFEHlJxiudD-Ld1VcQ5moCd9z37d6yeNsyiYLVejuBm0sO0rEQipTR2OC9mObP5x3A4rHZVKG3bbesCV8Ayfx1dD6CHGneXx_2mfQG2ZSNPERvf3E5hyWkIpY579Q53-CyEJnq2Nt2LSNnGkFD9Z27n3wdEQvIpL0lYA4y3WkxAx3-hzRn6EhD2I8nxUWaGmTSMxVA4Sg',
    },
    {
        eyebrow: 'Culture',
        title: 'Arts & Theater',
        description:
            'Stage, comedy, exhibitions, and cultural nights in one place.',
        action: 'Explore arts',
        accent: true,
    },
];

const problemItems: ProblemItem[] = [
    {
        icon: 'gpp_good',
        title: 'No ticket fraud',
        description: 'Verified QR tickets protect every purchase.',
    },
    {
        icon: 'receipt_long',
        title: 'Transparent pricing',
        description: 'See the full price before checkout.',
    },
    {
        icon: 'bolt',
        title: 'Fast checkout',
        description: 'Reserve and pay in minutes.',
    },
    {
        icon: 'confirmation_number',
        title: 'Digital ticket delivery',
        description: 'Tickets arrive instantly after payment.',
    },
];

const howSteps: HowStep[] = [
    {
        icon: 'search',
        title: 'Discover Events',
        description: 'Browse curated experiences by category, venue, and date.',
    },
    {
        icon: 'confirmation_number',
        title: 'Select Tickets',
        description: 'Choose ticket types with clear availability and pricing.',
    },
    {
        icon: 'lock',
        title: 'Secure Payment',
        description: 'Complete checkout with a protected payment flow.',
    },
    {
        icon: 'qr_code_2',
        title: 'Receive Ticket',
        description: 'Get your digital ticket instantly after confirmation.',
    },
];

const testimonials: Testimonial[] = [
    {
        initials: 'MK',
        name: 'Maya Kim',
        role: 'Festival organizer',
        rating: '5.0',
        review: 'izTicket made ticket sales feel controlled and transparent from launch day through the final scan.',
    },
    {
        initials: 'DL',
        name: 'Daniel Lee',
        role: 'Concert attendee',
        rating: '5.0',
        review: 'Checkout was fast, pricing was clear, and my ticket arrived before I left the page.',
    },
    {
        initials: 'AR',
        name: 'Anika Rao',
        role: 'Conference producer',
        rating: '4.9',
        review: 'The experience feels premium without getting in the way of the actual event decision.',
    },
];

const footerGroups: FooterGroup[] = [
    {
        title: 'Explore',
        links: ['Events', 'Venues', 'Categories'],
    },
    {
        title: 'Account',
        links: ['Login', 'Create account', 'My tickets'],
    },
    {
        title: 'Support',
        links: ['Help center', 'Refund policy', 'Contact'],
    },
    {
        title: 'Legal',
        links: ['Terms', 'Privacy'],
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
        <section className="logo-ticker reveal" aria-label="Partner organizers">
            <p className="logo-label">Trusted by leading event organizers</p>
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
                className={
                    event.grayscale ? 'event-image grayscale' : 'event-image'
                }
                src={event.image}
            />
            <div className="card-gradient" />
            <div className={`event-badge ${event.statusVariant}`}>
                {event.status}
            </div>
            <div className="featured-content">
                <div className="event-copy">
                    <h3>{event.title}</h3>
                    <div className="event-meta">
                        <span>
                            <MaterialIcon>calendar_month</MaterialIcon>
                            {event.date}
                        </span>
                        <span>
                            <MaterialIcon>location_on</MaterialIcon>
                            {event.location}
                        </span>
                    </div>
                </div>
                <div className="event-actions">
                    <span className="price-pill">{event.price}</span>
                    <a
                        className={
                            event.waitlist
                                ? 'event-link waitlist-link'
                                : 'event-link'
                        }
                        href={event.waitlist ? '#waitlist' : '#events'}
                    >
                        {event.action}
                    </a>
                    {!event.waitlist && event.attendeeCount ? (
                        <div
                            className="attendee-stack"
                            aria-label="Interested attendees"
                        >
                            <span />
                            <span />
                            <span>{event.attendeeCount}</span>
                        </div>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

function CategoryCard({ category }: { category: Category }) {
    if (category.accent) {
        return (
            <article className="category-card accent-card card-shadow">
                <MaterialIcon className="theater-icon">
                    theater_comedy
                </MaterialIcon>
                <span className="category-kicker">{category.eyebrow}</span>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <a className="category-link" href="#categories">
                    {category.action}
                    <MaterialIcon>arrow_forward</MaterialIcon>
                </a>
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
                <img
                    alt={category.alt}
                    className="category-image"
                    src={category.image}
                />
            ) : null}
            <div className="card-gradient" />
            <div className="category-content">
                <span className="category-kicker">{category.eyebrow}</span>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <a className="category-link" href="#categories">
                    {category.action}
                    <MaterialIcon>arrow_forward</MaterialIcon>
                </a>
            </div>
            {category.large ? (
                <div className="category-arrow" aria-hidden="true">
                    <MaterialIcon>arrow_forward</MaterialIcon>
                </div>
            ) : null}
        </article>
    );
}

function ProblemItemRow({ item }: { item: ProblemItem }) {
    return (
        <article className="problem-item">
            <span className="problem-icon" aria-hidden="true">
                <MaterialIcon>{item.icon}</MaterialIcon>
            </span>
            <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
            </div>
        </article>
    );
}

function HowItWorks() {
    return (
        <section className="how-section reveal" id="how-it-works">
            <div className="section-heading">
                <div>
                    <h2>How it works</h2>
                    <p>
                        From discovery to ticket delivery in four simple steps.
                    </p>
                </div>
            </div>
            <div className="steps-grid">
                {howSteps.map((step, index) => (
                    <article className="step-card card-shadow" key={step.title}>
                        <div className="step-topline">
                            <span className="step-icon" aria-hidden="true">
                                <MaterialIcon>{step.icon}</MaterialIcon>
                            </span>
                            <span className="step-index">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                        </div>
                        <h3>{step.title}</h3>
                        <p>{step.description}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
    return (
        <article className="testimonial-card card-shadow">
            <div className="testimonial-header">
                <div className="testimonial-avatar">{testimonial.initials}</div>
                <div>
                    <h3>{testimonial.name}</h3>
                    <p>{testimonial.role}</p>
                </div>
            </div>
            <blockquote>{testimonial.review}</blockquote>
            <div
                className="testimonial-rating"
                aria-label={`${testimonial.rating} out of 5 rating`}
            >
                {[0, 1, 2, 3, 4].map((star) => (
                    <MaterialIcon key={star}>star</MaterialIcon>
                ))}
                <span>{testimonial.rating}</span>
            </div>
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
                            <MaterialIcon className="search-symbol">
                                search
                            </MaterialIcon>
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
                                Book verified tickets
                                <br />
                                for <span>live events.</span>
                            </h1>
                        </div>
                        <div>
                            <p className="hero-copy fade-up-enter fade-up-target delay-200">
                                Find concerts, conferences, and live experiences
                                with secure checkout, transparent pricing, and
                                instant digital tickets.
                            </p>
                            <div className="hero-form fade-up-enter fade-up-target delay-300">
                                <input
                                    placeholder="Enter your email"
                                    type="email"
                                />
                                <button type="button">Explore Events</button>
                            </div>
                            <p className="hero-trust fade-up-enter fade-up-target delay-300">
                                50,000+ tickets sold &bull; 500+ events &bull;
                                Trusted by organizers
                            </p>
                        </div>
                    </div>
                </section>

                <LogoTicker />

                <section className="problem-section reveal">
                    <div className="problem-panel card-shadow">
                        <div>
                            <h2>
                                Ticketing should feel effortless.
                                <br />
                                <span>Trust should be built in.</span>
                            </h2>
                            <a className="problem-button" href="#how-it-works">
                                See How It Works
                            </a>
                        </div>
                        <div className="problem-list">
                            {problemItems.map((item) => (
                                <ProblemItemRow item={item} key={item.title} />
                            ))}
                        </div>
                    </div>
                </section>

                <HowItWorks />

                <section className="featured-section reveal" id="events">
                    <div className="section-heading">
                        <div>
                            <h2>Trending Now</h2>
                            <p>
                                High-demand events with clear pricing and
                                availability.
                            </p>
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
                            <FeaturedEventCard
                                event={event}
                                key={event.title}
                            />
                        ))}
                    </div>
                </section>

                <section className="categories-section reveal" id="categories">
                    <h2>Curated Experiences</h2>
                    <div className="category-grid">
                        {categories.map((category) => (
                            <CategoryCard
                                category={category}
                                key={category.title}
                            />
                        ))}
                    </div>
                </section>

                <section className="testimonials-section reveal">
                    <div className="section-heading">
                        <div>
                            <h2>Trusted after checkout</h2>
                            <p>Quiet proof from organizers and attendees.</p>
                        </div>
                    </div>
                    <div className="testimonial-grid">
                        {testimonials.map((testimonial) => (
                            <TestimonialCard
                                key={testimonial.name}
                                testimonial={testimonial}
                            />
                        ))}
                    </div>
                </section>

                <section className="final-cta-section reveal">
                    <div className="final-cta-panel card-shadow">
                        <h2>Ready for your next event?</h2>
                        <p>
                            Discover experiences, secure tickets, and enjoy
                            unforgettable moments.
                        </p>
                        <div className="final-cta-actions">
                            <a className="primary-cta" href="#events">
                                Explore Events
                            </a>
                            <a className="secondary-cta" href="#account">
                                Create Account
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="site-footer">
                <div className="footer-shell">
                    <div className="footer-brand">
                        <span>izTicket</span>
                        <p>Secure ticketing for modern live experiences.</p>
                    </div>
                    <div className="footer-columns">
                        {footerGroups.map((group) => (
                            <nav
                                aria-label={`${group.title} links`}
                                key={group.title}
                            >
                                <h2>{group.title}</h2>
                                {group.links.map((link) => (
                                    <a href="#" key={link}>
                                        {link}
                                    </a>
                                ))}
                            </nav>
                        ))}
                    </div>
                    <p className="footer-bottom">
                        © 2024 izTicket. High-contrast event access.
                    </p>
                </div>
            </footer>
        </>
    );
}

export default App;
