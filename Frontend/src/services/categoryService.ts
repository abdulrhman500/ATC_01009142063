import api from './api';
import { Category } from './eventService';

// Mock categories with hierarchical structure
const mockCategories: Category[] = [
  { id: 1, name: 'Music' },
  { id: 2, name: 'Sports', parentCategoryId: undefined },
  { id: 3, name: 'Football', parentCategoryId: 2 },
  { id: 4, name: 'Basketball', parentCategoryId: 2 },
  { id: 5, name: 'Art & Culture' },
  { id: 6, name: 'Technology' },
  { id: 7, name: 'Web Development', parentCategoryId: 6 },
  { id: 8, name: 'Data Science', parentCategoryId: 6 },
  { id: 9, name: 'Food & Drink' },
  { id: 10, name: 'Concerts', parentCategoryId: 1 },
  { id: 11, name: 'Classical', parentCategoryId: 10 },
  { id: 12, name: 'Jazz', parentCategoryId: 10 },
];

// Function to build category tree
const buildCategoryTree = (categories: Category[]): Category[] => {
  const categoryMap: Record<number, Category> = {};
  const rootCategories: Category[] = [];
  
  // First pass: create a map of categories by ID
  categories.forEach(category => {
    categoryMap[category.id] = { ...category, children: [] };
  });
  
  // Second pass: build the tree
  categories.forEach(category => {
    if (category.parentCategoryId) {
      // This is a child category, add it to its parent's children
      const parent = categoryMap[category.parentCategoryId];
      if (parent && parent.children) {
        parent.children.push(categoryMap[category.id]);
      }
    } else {
      // This is a root category
      rootCategories.push(categoryMap[category.id]);
    }
  });
  
  return rootCategories;
};

const categoryService = {
  // Get all categories
  getCategories: async (): Promise<Category[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockCategories]);
      }, 300);
    });
  },
  
  // Get category tree (for rendering hierarchy)
  getCategoryTree: async (): Promise<Category[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tree = buildCategoryTree(mockCategories);
        resolve(tree);
      }, 300);
    });
  },
  
  // Get a single category by ID
  getCategory: async (id: number): Promise<Category | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const category = mockCategories.find(c => c.id === id);
        resolve(category || null);
      }, 200);
    });
  },
  
  // Create a new category (admin only)
  createCategory: async (categoryData: Omit<Category, 'id'>): Promise<Category> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newId = Math.max(...mockCategories.map(c => c.id)) + 1;
        
        const newCategory: Category = {
          ...categoryData,
          id: newId
        };
        
        mockCategories.push(newCategory);
        resolve(newCategory);
      }, 500);
    });
  },
  
  // Update an existing category (admin only)
  updateCategory: async (id: number, categoryData: Partial<Category>): Promise<Category> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockCategories.findIndex(c => c.id === id);
        
        if (index === -1) {
          reject(new Error('Category not found'));
          return;
        }
        
        // Prevent circular references
        if (categoryData.parentCategoryId === id) {
          reject(new Error('Category cannot be its own parent'));
          return;
        }
        
        // Check if new parent would create a cycle
        if (categoryData.parentCategoryId) {
          let currentParent = categoryData.parentCategoryId;
          const visited = new Set<number>();
          
          while (currentParent) {
            if (visited.has(currentParent)) {
              reject(new Error('Circular reference detected'));
              return;
            }
            
            visited.add(currentParent);
            const parent = mockCategories.find(c => c.id === currentParent);
            currentParent = parent?.parentCategoryId || 0;
            
            if (currentParent === id) {
              reject(new Error('This would create a circular reference'));
              return;
            }
          }
        }
        
        // Update the category
        mockCategories[index] = {
          ...mockCategories[index],
          ...categoryData,
        };
        
        resolve(mockCategories[index]);
      }, 500);
    });
  },
  
  // Delete a category (admin only)
  deleteCategory: async (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Check if category has children
        if (mockCategories.some(c => c.parentCategoryId === id)) {
          reject(new Error('Cannot delete a category with child categories'));
          return;
        }
        
        const index = mockCategories.findIndex(c => c.id === id);
        
        if (index === -1) {
          reject(new Error('Category not found'));
          return;
        }
        
        mockCategories.splice(index, 1);
        resolve();
      }, 500);
    });
  }
};

export default categoryService;