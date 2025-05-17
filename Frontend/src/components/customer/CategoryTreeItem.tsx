import React from 'react';
import { Category } from '../../services/categoryService';
import { ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';

interface CategoryTreeItemProps {
  category: Category;
  selectedCategories: number[];
  onSelect: (categoryId: number, isSelected: boolean) => void;
  level: number;
}

const CategoryTreeItem: React.FC<CategoryTreeItemProps> = ({ 
  category, 
  selectedCategories, 
  onSelect,
  level
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedCategories.includes(category.id);
  
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelect(category.id, e.target.checked);
  };
  
  return (
    <div>
      <div 
        className={clsx(
          'flex items-center py-1',
          { 'ml-4 rtl:mr-4 rtl:ml-0': level > 0 }
        )}
      >
        {hasChildren && (
          <button
            type="button"
            onClick={toggleExpand}
            className="mr-1 rtl:ml-1 rtl:mr-0 p-1 rounded-md hover:bg-bg-accent text-text-tertiary hover:text-text-primary"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        )}
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id={`category-${category.id}`}
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-primary-600 rounded border-border focus:ring-primary-500"
          />
          <label
            htmlFor={`category-${category.id}`}
            className="ml-2 rtl:mr-2 rtl:ml-0 text-sm text-text-primary cursor-pointer"
          >
            {category.name}
          </label>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className={clsx('space-y-1 mt-1')}>
          {category.children.map(child => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              selectedCategories={selectedCategories}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryTreeItem;