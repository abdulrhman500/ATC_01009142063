import api from './api'; // Your configured Axios instance

export interface EventSummary {
  id: string; // Backend DTO ID is string
  name: string; // Was 'title' in your mock, backend uses 'name'
  descriptionShort: string;
  date: string; // ISO date string from backend
  // time: string; // Backend DTO combines date and time in the 'date' ISO string
  venueName: string;
  price: string; // e.g., "50.00 USD"
  photoUrl: string; // Was 'imageUrl' in your mock
  categoryName?: string;
  isBooked: boolean;
  // venueId and categoryId might not be needed if venueName and categoryName are present
  // venue?: any; // If you want to keep the full venue object from mock, backend DTO has venueName
  // category?: any; // If you want to keep the full category object from mock, backend DTO has categoryName
}

// This interface should match your backend's GetAllEventsResponseDto (the payload part)
export interface PaginatedEventsApiResponse {
  data: EventSummary[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

// Interface for the actual API response if wrapped in ResponseEntity
interface ApiResponseEntity<T> {
  statusCode: number;
  message: string;
  payload: T;
}

const EVENTS_API_PATH = '/events'; // Relative to axios baseURL (e.g., /api/v1)

const eventService = {
  getEvents: async (
    page: number = 1,
    limit: number = 8, // Default limit as used in your EventsPage
    textSearch?: string,
    categoryIds?: string[],
    categoryNames?: string[] // Added for completeness, though EventsPage doesn't use it yet
  ): Promise<PaginatedEventsApiResponse> => {
    const params: Record<string, any> = {
      page,
      limit,
    };
    if (textSearch && textSearch.trim() !== '') {
      params.textSearch = textSearch.trim();
    }
    if (categoryIds && categoryIds.length > 0) {
      params.categoryIds = categoryIds.join(','); // Join string array
    }
    if (categoryNames && categoryNames.length > 0) {
      params.categoryNames = categoryNames.join(','); // Backend expects comma-separated string
    }

    try {
      const response = await api.get<ApiResponseEntity<PaginatedEventsApiResponse>>(
        EVENTS_API_PATH,
        { params }
      );
      return response.data.payload; // Assuming backend uses ResponseEntity with a 'payload' field
    } catch (error: any) {
      console.error('Failed to fetch events:', error);
      // Re-throw a more generic error or the error data from backend if available
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch events. Please try again later.');
    }
  },

  // --- Other event service methods to be implemented with real API calls ---
  getEvent: async (id: number): Promise<EventSummary | null> => {
    // TODO: Implement API call to GET /events/:id
    console.warn(`getEvent(${id}) is using mock implementation.`);
    // Placeholder:
    // const response = await api.get<ApiResponseEntity<EventSummary>>(`${EVENTS_API_PATH}/${id}`);
    // return response.data.payload;
    return null; // Replace with actual implementation
  },

  createEvent: async (eventData: any): Promise<EventSummary> => {
    // TODO: Implement API call to POST /events (Admin only)
    console.warn(`createEvent is using mock implementation.`);
    // const response = await api.post<ApiResponseEntity<EventSummary>>(EVENTS_API_PATH, eventData);
    // return response.data.payload;
    throw new Error("Not implemented");
  },

  updateEvent: async (id: number, eventData: Partial<any>): Promise<EventSummary> => {
    // TODO: Implement API call to PUT/PATCH /events/:id (Admin only)
    console.warn(`updateEvent(${id}) is using mock implementation.`);
    throw new Error("Not implemented");
  },

  deleteEvent: async (id: number): Promise<void> => {
    // TODO: Implement API call to DELETE /events/:id (Admin only)
    console.warn(`deleteEvent(${id}) is using mock implementation.`);
    throw new Error("Not implemented");
  },

  bookEvent: async (eventId: number): Promise<void> => {
    // TODO: Implement API call to POST /events/:eventId/book (Customer only)
    // This endpoint needs to be created on the backend.
    console.warn(`bookEvent(${eventId}) is using mock implementation. Needs backend endpoint.`);
    // Example: await api.post(`${EVENTS_API_PATH}/${eventId}/book`);
    return new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
  },

  // getBookedEvents might not be needed if 'isBooked' comes with getEvents
};

export default eventService;

// Export the EventSummary type for use in components
export type { EventSummary as FrontendEvent };