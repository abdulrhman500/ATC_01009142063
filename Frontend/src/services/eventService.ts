import api from './api'; // Your configured Axios instance
import { AxiosError } from 'axios';

// --- Frontend Data Structures ---

// This interface should match the fields from your backend's EventSummaryResponseDto
export interface EventSummary {
  id: string;
  name: string;
  descriptionShort: string;
  date: string; // ISO date-time string from backend
  venueName: string;
  price: string; // Formatted price string, e.g., "50.00 USD"
  photoUrl: string; // Optional in schema, but EventSummaryResponseDto likely provides a default or makes it non-null
  categoryName?: string;
  isBooked: boolean; // Crucial for displaying booking status
  // Include other fields if your EventSummaryResponseDto sends more (e.g., original priceValue, currency)
  // For simplicity, we assume the above is what EventCard needs.
}

// For creating an event (matches backend's CreateEventRequestDto)
export interface CreateEventData {
  name: string;
  description: string;
  date: string; // ISO date-time string (e.g., from new Date().toISOString())
  venueId: number;
  categoryId?: number | null;
  priceValue: number;
  priceCurrency: string;
  photoUrl?: string | null;
}

// For updating an event (typically Partial of CreateEventData)
export interface UpdateEventData extends Partial<CreateEventData> { }


// For paginated list of events (matches backend's GetAllEventsResponseDto payload)
export interface PaginatedEventsApiResponse {
  data: EventSummary[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
}

// Standard API response wrapper used by your backend
interface ApiResponseEntity<T> {
  statusCode: number;
  message: string;
  payload: T;
}
const EVENTS_API_PATH = '/events';
const BOOKING_API_PATH = '/booking'; // Path for the BookingController


const eventService = {
  /**
   * Fetches a paginated and filtered list of events.
   */
  getEvents: async (
    page: number = 1,
    limit: number = 8,
    textSearch?: string,
    categoryIds?: string[], // Expects string array, joins to comma-separated for API
    categoryNames?: string[]
  ): Promise<PaginatedEventsApiResponse> => {
    const params: Record<string, any> = { page, limit };
    if (textSearch && textSearch.trim() !== '') {
      params.textSearch = textSearch.trim();
    }
    if (categoryIds && categoryIds.length > 0) {
      params.categoryIds = categoryIds.join(',');
    }
    if (categoryNames && categoryNames.length > 0) {
      params.categoryNames = categoryNames.join(',');
    }

    try {
      const response = await api.get<ApiResponseEntity<PaginatedEventsApiResponse>>(
        EVENTS_API_PATH,
        { params }
      );
      return response.data.payload;
    } catch (error: any) {
      console.error('Failed to fetch events:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to load events. Please try again later.');
    }
  },

  /**
   * Fetches a single event by its ID.
   */
  getEventById: async (id: string | number): Promise<EventSummary | null> => {
    try {
      const response = await api.get<ApiResponseEntity<EventSummary[]>>(`${EVENTS_API_PATH}?limit=50`);
      ;
      return response.data.payload.filter(event => event.id == id)[0];
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`Event with ID ${id} not found.`);
        return null;
      }
      console.error(`Failed to fetch event ${id}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.message || `Failed to load event ${id}.`);
    }
  },

  /**
   * Creates a new event. Requires ADMIN privileges.
   */
  createEvent: async (eventData: CreateEventData): Promise<EventSummary> => {
    try {
      const response = await api.post<ApiResponseEntity<EventSummary>>(EVENTS_API_PATH, eventData);
      return response.data.payload;
    } catch (error: any) {
      console.error('Failed to create event:', error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to create event.');
    }
  },

  /**
   * Updates an existing event. Requires ADMIN privileges.
   * Assumes backend uses PATCH for partial updates. Use PUT if it's a full replace.
   */
  updateEvent: async (id: string | number, eventData: UpdateEventData): Promise<EventSummary> => {
    try {
      // Ensure date is in ISO string format if being updated
      const payload = eventData.date ? { ...eventData, date: new Date(eventData.date).toISOString() } : eventData;

      const response = await api.patch<ApiResponseEntity<EventSummary>>(
        `${EVENTS_API_PATH}/${id}`,
        payload
      );
      return response.data.payload;
    } catch (error: any) {
      console.error(`Failed to update event ${id}:`, error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to update event.');
    }
  },

  /**
   * Deletes an event. Requires ADMIN privileges.
   */
  deleteEvent: async (id: string | number): Promise<void> => {
    try {
      await api.delete<ApiResponseEntity<null>>(`${EVENTS_API_PATH}/${id}`);
    } catch (error: any) {
      console.error(`Failed to delete event ${id}:`, error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to delete event.');
    }
  },

  /**
   * Books an event for the currently authenticated CUSTOMER.
   */
  bookEvent: async (eventId: string | number): Promise<void> => {
    // Ensure eventId is a number, as the corrected backend DTO will expect it.
    const numericEventId = typeof eventId === 'string' ? parseInt(eventId, 10) : eventId;

    if (isNaN(numericEventId) || numericEventId <= 0) {
      const errorMsg = 'Invalid Event ID provided for booking.';
      console.error(errorMsg);
      // Optionally, you can throw a more specific error type here if you have one
      throw new Error(errorMsg);
    }

    try {
      // The backend controller is POST /booking and expects { "eventId": number } in the body.
      // The response from backend for successful booking (201 Created) might contain the booking details
      // or just a success message. For Promise<void>, we don't use the response payload here.
      await api.post<ApiResponseEntity<any>>( // 'any' for payload as we don't use it for Promise<void>
        `${BOOKING_API_PATH}`, // Endpoint for creating a booking
        { eventId: numericEventId } // Send eventId in the request body
      );
      // If successful, the promise resolves.
    } catch (error: any) {
      const axiosError = error as AxiosError<ApiResponseEntity<null>>; // Type the error for better access
      const backendErrorMessage = axiosError.response?.data?.message;
      const errorMessage = backendErrorMessage || axiosError.message || 'Failed to book event.';

      console.error(`Failed to book event ${numericEventId}:`, errorMessage, axiosError.response?.data);
      throw new Error(errorMessage); // Re-throw with a potentially more user-friendly message or the backend message
    }
  }

  // getBookedEvents is likely not needed if `isBooked` flag comes with `getEvents`
  // for the authenticated user. If you need a separate list of only booked events,
  // a dedicated backend endpoint and service method would be required.
};

export default eventService;

// Re-export EventSummary as FrontendEvent for easier usage in components
export type { EventSummary as FrontendEvent };