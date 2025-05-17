import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import eventService, { Event } from '../../services/eventService';
import EventCard from '../../components/customer/EventCard';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const EventsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  
  const observer = useRef<IntersectionObserver>();
  const lastEventElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prevPage => prevPage + 1);
        }
      });
      
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );
  
  // Load events when page, search, or categories change
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const { events: newEvents, total } = await eventService.getEvents(
          page,
          8,
          searchQuery,
          selectedCategories
        );
        
        if (page === 1) {
          setEvents(newEvents);
        } else {
          setEvents(prev => [...prev, ...newEvents]);
        }
        
        setHasMore(events.length + newEvents.length < total);
        setError(null);
      } catch (err) {
        setError('Failed to load events');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [page, searchQuery, selectedCategories]);
  
  // Reset page when search or categories change
  useEffect(() => {
    setPage(1);
    setEvents([]);
  }, [searchQuery, selectedCategories]);
  
  // Handle category selection from sidebar
  const handleCategorySelect = (categoryIds: number[]) => {
    setSelectedCategories(categoryIds);
  };
  
  // Handle event booking
  const handleBookEvent = async (eventId: number) => {
    try {
      await eventService.bookEvent(eventId);
      navigate(`/booking-confirmation/${eventId}`);
    } catch (error) {
      console.error('Error booking event:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('events.title')}</h1>
        
        {/* Mobile search */}
        <div className="md:hidden relative">
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 rtl:pr-9 rtl:pl-3 pr-3 rounded-md border border-border bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
          <Search size={16} className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-text-tertiary" />
        </div>
      </div>
      
      {error && (
        <div className="bg-error-50 text-error-700 p-4 rounded-md">
          {error}
        </div>
      )}
      
      {/* Event grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {events.map((event, index) => {
          if (events.length === index + 1) {
            return (
              <div ref={lastEventElementRef} key={event.id}>
                <EventCard event={event} onBook={handleBookEvent} />
              </div>
            );
          } else {
            return (
              <EventCard key={event.id} event={event} onBook={handleBookEvent} />
            );
          }
        })}
        
        {/* Loading placeholders */}
        {loading && page === 1 && (
          Array(4).fill(0).map((_, index) => (
            <div key={`skeleton-${index}`} className="card animate-pulse">
              <div className="h-40 bg-bg-accent"></div>
              <div className="p-4">
                <div className="h-6 bg-bg-accent rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-bg-accent rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-bg-accent rounded mb-4"></div>
                <div className="h-4 bg-bg-accent rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-bg-accent rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-bg-accent rounded"></div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Loading more indicator */}
      {loading && page > 1 && (
        <div className="text-center p-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-200 border-t-primary-600"></div>
          <p className="mt-2 text-text-secondary">{t('common.loading')}</p>
        </div>
      )}
      
      {/* No results */}
      {!loading && events.length === 0 && (
        <div className="text-center p-12 bg-bg-accent rounded-md">
          <p className="text-text-secondary text-lg">{t('common.noResults')}</p>
        </div>
      )}
    </div>
  );
};

export default EventsPage;