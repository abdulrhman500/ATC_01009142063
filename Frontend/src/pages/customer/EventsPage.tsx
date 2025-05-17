import React, { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import eventService, { FrontendEvent, PaginatedEventsApiResponse } from '../../services/eventService';
import CustomerSidebar from '../../components/customer/CustomerSidebar'; // <<< IMPORT THE SIDEBAR
import EventCard from '../../components/customer/EventCard';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    Search,
    FilterX,
    Loader2,
    AlertTriangle,
    RefreshCw,
    ChevronUp,
    FilterIcon,
    XCircle,
    // Calendar // No longer needed here if EventCard handles it
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AppRoles } from '../../config/AppRoles';
import { motion, AnimatePresence } from 'framer-motion';

const EVENTS_PER_PAGE = 8;

// EventCardSkeleton (keep as you defined it previously)
const EventCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 dim:bg-slate-700 rounded-xl shadow-lg overflow-hidden h-full animate-pulse">
        <div className="h-48 bg-gray-300 dark:bg-slate-700 dim:bg-slate-600"></div>
        <div className="p-5 space-y-3">
            <div className="h-6 bg-gray-300 dark:bg-slate-700 dim:bg-slate-600 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 dark:bg-slate-700 dim:bg-slate-600 rounded w-1/2"></div>
            <div className="h-10 bg-gray-300 dark:bg-slate-700 dim:bg-slate-600 rounded"></div>
            <div className="h-8 bg-gray-400 dark:bg-slate-600 dim:bg-slate-500 rounded mt-4"></div>
        </div>
    </div>
);


const EventsPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser, isAuthenticated } = useAuth();

    const [events, setEvents] = useState<FrontendEvent[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [eventsError, setEventsError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const [searchQueryInput, setSearchQueryInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]); // String IDs

    const contentRef = useRef<HTMLDivElement>(null);
    const observer = useRef<IntersectionObserver | null>(null);
    const isCustomer = currentUser?.role?.toString().toLocaleLowerCase() === AppRoles.Customer.toString().toLocaleLowerCase();

    const lastEventElementRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoadingEvents) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setCurrentPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoadingEvents, hasMore]);

    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 400);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    useEffect(() => {
        const handler = setTimeout(() => setSearchQuery(searchQueryInput), 500);
        return () => clearTimeout(handler);
    }, [searchQueryInput]);

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoadingEvents(true);
            try {
                // eventService.getEvents expects categoryIds as string[]
                const response = await eventService.getEvents(
                    currentPage, EVENTS_PER_PAGE, searchQuery, selectedCategoryIds
                );
                setEvents(prevEvents => currentPage === 1 ? response.data : [...prevEvents, ...response.data]);
                setTotalItems(response.totalItems);
                setTotalPages(response.totalPages);
                setHasMore(response.currentPage < response.totalPages);
                if (response.data.length > 0 || currentPage === 1) setEventsError(null); // Clear error if data is fetched or it's a fresh filter
            } catch (err: any) {
                setEventsError(err.message || t('events.loadError', 'Failed to load events.'));
                if (currentPage === 1) setEvents([]);
            } finally {
                setIsLoadingEvents(false);
            }
        };
        fetchEvents();
    }, [currentPage, searchQuery, selectedCategoryIds, t]);

    const isInitialFilterChange = useRef(true);
    useEffect(() => {
        if (isInitialFilterChange.current) {
            isInitialFilterChange.current = false;
            return;
        }
        setCurrentPage(1);
        setEvents([]);
        setHasMore(true);
    }, [searchQuery, selectedCategoryIds]);

    const handleSelectedCategoriesChange = useCallback((newSelectedIds: string[]) => {
      setSelectedCategoryIds(newSelectedIds);
      setCurrentPage(1); // Resetting page is now handled by the useEffect watching selectedCategoryIds
      setEvents([]);
      setHasMore(true);
  }, [setSelectedCategoryIds]); // Add setSelectedCategoryIds i

    const handleBookEvent = async (eventId: string) => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: location } }); return;
        }
        if (!isCustomer) {
            alert(t('events.bookingNotAllowed', 'Only customers can book events.')); return;
        }
        try {
            await eventService.bookEvent(Number(eventId));
            navigate(`/booking-confirmation/${eventId}`);
        } catch (error: any) {
            setEventsError(error.message || t('events.bookingError', 'Failed to book event.'));
        }
    };
    
    const clearAllFilters = () => {
        setSearchQueryInput('');
        setSelectedCategoryIds([]);
        // The useEffect watching searchQuery and selectedCategoryIds will handle resetting page and events.
    };

    const retryLoadEvents = () => {
        setEventsError(null); // Clear error before retrying
        if (currentPage !== 1) {
            setCurrentPage(1); 
            setEvents([]); // This will trigger the fetch useEffect
        } else {
            // Manually trigger fetch if already on page 1 and an error occurred
             const fetchAgain = async () => {
                setIsLoadingEvents(true); setEventsError(null);
                try {
                    const response = await eventService.getEvents(1, EVENTS_PER_PAGE, searchQuery, selectedCategoryIds);
                    setEvents(response.data); setTotalItems(response.totalItems);
                    setTotalPages(response.totalPages); setHasMore(response.currentPage < response.totalPages);
                } catch (e: any) { setEventsError(e.message || 'Failed to load'); }
                finally { setIsLoadingEvents(false); }
             };
             fetchAgain();
        }
    };
    return (
      <div className="flex flex-col lg:flex-row container mx-auto px-4 py-6 gap-6" ref={contentRef} tabIndex={-1}>
        
        {/* Sidebar */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-24 self-start space-y-6">
          <CustomerSidebar
            onCategorySelectionChange={handleSelectedCategoriesChange}
            initialSelectedCategoryIds={selectedCategoryIds}
          />
        </aside>
    
        {/* Main Content */}
        <main className="flex-1 space-y-6">
          {/* Search + Filters Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:max-w-md">
              <Input
                type="text"
                placeholder={t('common.searchEvents', 'Search events by name or description...')}
                value={searchQueryInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQueryInput(e.target.value)}
                leftIcon={<Search size={18} className="text-gray-400 dark:text-gray-500" />}
                className="w-full"
                aria-label={t('common.searchEvents', 'Search events')}
              />
              {searchQueryInput && (
                <button
                  onClick={() => setSearchQueryInput('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={t('common.clearSearch', 'Clear search')}
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>
    
            {(searchQuery || selectedCategoryIds.length > 0) && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <FilterX size={14} className="mr-2 rtl:ml-2 rtl:mr-0" />
                {t('common.clearFilters', 'Clear Filters')}
              </Button>
            )}
          </div>
    
          {/* Events List */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((event, index) => {
              const isLast = events.length === index + 1;
              return (
                <div
                  key={event.id}
                  ref={isLast ? lastEventElementRef : undefined}
                  className="h-full"
                >
                  <EventCard event={event} onBook={handleBookEvent} />
                </div>
              );
            })}
    
            {/* Skeletons */}
            {isLoadingEvents && Array.from({ length: EVENTS_PER_PAGE }).map((_, i) => (
              <EventCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
    
          {/* Error or Empty State */}
          {!isLoadingEvents && events.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center text-gray-600 dark:text-gray-300 py-10">
              <AlertTriangle size={32} className="mb-2" />
              <p>{t('events.noEventsFound', 'No events found')}</p>
              <Button onClick={retryLoadEvents} className="mt-4">
                <RefreshCw size={16} className="mr-2" />
                {t('common.retry', 'Retry')}
              </Button>
            </div>
          )}
    
          {/* Scroll to Top */}
          <AnimatePresence>
            {showScrollTop && (
              <motion.button
                onClick={scrollToTop}
                className="fixed bottom-8 right-6 z-50 bg-primary-600 text-white p-2 rounded-full shadow-lg hover:bg-primary-700 transition"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                aria-label={t('common.scrollToTop', 'Scroll to top')}
              >
                <ChevronUp size={20} />
              </motion.button>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
    
};

export default EventsPage;