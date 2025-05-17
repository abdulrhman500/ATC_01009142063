import api from './api'; // Your configured Axios instance

// Interface for the venue data as expected by the frontend from the API.
// This should align with your backend's VenueResponseDto.
export interface VenueSummary { // Renamed from FrontendVenue for clarity as a summary/list item
    id: number;       // Assuming ID is number in VenueResponseDto
    name: string;
    street: string;
    city: string;
    state: string;    // Mandatory as per your last schema update
    country: string;
    postalCode?: string;
    placeUrl?: string;
}

// Interface for the actual API response structure from GET /venues
// if it's wrapped in your standard ResponseEntity
interface GetAllVenuesApiResponse {
    data: VenueSummary[];
    // If your GET /venues becomes paginated in the future, add pagination fields here:
    // totalItems?: number;
    // currentPage?: number;
    // itemsPerPage?: number;
    // totalPages?: number;
}

// Assuming your backend wraps responses in a standard structure like ResponseEntity
interface ApiResponseEntity<T> {
    statusCode: number;
    message: string;
    payload: T;
}

const VENUES_API_PATH = '/venues'; // Relative to axios baseURL (e.g., /api/v1)

const venueService = {
    /**
     * Fetches all available venues.
     * This endpoint is currently ADMIN-only on the backend.
     * The 'api' instance will automatically send the admin token if an admin is logged in.
     */
    getAllVenues: async (): Promise<GetAllVenuesApiResponse> => {
        try {
            // Assuming the backend returns ResponseEntity<GetAllVenuesResponseDto>
            // where GetAllVenuesResponseDto is { data: VenueSummary[] }
            const response = await api.get<ApiResponseEntity<GetAllVenuesApiResponse>>(VENUES_API_PATH);
            return response.data.payload;
        } catch (error: any) {
            console.error('Failed to fetch venues:', error);
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error('Failed to load venues. Please try again later.');
        }
    },

    /**
     * Fetches a single venue by its ID.
     * (Placeholder - implement when GET /venues/:id backend endpoint is ready)
     */
    getVenueById: async (id: number): Promise<VenueSummary | null> => {
        console.warn(`getVenueById(${id}) - Not yet implemented with real API call.`);
        // Example:
        // try {
        //     const response = await api.get<ApiResponseEntity<VenueSummary>>(`${VENUES_API_PATH}/${id}`);
        //     return response.data.payload;
        // } catch (error: any) {
        //     if (error.response && error.response.status === 404) return null;
        //     console.error(`Failed to fetch venue ${id}:`, error);
        //     throw new Error(error.response?.data?.message || `Failed to load venue ${id}.`);
        // }
        return null;
    },

    /**
     * Creates a new venue.
     * (Placeholder - implement when POST /venues backend endpoint is ready, if needed by a dedicated venue management UI)
     * Your EventFormModal currently takes venueId, so direct venue creation might be separate.
     * The CreateEvent test suite already has a createVenue helper using prisma.upsert for testing.
     * This service method would be for UI-driven venue creation.
     */
    createVenue: async (venueData: Omit<VenueSummary, 'id'>): Promise<VenueSummary> => {
        console.warn(`createVenue - Not yet implemented with real API call.`);
    try {
        const response = await api.post<ApiResponseEntity<VenueSummary>>(VENUES_API_PATH, venueData);
        return response.data.payload;
    } catch (error: any) {
        if (error.response && error.response.data) throw error.response.data;
        throw new Error(error.message || 'Failed to create venue.');
    }
        return {} as VenueSummary; // Placeholder
    },

    // Add updateVenue and deleteVenue methods here when needed for full venue CRUD.
};

export default venueService;