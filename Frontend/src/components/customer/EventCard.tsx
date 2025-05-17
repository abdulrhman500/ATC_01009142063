import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// Import the correct event type from eventService
import { FrontendEvent } from '../../services/eventService'; // Adjust path if needed
import { Calendar, MapPin, Ticket, AlertCircle } from 'lucide-react'; // Added Ticket, AlertCircle
import Button from '../common/Button'; // Your Button component
import { useAuth } from '../../contexts/AuthContext'; // For isAuthenticated and user role

interface EventCardProps {
    event: FrontendEvent; // Use the type that eventService.getEvents actually returns
    onBook?: (eventId: string) => void; // event.id from FrontendEvent is string
}

const EventCard: React.FC<EventCardProps> = ({ event, onBook }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated, isCustomer } = useAuth();

    const handleViewDetails = () => {
        navigate(`/events/${event.id}`);
    };

    const handleBookClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click when button is clicked

        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/events/${event.id}` } }); // Redirect to login
            return;
        }
        // Only actual customers can book, others might see a different message or disabled state handled by the button itself
        if (isCustomer && onBook) {
            onBook(event.id);
        } else if (onBook) {
            // For non-customers (e.g. admin viewing the card), onBook might not be relevant or button is disabled
            // Or show a message, for now, button will likely be disabled or show "Booked" if !isCustomer logic is added to button state
            console.log("Booking action typically for customers.");
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return t('common.invalidDate', 'Invalid Date');
        }
        return new Intl.DateTimeFormat(i18n.language, { // Use i18n.language for locale
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            // Optionally add time if your ISO string includes it and you want to display it
            // hour: '2-digit',
            // minute: '2-digit',
        }).format(date);
    };

    // Fallback for missing images or to show initial if title is empty
    const titleInitial = event.name && event.name.length > 0 ? event.name[0].toUpperCase() : '!';

    return (
        <div
            className="bg-white dark:bg-slate-800 dim:bg-slate-700 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer flex flex-col h-full group"
            onClick={handleViewDetails}
            role="link"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleViewDetails(); }}
            aria-label={`${t('events.viewDetailsFor', 'View details for')} ${event.name}`}
        >
            {/* Event Image Section */}
            <div className="relative h-48 w-full overflow-hidden bg-gray-200 dark:bg-slate-700 dim:bg-slate-600">
                {event.photoUrl ? (
                    <img
                        src={event.photoUrl}
                        alt={t('events.altImage', `Image for ${event.name}`)}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-800/30 dark:to-secondary-800/30 dim:from-primary-700/30 dim:to-secondary-700/30">
                        <span className="text-5xl font-bold text-primary-500 dark:text-primary-300 dim:text-primary-400 opacity-70">
                            {titleInitial}
                        </span>
                    </div>
                )}
                {event.categoryName && (
                     <span className="absolute top-2 right-2 rtl:right-auto rtl:left-2 bg-secondary-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
                        {event.categoryName}
                    </span>
                )}
            </div>

            {/* Event Details Section */}
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white dim:text-slate-100 line-clamp-2 mb-1.5 h-14 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {event.name || t('events.defaultTitle', 'Event Title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 dim:text-slate-300 text-sm line-clamp-2 mb-3 h-[3.75rem] overflow-hidden">
                    {event.descriptionShort || t('events.defaultDescription', 'No description available.')}
                </p>

                <div className="mt-auto space-y-2.5 text-xs"> {/* Pushes button and info to bottom */}
                    <div className="flex items-center text-gray-500 dark:text-gray-400 dim:text-slate-400">
                        <Calendar size={14} className="mr-2 rtl:ml-2 rtl:mr-0 flex-shrink-0 text-primary-500 dark:text-primary-400" />
                        <span>{formatDate(event.date)}</span>
                    </div>

                    <div className="flex items-center text-gray-500 dark:text-gray-400 dim:text-slate-400">
                        <MapPin size={14} className="mr-2 rtl:ml-2 rtl:mr-0 flex-shrink-0 text-primary-500 dark:text-primary-400" />
                        <span className="line-clamp-1">{event.venueName || t('common.notAvailable', 'N/A')}</span>
                    </div>
                     <div className="flex items-center text-gray-500 dark:text-gray-400 dim:text-slate-400">
                        <Ticket size={14} className="mr-2 rtl:ml-2 rtl:mr-0 flex-shrink-0 text-primary-500 dark:text-primary-400" />
                        <span className="font-medium">{event.price || t('events.free', 'Free')}</span>
                    </div>


                    <div className="pt-3">
                        <Button
                            variant={(isAuthenticated && event.isBooked) ? 'outline' : 'primary'}
                            size="sm"
                            disabled={isAuthenticated && event.isBooked} // Only truly disable if authenticated and booked
                            onClick={handleBookClick}
                            className="w-full" // Ensure full width if prop not supported
                        >
                            {isAuthenticated && event.isBooked
                                ? t('common.booked', 'Booked')
                                : t('common.bookNow', 'Book Now')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventCard;