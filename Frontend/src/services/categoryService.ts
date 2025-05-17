import api from './api'; // Your configured Axios instance

// --- Frontend Interfaces for Category Data (align with backend DTOs) ---

// Represents a category node in a tree structure (matches backend's CategoryTreeNodeDto)
export interface FrontendCategoryNode {
    id: string; // IDs are strings from backend DTOs
    name: string;
    parentId: string | null;
    children: FrontendCategoryNode[];
}

// Represents a single category, often used in lists or for details (matches backend's CategorySummaryResponseDto)
export interface FrontendCategory {
    id: string;
    name: string;
    parentCategoryId: string | null; // Backend might send parentId
    childrenCount?: number; // If backend CategorySummaryResponseDto includes this
    // 'children' might not be part of a flat list summary, but is part of FrontendCategoryNode
}

// For creating a category (matches backend's CreateCategoryRequestDto)
export interface CreateCategoryData {
    name: string;
    parentCategoryId?: number | null; // Backend typically takes numeric ID for FK
}

// For updating a category (matches backend's UpdateCategoryRequestDto)
export interface UpdateCategoryData {
    name?: string;
    parentCategoryId?: number | null;
}

// Expected structure for paginated categories from GET /categories
export interface PaginatedCategoriesApiResponse {
    data: FrontendCategory[]; // Array of category summaries
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
}

// Assuming your backend wraps responses in a standard structure like ResponseEntity
interface ApiResponseEntity<T> {
    statusCode: number;
    message: string;
    payload: T;
}

const CATEGORY_API_PATH = '/category'; // Relative to axios baseURL (e.g., /api/v1)

// Helper function to build category tree from flat list
const buildCategoryTree = (categories: FrontendCategory[]): FrontendCategoryNode[] => {
    const categoryMap: Record<string, FrontendCategoryNode> = {};
    const rootCategories: FrontendCategoryNode[] = [];
    
    // First pass: Create node objects and store in map
    categories.forEach(category => {
        categoryMap[category.id] = {
            id: category.id,
            name: category.name,
            parentId: category.parentCategoryId,
            children: []
        };
    });
    
    // Second pass: Link children to parents
    categories.forEach(category => {
        const node = categoryMap[category.id];
        
        if (category.parentCategoryId && categoryMap[category.parentCategoryId]) {
            // If has parent, add to parent's children
            categoryMap[category.parentCategoryId].children.push(node);
        } else {
            // If no parent or parent not found, add to root
            rootCategories.push(node);
        }
    });
    
    return rootCategories;
};

const categoryService = {
    /**
     * Get all categories (paginated flat list).
     * The backend /categories endpoint should support pagination.
     */
    getAllCategories: async (page: number = 1, limit: number = 100): Promise<PaginatedCategoriesApiResponse> => {
        try {
            const response = await api.get<ApiResponseEntity<PaginatedCategoriesApiResponse>>(CATEGORY_API_PATH, {
                params: { page, limit }
            });
            return response.data.payload;
        } catch (error: any) {
            console.error('Failed to fetch categories:', error);
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error('Failed to load categories.');
        }
    },

    /**
     * Get category tree (for rendering hierarchy).
     * This now tries the tree endpoint first, and falls back to building tree from getAllCategories if needed.
     */
    getCategoryTree: async (): Promise<FrontendCategoryNode[]> => {
        try {
            try {
                // First try the dedicated tree endpoint
                const response = await api.get<ApiResponseEntity<{ data: FrontendCategoryNode[] }>>(`${CATEGORY_API_PATH}/tree`);
                return response.data.payload.data;
            } catch (treeError) {
                console.warn('Category tree endpoint failed, falling back to building tree from flat list:', treeError);
                
                // Fallback: Get all categories and build tree manually
                const categoriesResponse = await categoryService.getAllCategories(1, 500);
                return buildCategoryTree(categoriesResponse.data);
            }
        } catch (error: any) {
            console.error('Failed to fetch category tree:', error);
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error('Failed to load category tree.');
        }
    },

    /**
     * Get a single category by its ID.
     */
    getCategoryById: async (id: string | number): Promise<FrontendCategory | null> => {
        try {
            const response = await api.get<ApiResponseEntity<FrontendCategory>>(`${CATEGORY_API_PATH}/${id}`);
            return response.data.payload;
        } catch (error: any) {
            console.error(`Failed to fetch category ${id}:`, error);
            if (error.response && error.response.status === 404) {
                return null; // Or throw a specific NotFoundError
            }
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message);
            }
            throw new Error(`Failed to load category ${id}.`);
        }
    },

    /**
     * Create a new category (admin only).
     * The 'api' instance should automatically send the admin token if user is logged in.
     */
    createCategory: async (categoryData: CreateCategoryData): Promise<FrontendCategory> => {
        try {
            const response = await api.post<ApiResponseEntity<FrontendCategory>>(CATEGORY_API_PATH, categoryData);
            return response.data.payload;
        } catch (error: any) {
            console.error('Failed to create category:', error);
            if (error.response && error.response.data) {
                throw error.response.data; // Re-throw structured error
            }
            throw new Error('Failed to create category.');
        }
    },

    /**
     * Update an existing category (admin only).
     */
    updateCategory: async (id: string | number, categoryData: UpdateCategoryData): Promise<FrontendCategory> => {
        try {
            const response = await api.patch<ApiResponseEntity<FrontendCategory>>(`${CATEGORY_API_PATH}/${id}`, categoryData);
            return response.data.payload;
        } catch (error: any) {
            console.error(`Failed to update category ${id}:`, error);
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw new Error(`Failed to update category ${id}.`);
        }
    },

    /**
     * Delete a category (admin only).
     * Backend handles reassigning events/children.
     */
    deleteCategory: async (id: string | number): Promise<void> => {
        try {
            await api.delete<ApiResponseEntity<null>>(`${CATEGORY_API_PATH}/${id}`);
        } catch (error: any) {
            console.error(`Failed to delete category ${id}:`, error);
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw new Error(`Failed to delete category ${id}.`);
        }
    }
};

export default categoryService;