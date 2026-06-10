import AuthPage from '../features/auth/AuthPage';
import { getStoredAuthUser } from '../features/auth/authSession';
import {
    CheckoutListPage,
    CheckoutPage,
} from '../features/checkout/CheckoutPage';
import { PaymentResultPage } from '../features/checkout/PaymentResultPage';
import EventDetailPage from '../features/events/EventDetailPage';
import EventsPage from '../features/events/EventsPage';
import HomePage from '../features/home/HomePage';
import { AdminEventsPage } from '../features/admin/AdminEventsPage';
import { AdminReviewPage } from '../features/admin/AdminReviewPage';
import { EventFormPage } from '../features/organizer/EventFormPage';
import { OrganizerEventDetailPage } from '../features/organizer/OrganizerEventDetailPage';
import { OrganizerEventsPage } from '../features/organizer/OrganizerEventsPage';
import { MyTicketDetailPage } from '../features/tickets/MyTicketDetailPage';
import { MyTicketsPage } from '../features/tickets/MyTicketsPage';

function App() {
    const path = window.location.pathname;

    if (path === '/auth/login' || path === '/auth/register') {
        if (getStoredAuthUser()) {
            window.location.replace('/');
            return null;
        }

        return <AuthPage mode={path === '/auth/login' ? 'login' : 'register'} />;
    }

    if (path === '/events') {
        return <EventsPage />;
    }

    if (path === '/checkout') {
        return <CheckoutListPage />;
    }

    if (path.startsWith('/checkout/')) {
        return (
            <CheckoutPage
                reservationId={decodeURIComponent(path.replace('/checkout/', ''))}
            />
        );
    }

    if (path === '/payment-result') {
        return <PaymentResultPage />;
    }

    if (path === '/my-tickets') {
        return <MyTicketsPage />;
    }

    if (path.startsWith('/my-tickets/')) {
        return (
            <MyTicketDetailPage
                ticketId={decodeURIComponent(path.replace('/my-tickets/', ''))}
            />
        );
    }

    if (path.startsWith('/events/')) {
        return (
            <EventDetailPage
                eventId={decodeURIComponent(path.replace('/events/', ''))}
            />
        );
    }

    if (path === '/organizer/events') {
        return <OrganizerEventsPage />;
    }

    if (path === '/organizer/events/new') {
        return <EventFormPage mode="create" />;
    }

    if (
        path.startsWith('/organizer/events/') &&
        path.endsWith('/edit')
    ) {
        const eventId = path
            .replace('/organizer/events/', '')
            .replace('/edit', '');
        return <EventFormPage mode="edit" eventId={eventId} />;
    }

    if (path === '/admin/events') {
        return <AdminEventsPage />;
    }

    if (
        path.startsWith('/admin/events/') &&
        path.endsWith('/review')
    ) {
        const eventId = path
            .replace('/admin/events/', '')
            .replace('/review', '');
        return <AdminReviewPage eventId={eventId} />;
    }

    if (
        path.startsWith('/organizer/events/') &&
        !path.endsWith('/edit')
    ) {
        const eventId = path.replace('/organizer/events/', '');
        return <OrganizerEventDetailPage eventId={eventId} />;
    }

    return <HomePage />;
}

export default App;
