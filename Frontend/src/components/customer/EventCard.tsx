import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Event } from '../../services/eventService';
import { Calendar, MapPin } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';

interface EventCardProps {
  event: Event;
  onBook?: (eventId: number) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onBook }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const handleViewDetails = () => {
    navigate(`/events/${event.id}`);
  };
  
  const handleBook = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (onBook) {
      onBook(event.id);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(navigator.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  return (
    <div 
      className="card overflow-hidden transition-transform duration-200 hover:shadow-md hover:-translate-y-1 cursor-pointer"
      onClick={handleViewDetails}
    >
      {/* Event image */}
      <div className="h-40 overflow-hidden bg-bg-secondary">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900">
            <span className="text-primary-600 dark:text-primary-400 text-lg">{event.title[0]}</span>
          </div>
        )}
      </div>
      
      {/* Event details */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{event.title}</h3>
            <p className="text-text-tertiary text-sm mt-1 mb-2">{event.category.name}</p>
          </div>
        </div>
        
        <p className="text-text-secondary text-sm line-clamp-2 mb-3 h-10">
          {event.description}
        </p>
        
        <div className="flex items-center text-text-tertiary text-xs mb-3">
          <Calendar size={14} className="mr-1 rtl:ml-1 rtl:mr-0" />
          <span>{formatDate(event.date)} • {event.time}</span>
        </div>
        
        <div className="flex items-center text-text-tertiary text-xs mb-4">
          <MapPin size={14} className="mr-1 rtl:ml-1 rtl:mr-0" />
          <span className="line-clamp-1">{event.venue.name}, {event.venue.city}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <Button
            variant={event.isBooked ? 'outline' : 'primary'}
            size="sm"
            disabled={event.isBooked}
            onClick={handleBook}
            className="w-full"
          >
            {event.isBooked ? t('common.booked') : t('common.book')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;