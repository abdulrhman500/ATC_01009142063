import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import eventService, { FrontendEvent } from '../../services/eventService'; // Adjust path
import { useAuth } from '../../contexts/AuthContext'; // Adjust path
import Button from '../../components/common/Button'; // Adjust path
import { Calendar, MapPin, Tag as TagIcon, Users, DollarSign, ArrowLeft, Loader2, AlertTriangle, Ticket, Info, RefreshCw } from 'lucide-react';
import { AppRoles } from '../../config/AppRoles'; // Adjust path
import { motion } from 'framer-motion';

// Skeleton Loader for Details Page
const EventDetailsSkeleton: React.FC = () => (
    <div className="animate-pulse">
        <div className="h-8 bg-gray-300 dark:bg-slate-700 rounded w-3/4 mb-6"></div> {/* Title */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl overflow-hidden">
            <div className="h-64 sm:h-80 md:h-96 bg-gray-300 dark:bg-slate-700"></div> {/* Image */}
            <div className="p-6 md:p-8">
                <div className="h-6 bg-gray-300 dark:bg-slate-700 rounded w-1/2 mb-4"></div> {/* Category/Date Line */}
                <div className="space-y-3">
                    <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded"></div>
                    <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-4/6"></div>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="h-5 bg-gray-300 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-5/6 mt-1"></div>
                    </div>
                    <div>
                        <div className="h-5 bg-gray-300 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
                        <div className="h-8 bg-gray-300 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                </div>
                <div className="mt-8 h-12 bg-gray-400 dark:bg-slate-600 rounded w-full md:w-1/3"></div> {/* Button */}
            </div>
        </div>
    </div>
);


const EventDetailsPage: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user: currentUser } = useAuth();

    const [event, setEvent] = useState<FrontendEvent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isBooking, setIsBooking] = useState(false); // For booking button loading state

    const isCustomer = currentUser?.role === AppRoles.Customer;

    const fetchEventDetails = useCallback(async () => {
        if (!eventId) {
            setError(t('events.details.invalidId', 'Invalid event ID.'));
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const fetchedEvent = await eventService.getEventById(eventId);
            if (fetchedEvent) {
                setEvent(fetchedEvent);
            } else {
                setError(t('events.details.notFound', 'Event not found.'));
            }
        } catch (err: any) {
            setError(err.message || t('events.details.loadError', 'Failed to load event details.'));
        } finally {
            setIsLoading(false);
        }
    }, [eventId, t]);

    useEffect(() => {
        fetchEventDetails();
    }, [fetchEventDetails]);

    const handleBookEvent = async () => {
        if (!event) return;
        if (!isAuthenticated) {
            navigate('/login', { state: { from: location } });
            return;
        }
        if (!isCustomer) {
            alert(t('events.bookingNotAllowed', 'Only customers can book events.'));
            return;
        }

        setIsBooking(true);
        setError(null); // Clear previous errors
        try {
            eventService.bookEvent(event.id);
            // Option 1: Navigate to confirmation
            navigate(`/booking-confirmation/${event.id}`);
            // Option 2: Refetch event to update isBooked status (more SPA-like)
            // fetchEventDetails(); // This will update the 'event' state including 'isBooked'
        } catch (err: any) {
            setError(err.message || t('events.bookingError', 'Failed to book event. Please try again.'));
        } finally {
            setIsBooking(false);
        }
    };
    
    const formatDateRange = (isoDate: string) => {
        const date = new Date(isoDate);
        if (isNaN(date.getTime())) return "Invalid Date";
        return new Intl.DateTimeFormat(i18n.language, { dateStyle: 'full', timeStyle: 'short' }).format(date);
    };


    if (isLoading) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EventDetailsSkeleton />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-200 p-6 rounded-md shadow-md max-w-lg mx-auto">
                    <div className="flex justify-center mb-3">
                        <AlertTriangle size={32} className="text-red-500 dark:text-red-300" />
                    </div>
                    <p className="font-semibold text-lg mb-1">{t('common.errorOccurred', 'An Error Occurred')}</p>
                    <p>{error}</p>
                    <Button onClick={() => fetchEventDetails()} className="mt-4" variant="outline">
                        <RefreshCw size={16} className="mr-2"/> {t('common.retry', 'Try Again')}
                    </Button>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">{t('events.details.notFound', 'Event Not Found')}</h1>
                <Link to="/events" className="mt-4 inline-block text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                    &larr; {t('common.backToEvents', 'Back to all events')}
                </Link>
            </div>
        );
    }

    // Assuming EventSummary has 'descriptionShort', for details page you might want full 'description'
    // If eventService.getEventById returns full description in a 'description' field:
    const descriptionToDisplay = (event as any).description || event.descriptionShort;

    return (
        <div className="container mx-auto px-2 sm:px-4 lg:px-8 py-8">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-sm text-text-secondary dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-200">
                    <ArrowLeft size={18} className="mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('common.backToList', 'Back to Events')}
                </Button>

                <div className="bg-white dark:bg-slate-800 dim:bg-slate-700 rounded-xl shadow-2xl overflow-hidden">
                    <div className="md:flex">
                        <div className="md:w-1/2 xl:w-2/5 md:shrink-0">
                            <img 
                                className="h-64 w-full object-cover md:h-full" 
                                src={event.photoUrl || '/placeholder-event-large.jpg'} 
                                alt={t('events.altImageDetailed', `Image for ${event.name}`)} 
                            />
                        </div>
                        <div className="p-6 md:p-8 flex-1">
                            {event.categoryName && (
                                <span className="inline-block bg-secondary-100 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase mb-2">
                                    {event.categoryName}
                                </span>
                            )}
                            <h1 className="block mt-1 text-3xl sm:text-4xl leading-tight font-bold text-gray-900 dark:text-white dim:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                {event.name}
                            </h1>
                            
                            <div className="mt-4 space-y-3 text-gray-600 dark:text-gray-300 dim:text-slate-300">
                                <div className="flex items-center">
                                    <Calendar size={18} className="mr-3 rtl:ml-3 rtl:mr-0 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                                    <span>{formatDateRange(event.date)}</span>
                                </div>
                                <div className="flex items-center">
                                    <MapPin size={18} className="mr-3 rtl:ml-3 rtl:mr-0 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                                    <span>{event.venueName}</span>
                                </div>
                                <div className="flex items-center">
                                    <DollarSign size={18} className="mr-3 rtl:ml-3 rtl:mr-0 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                                    <span className="text-xl font-semibold">{event.price}</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 dim:text-slate-200 mb-2">{t('events.details.about', 'About this event')}</h2>
                                <p className="text-gray-600 dark:text-gray-400 dim:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {descriptionToDisplay}
                                </p>
                            </div>
                            
                            {/* Tags section placeholder */}
                            {/* <div className="mt-6">
                                <h3 className="text-md font-semibold text-gray-700 dark:text-gray-200 mb-2">Tags:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {event.tags?.map(tag => <span key={tag.id} className="chip">{tag.name}</span>)}
                                </div>
                            </div> */}

                            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
                                {isAuthenticated && isCustomer ? (
                                    <Button
                                        onClick={handleBookEvent}
                                        disabled={event.isBooked || isBooking}
                                        isLoading={isBooking}
                                        fullWidth
                                        size="lg"
                                        variant={event.isBooked ? "success" : "primary"} // Assuming success variant for booked
                                    >
                                        <Ticket size={20} className="mr-2 rtl:ml-2 rtl:mr-0"/>
                                        {event.isBooked 
                                            ? t('common.alreadyBooked', 'You\'ve Booked This Event') 
                                            : (isBooking ? t('events.bookingInProgress', 'Booking...') : t('common.bookNow', 'Book Your Spot'))}
                                    </Button>
                                ) : isAuthenticated && !isCustomer ? (
                                    <p className="text-sm text-center text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-md">
                                       <Info size={16} className="inline mr-2"/> {t('events.adminCannotBook', 'Admins typically manage, not book events through this interface.')}
                                    </p>
                                ) : (
                                    <Button
                                        onClick={() => navigate('/login', { state: { from: location }})}
                                        
                                        size="lg"
                                    >
                                        {t('auth.loginToBook', 'Login to Book Event')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default EventDetailsPage;