import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { FrontendCategoryNode } from '../../services/categoryService';

interface CategoryTreeItemProps {
  category: FrontendCategoryNode;
  selectedCategories: string[];
  onToggleSelect: (categoryId: string, isSelected: boolean) => void;
  level?: number;
  initiallyOpen?: boolean;
}

const CategoryTreeItem: React.FC<CategoryTreeItemProps> = ({
  category,
  selectedCategories,
  onToggleSelect,
  level = 0,
  initiallyOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen || level < 1);
  const isSelected = selectedCategories.includes(category.id);
  const hasChildren = category.children && category.children.length > 0;

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onToggleSelect(category.id, !isSelected);
  };

  const handleLabelOrRowClick = () => {
    onToggleSelect(category.id, !isSelected);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <motion.div
      key={category.id}
      className="py-0.5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: level * 0.02 }}
    >
      <div
        className="flex items-center space-x-2 rtl:space-x-reverse group rounded-md hover:bg-gray-100 dark:hover:bg-slate-700/50 cursor-pointer"
        style={{ paddingLeft: `${level * 12}px` }}
        onClick={handleLabelOrRowClick}
        role="checkbox"
        aria-checked={isSelected}
        tabIndex={0}
        onKeyPress={(e) => { if(e.key === 'Enter' || e.key === ' ') handleLabelOrRowClick();}}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={handleToggleExpand}
            className="p-1 rounded-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            aria-expanded={isOpen}
            aria-label={isOpen ? `Collapse ${category.name}` : `Expand ${category.name}`}
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <div className="w-[28px] shrink-0"></div>
        )}
        <input
          type="checkbox"
          id={`category-filter-${category.id}`}
          className="opacity-0 w-0 h-0 absolute"
          checked={isSelected}
          onChange={handleCheckboxChange}
          tabIndex={-1}
        />
        <span
          className={`mr-2 h-4 w-4 border-2 rounded flex-shrink-0 flex items-center justify-center
                      ${isSelected ? 'bg-primary-600 border-primary-600' : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-500'}
                      group-hover:border-primary-500 transition-all`}
        >
          {isSelected && <motion.div initial={{scale:0}} animate={{scale:1}} className="w-2 h-2 bg-white rounded-sm"/>}
        </span>
        <label
          htmlFor={`category-filter-${category.id}`}
          className="text-sm text-text-secondary dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 cursor-pointer select-none py-1 flex-1"
        >
          {category.name}
        </label>
      </div>
      <AnimatePresence>
        {hasChildren && isOpen && (
          <motion.div
            className="mt-0.5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {category.children.map(child => (
              <CategoryTreeItem
                key={child.id}
                category={child}
                selectedCategories={selectedCategories}
                onToggleSelect={onToggleSelect}
                level={level + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CategoryTreeItem;