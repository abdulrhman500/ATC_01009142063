import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import eventService, { FrontendEvent, PaginatedEventsApiResponse } from '../../services/eventService'; // Import updated types
import EventCard from '../../components/customer/EventCard'; // Ensure this component expects FrontendEvent
import { Search, FilterX, Loader2 } from 'lucide-react'; // Added FilterX and Loader2
// Import your CustomerSidebar if it handles category selection
// import CustomerSidebar from '../../components/customer/CustomerSidebar';
import { useAuth } from '../../contexts/AuthContext'; // To get current user for "isBooked" logic
import Button from '../../components/common/Button';
import { AppRoles } from '../../config/AppRoles'; // Import your role enum
const EVENTS_PER_PAGE = 8; // Define items per page

const EventsPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user: currentUser, isAuthenticated } = useAuth(); // Get current user for booking info

    const [events, setEvents] = useState<FrontendEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Changed from 'loading'
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1); // Changed from 'page'
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]); // Renamed from selectedCategories

    const observer = useRef<IntersectionObserver | null>(null);
    const lastEventElementRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (isLoading) return;
            if (observer.current) observer.current.disconnect();

            observer.current = new IntersectionObserver(entries => {
                if (entries[0].isIntersecting && hasMore) {
                    console.log("Last event visible, fetching more...");
                    setCurrentPage(prevPage => prevPage + 1);
                }
            });

            if (node) observer.current.observe(node);
        },
        [isLoading, hasMore]
    );

    // Debounce search input
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500); // 500ms debounce
        return () => clearTimeout(handler);
    }, [searchQuery]);


    // Load events when page or filters change
    useEffect(() => {
        // Don't fetch if page is 1 due to filter change (handled by reset useEffect)
        if (currentPage === 1 && (debouncedSearchQuery !== '' || selectedCategoryIds.length > 0) && events.length > 0) {
            // This check is to prevent double fetch when filters change,
            // as the reset useEffect will set page to 1 and clear events.
            // However, if events are cleared, this won't stop the fetch.
            // The `isInitialLoadForFilters` ref below is a more robust way.
        }

        const fetchEvents = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Pass currentUserId and currentUserRole if your eventService and backend use them
                // for the 'isBooked' flag. The current eventService.getEvents doesn't take them.
                // This will be handled by the optionalAuthMiddleware and handler on backend.
                const response: PaginatedEventsApiResponse = await eventService.getEvents(
                    currentPage,
                    EVENTS_PER_PAGE,
                    debouncedSearchQuery,
                    selectedCategoryIds
                );

                setEvents(prevEvents => currentPage === 1 ? response.data : [...prevEvents, ...response.data]);
                setTotalItems(response.totalItems);
                setTotalPages(response.totalPages);
                setHasMore(response.currentPage < response.totalPages);

            } catch (err: any) {
                setError(err.message || t('events.loadError', 'Failed to load events.'));
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, [currentPage, debouncedSearchQuery, selectedCategoryIds, t]); // Removed 'events' from dependency array

    // Reset page to 1 and clear events when search or categories change
    const isInitialLoadForFilters = useRef(true);
    useEffect(() => {
        if (isInitialLoadForFilters.current) {
            isInitialLoadForFilters.current = false;
            return;
        }
        setCurrentPage(1);
        setEvents([]); // Clear events to trigger fetch for page 1 with new filters
        setHasMore(true); // Assume there might be more with new filters
    }, [debouncedSearchQuery, selectedCategoryIds]);


    const handleCategorySelect = (categoryIds: number[]) => {
        setSelectedCategoryIds(categoryIds);
    };

    const handleBookEvent = async (eventId: string | number) => { // eventId is string from DTO
        if (!isAuthenticated) {
            navigate('/login', { state: { from: location } }); // Redirect to login, save current location
            return;
        }
        if (currentUser?.role?.toString().toLocaleLowerCase() !== AppRoles.Customer.toString().toLocaleUpperCase()) {
            // Show some message or disable button for non-customers
            alert(t('events.bookingNotAllowed', 'Only customers can book events.'));
            return;
        }

        try {
            // Assuming eventId from EventSummary (string) needs to be number for service
            await eventService.bookEvent(Number(eventId));
            // Navigate to a booking confirmation page or update UI
            navigate(`/booking-confirmation/${eventId}`); // Or refresh events list to update isBooked
        } catch (error: any) {
            console.error('Error booking event:', error);
            setError(error.message || t('events.bookingError', 'Failed to book event.'));
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategoryIds([]);
        // Page will reset via useEffect for filter changes
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Page Title and Mobile Search (if CustomerLayout doesn't provide search) */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-text-primary dark:text-white">
                    {t('events.title', 'Upcoming Events')}
                </h1>
                {/* Search bar for larger screens can be here or in CustomerHeader */}
                {/* <div className="hidden md:block relative w-full sm:w-auto"> ... search input ... </div> */}
            </div>
            
            {/*
                Assuming your CustomerLayout includes:
                - A <header> with global search (that sets searchQuery via context or prop drilling)
                - A <CustomerSidebar onCategoryChange={handleCategorySelect} />
                If not, you'll need to add these components here or manage search/category state differently.
            */}

            {/* For testing category filter directly on this page (remove if sidebar handles it) */}
            {/* <div>
                <p>Test Categories (Select IDs, comma-separated):</p>
                <input type="text" onChange={(e) => {
                    const ids = e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                    handleCategorySelect(ids);
                }} placeholder="e.g., 1,2,3"
                className="border p-2 dark:bg-gray-700 dark:text-white"
                />
            </div> */}


            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                    <p className="font-bold">{t('common.error', 'Error')}</p>
                    <p>{error}</p>
                </div>
            )}

            {(searchQuery || selectedCategoryIds.length > 0) && !isLoading && (
                <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900/20 rounded-md">
                    <span className="text-sm text-primary-700 dark:text-primary-300">
                        {totalItems} {t('common.resultsFound', 'results found')}
                        {searchQuery && <span> {t('common.for', 'for')} "{searchQuery}"</span>}
                        {selectedCategoryIds.length > 0 && <span> {t('common.inSelectedCategories', 'in selected categories')}</span>}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                    >
                        <FilterX size={16} className="mr-1 rtl:ml-1 rtl:mr-0" />
                        {t('common.clearFilters', 'Clear Filters')}
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {isLoading && currentPage === 1 && events.length === 0 && ( // Initial loading skeletons
                    Array.from({ length: EVENTS_PER_PAGE }).map((_, index) => (
                        <div key={`skeleton-${index}`} className="bg-white dark:bg-slate-800 shadow-lg rounded-lg overflow-hidden animate-pulse">
                            <div className="h-48 bg-gray-300 dark:bg-slate-700"></div>
                            <div className="p-4 space-y-3">
                                <div className="h-6 bg-gray-300 dark:bg-slate-700 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-5/6"></div>
                                <div className="h-10 bg-gray-400 dark:bg-slate-600 rounded mt-4"></div>
                            </div>
                        </div>
                    ))
                )}

                {events.map((event, index) => {
                    if (events.length === index + 1 && hasMore && !isLoading) { // Last element for observer
                        return (
                            <div ref={lastEventElementRef} key={event.id}>
                                <EventCard event={event} onBook={() => handleBookEvent(event.id)} />
                            </div>
                        );
                    }
                    return (
                        <EventCard key={event.id} event={event} onBook={() => handleBookEvent(event.id)} />
                    );
                })}
            </div>

            {isLoading && currentPage > 1 && ( // Loading more indicator
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
                    <p className="ml-2 text-text-secondary dark:text-gray-400">{t('common.loadingMore', 'Loading more events...')}</p>
                </div>
            )}

            {!isLoading && events.length === 0 && totalItems === 0 && (
                <div className="text-center py-12">
                    <img src="/placeholder-no-events.svg" alt={t('common.noEventsFound', 'No Events Found')} className="mx-auto h-40 mb-6 opacity-70" />
                    <p className="text-xl text-gray-500 dark:text-gray-400">
                        {t('common.noEventsFound', 'No events match your criteria.')}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500 mt-2">
                        {t('common.tryAdjustingFilters', 'Try adjusting your search or filters, or check back later!')}
                    </p>
                </div>
            )}

             {!isLoading && events.length > 0 && !hasMore && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {t('common.endOfResults', "You've reached the end of the events list.")}
                </p>
            )}
        </div>
    );
};

export default EventsPage;