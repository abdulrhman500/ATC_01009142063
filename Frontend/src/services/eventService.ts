import api from './api';

export interface Venue {
  id: number;
  name: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  placeUrl?: string;
}

export interface Category {
  id: number;
  name: string;
  parentCategoryId?: number;
  children?: Category[];
}

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  imageUrl?: string;
  venueId: number;
  venue: Venue;
  categoryId: number;
  category: Category;
  isBooked?: boolean;
}

// Mock data for development
const mockCategories: Category[] = [
  { id: 1, name: 'Music' },
  { id: 2, name: 'Sports', children: [
    { id: 3, name: 'Football' },
    { id: 4, name: 'Basketball' }
  ]},
  { id: 5, name: 'Art & Culture' },
  { id: 6, name: 'Technology', children: [
    { id: 7, name: 'Web Development' },
    { id: 8, name: 'Data Science' }
  ]}
];

const mockVenues: Venue[] = [
  { id: 1, name: 'Downtown Arena', street: '123 Main St', city: 'New York', state: 'NY', country: 'USA', postalCode: '10001' },
  { id: 2, name: 'Tech Convention Center', street: '456 Tech Blvd', city: 'San Francisco', state: 'CA', country: 'USA', postalCode: '94103' },
  { id: 3, name: 'Cultural Palace', street: '789 Art Ave', city: 'Chicago', state: 'IL', country: 'USA', postalCode: '60611' }
];

// Generate 20 mock events
const generateMockEvents = (): Event[] => {
  return Array(20).fill(0).map((_, index) => {
    const categoryIndex = index % mockCategories.length;
    const venueIndex = index % mockVenues.length;
    const date = new Date();
    date.setDate(date.getDate() + index);
    
    return {
      id: index + 1,
      title: `Event ${index + 1}`,
      description: `This is a description for Event ${index + 1}. It's a wonderful event you shouldn't miss!`,
      date: date.toISOString().split('T')[0],
      time: '18:00',
      imageUrl: `https://source.unsplash.com/random/800x600?event&sig=${index}`,
      venueId: mockVenues[venueIndex].id,
      venue: mockVenues[venueIndex],
      categoryId: mockCategories[categoryIndex].id,
      category: mockCategories[categoryIndex],
      isBooked: false
    };
  });
};

let mockEvents = generateMockEvents();
let mockBookings: number[] = [];

const eventService = {
  // Get events with pagination and filters
  getEvents: async (
    page = 1, 
    limit = 10, 
    search = '', 
    categoryIds: number[] = []
  ): Promise<{ events: Event[], total: number }> => {
    // In a real app, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredEvents = [...mockEvents];
        
        // Apply search filter
        if (search) {
          const searchLower = search.toLowerCase();
          filteredEvents = filteredEvents.filter(event => 
            event.title.toLowerCase().includes(searchLower) || 
            event.description.toLowerCase().includes(searchLower)
          );
        }
        
        // Apply category filter
        if (categoryIds.length > 0) {
          filteredEvents = filteredEvents.filter(event => 
            categoryIds.includes(event.categoryId)
          );
        }
        
        // Apply booking status
        filteredEvents = filteredEvents.map(event => ({
          ...event,
          isBooked: mockBookings.includes(event.id)
        }));
        
        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedEvents = filteredEvents.slice(startIndex, endIndex);
        
        resolve({
          events: paginatedEvents,
          total: filteredEvents.length
        });
      }, 500);
    });
  },
  
  // Get a single event by ID
  getEvent: async (id: number): Promise<Event | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const event = mockEvents.find(e => e.id === id);
        if (event) {
          resolve({
            ...event,
            isBooked: mockBookings.includes(event.id)
          });
        } else {
          resolve(null);
        }
      }, 300);
    });
  },
  
  // Create a new event (admin only)
  createEvent: async (eventData: Omit<Event, 'id' | 'venue' | 'category'>): Promise<Event> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newId = Math.max(...mockEvents.map(e => e.id)) + 1;
        const venue = mockVenues.find(v => v.id === eventData.venueId)!;
        const category = mockCategories.find(c => c.id === eventData.categoryId)!;
        
        const newEvent: Event = {
          ...eventData,
          id: newId,
          venue,
          category,
          isBooked: false
        };
        
        mockEvents.push(newEvent);
        resolve(newEvent);
      }, 500);
    });
  },
  
  // Update an existing event (admin only)
  updateEvent: async (id: number, eventData: Partial<Event>): Promise<Event> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockEvents.findIndex(e => e.id === id);
        
        if (index === -1) {
          reject(new Error('Event not found'));
          return;
        }
        
        // Update the event
        const updatedEvent: Event = {
          ...mockEvents[index],
          ...eventData,
        };
        
        // Update venue and category references if IDs changed
        if (eventData.venueId && eventData.venueId !== mockEvents[index].venueId) {
          const venue = mockVenues.find(v => v.id === eventData.venueId);
          if (venue) updatedEvent.venue = venue;
        }
        
        if (eventData.categoryId && eventData.categoryId !== mockEvents[index].categoryId) {
          const category = mockCategories.find(c => c.id === eventData.categoryId);
          if (category) updatedEvent.category = category;
        }
        
        mockEvents[index] = updatedEvent;
        resolve(updatedEvent);
      }, 500);
    });
  },
  
  // Delete an event (admin only)
  deleteEvent: async (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockEvents.findIndex(e => e.id === id);
        
        if (index === -1) {
          reject(new Error('Event not found'));
          return;
        }
        
        mockEvents.splice(index, 1);
        resolve();
      }, 500);
    });
  },
  
  // Book an event (customer only)
  bookEvent: async (eventId: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!mockEvents.some(e => e.id === eventId)) {
          reject(new Error('Event not found'));
          return;
        }
        
        // Add to bookings if not already booked
        if (!mockBookings.includes(eventId)) {
          mockBookings.push(eventId);
        }
        
        resolve();
      }, 500);
    });
  },
  
  // Get user's booked events (customer only)
  getBookedEvents: async (): Promise<Event[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const bookedEvents = mockEvents
          .filter(event => mockBookings.includes(event.id))
          .map(event => ({
            ...event,
            isBooked: true
          }));
        
        resolve(bookedEvents);
      }, 500);
    });
  }
};

export default eventService;