import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import categoryService, { FrontendCategoryNode } from '../../services/categoryService';
import CategoryTreeItem from './CategoryTreeItem'; // Uses the above component
import { Loader2, AlertTriangle, Filter as FilterIcon, RefreshCw } from 'lucide-react';
import Button from '../common/Button';

interface CustomerSidebarProps {
    className?: string;
    onCategorySelectionChange: (selectedIds: string[]) => void; // Callback with string IDs
    initialSelectedCategoryIds?: string[];
}

const CustomerSidebar: React.FC<CustomerSidebarProps> = ({
    className,
    onCategorySelectionChange,
    initialSelectedCategoryIds = [],
}) => {
  console.log('CustomerSidebar received onCategorySelectionChange:', typeof onCategorySelectionChange, onCategorySelectionChange); // <<< ADD THIS LOG
    const { t } = useTranslation();
    const [categoryTree, setCategoryTree] = useState<FrontendCategoryNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedCategoryIds);

    // Helper to get all IDs in a subtree (self + descendants)
    const getAllIdsInSubtree = useCallback((node: FrontendCategoryNode): string[] => {
        let ids = [node.id];
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
                ids = ids.concat(getAllIdsInSubtree(child));
            });
        }
        return ids;
    }, []);
    
    // Helper to find a node in the tree
    const findNodeInTree = useCallback((nodes: FrontendCategoryNode[], id: string): FrontendCategoryNode | null => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNodeInTree(node.children, id);
                if (found) return found;
            }
        }
        return null;
    }, []);

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const tree = await categoryService.getCategoryTree();
            setCategoryTree(tree);
        } catch (catErr: any) {
            setError(catErr.message || t('common.categoriesLoadError', 'Failed to load categories.'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Propagate changes to parent
    useEffect(() => {
      if(onCategorySelectionChange) {
        onCategorySelectionChange(selectedIds);
      }
    }, [selectedIds, onCategorySelectionChange]);


    const handleCategoryToggle = (categoryId: string) => {
        const toggledNode = findNodeInTree(categoryTree, categoryId);
        if (!toggledNode) return;

        const idsToAffect = getAllIdsInSubtree(toggledNode);

        setSelectedIds(prevSelected => {
            const currentlyAllAffectedAreSelected = idsToAffect.every(id => prevSelected.includes(id));
            
            if (currentlyAllAffectedAreSelected) {
                // Deselect this node and all its children
                return prevSelected.filter(id => !idsToAffect.includes(id));
            } else {
                // Select this node and all its children
                return Array.from(new Set([...prevSelected, ...idsToAffect]));
            }
        });
    };

    const clearSelection = () => {
        setSelectedIds([]);
    };

    return (
        <div className={clsx(
            'p-5 bg-white dark:bg-slate-800 dim:bg-slate-700 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 dim:border-slate-600',
            className
        )}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-text-primary dark:text-white dim:text-slate-100 flex items-center">
                    <FilterIcon size={20} className="mr-2 rtl:ml-2 rtl:mr-0 text-primary-600 dark:text-primary-400" />
                    {t('common.categories', 'Categories')}
                </h3>
                {selectedIds.length > 0 && (
                    <Button
                        size="sm"
                        onClick={clearSelection}
                        className="text-xs px-1 py-0.5 text-primary-600 dark:text-primary-400 hover:underline"
                    >
                        {t('common.clear', 'Clear')}
                    </Button>
                )}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-10 text-text-secondary dark:text-gray-400">
                    <Loader2 size={24} className="animate-spin mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('common.loadingCategories', 'Loading...')}
                </div>
            ) : error ? (
                <div className="py-3 px-3 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md text-sm flex flex-col items-center text-center">
                    <AlertTriangle size={20} className="mb-1" /> {error}
                    <Button variant="outline" size="sm" onClick={fetchCategories} className="mt-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-800/50">
                        <RefreshCw size={14} className="mr-1"/> {t('common.retry', 'Retry')}
                    </Button>
                </div>
            ) : categoryTree.length === 0 ? (
                <p className="text-text-secondary dark:text-gray-400 text-sm text-center py-2">{t('common.noCategoriesFound', 'No categories found.')}</p>
            ) : (
                <div className="space-y-0.5 max-h-96 lg:max-h-[calc(100vh-18rem)] overflow-y-auto pr-1 rtl:pl-1 rtl:pr-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-slate-500">
                    {categoryTree.map(category => (
                        <CategoryTreeItem
                            key={category.id}
                            category={category}
                            selectedCategories={selectedIds}
                            onToggleSelect={handleCategoryToggle} // Renamed prop for clarity
                            defaultOpen={true} // Open top-level categories by default
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomerSidebar;