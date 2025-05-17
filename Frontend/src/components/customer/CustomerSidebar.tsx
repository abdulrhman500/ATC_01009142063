import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import categoryService, { Category } from '../../services/categoryService';
import CategoryTreeItem from './CategoryTreeItem';

interface CustomerSidebarProps {
  className?: string;
  onCategorySelect?: (categoryIds: number[]) => void;
}

const CustomerSidebar: React.FC<CustomerSidebarProps> = ({ className, onCategorySelect }) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  
  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoryTree = await categoryService.getCategoryTree();
        setCategories(categoryTree);
        setError(null);
      } catch (err) {
        setError('Failed to load categories');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Handle category selection
  const handleCategorySelect = (categoryId: number, isSelected: boolean) => {
    let newSelectedCategories: number[];
    
    if (isSelected) {
      newSelectedCategories = [...selectedCategories, categoryId];
      
      // Find all children of this category and add them too
      const findAllChildren = (categoryList: Category[], id: number): number[] => {
        const directChildren = categoryList.filter(c => c.parentCategoryId === id).map(c => c.id);
        const allChildren = [...directChildren];
        
        for (const childId of directChildren) {
          allChildren.push(...findAllChildren(categoryList, childId));
        }
        
        return allChildren;
      };
      
      // Get flat list of all categories
      const allCategoriesList = categories.reduce((acc: Category[], cat) => {
        acc.push(cat);
        if (cat.children) {
          const flattenChildren = (children: Category[]) => {
            for (const child of children) {
              acc.push(child);
              if (child.children) {
                flattenChildren(child.children);
              }
            }
          };
          if (cat.children) flattenChildren(cat.children);
        }
        return acc;
      }, []);
      
      const childrenIds = findAllChildren(allCategoriesList, categoryId);
      newSelectedCategories = [...newSelectedCategories, ...childrenIds];
      
    } else {
      newSelectedCategories = selectedCategories.filter(id => id !== categoryId);
      
      // Find all children of this category and remove them too
      const removeChildren = (category: Category) => {
        if (category.id === categoryId && category.children) {
          for (const child of category.children) {
            newSelectedCategories = newSelectedCategories.filter(id => id !== child.id);
            removeChildren(child);
          }
        } else if (category.children) {
          for (const child of category.children) {
            removeChildren(child);
          }
        }
      };
      
      // Remove children from all selected categories
      for (const category of categories) {
        removeChildren(category);
      }
    }
    
    // Update state with unique IDs only
    const uniqueIds = Array.from(new Set(newSelectedCategories));
    setSelectedCategories(uniqueIds);
    
    // Notify parent component of selection change
    if (onCategorySelect) {
      onCategorySelect(uniqueIds);
    }
  };
  
  return (
    <aside className={clsx('bg-bg-primary border-b md:border-r rtl:md:border-l rtl:md:border-r-0 border-border py-4', className)}>
      <div className="px-4 mb-4">
        <h2 className="font-semibold text-lg">{t('common.filter')}</h2>
      </div>
      
      <div className="px-4">
        <h3 className="font-medium text-md mb-2">{t('events.eventCategory')}</h3>
        
        {loading ? (
          <div className="py-4 text-text-tertiary text-sm">{t('common.loading')}</div>
        ) : error ? (
          <div className="py-4 text-error-500 text-sm">{error}</div>
        ) : categories.length === 0 ? (
          <div className="py-4 text-text-tertiary text-sm">{t('common.noResults')}</div>
        ) : (
          <div className="space-y-1">
            {categories.map(category => (
              <CategoryTreeItem
                key={category.id}
                category={category}
                selectedCategories={selectedCategories}
                onSelect={handleCategorySelect}
                level={0}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default CustomerSidebar;