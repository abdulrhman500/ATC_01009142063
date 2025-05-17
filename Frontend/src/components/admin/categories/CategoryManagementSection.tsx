import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import categoryService, {
    FrontendCategory,
    PaginatedCategoriesApiResponse,
    CreateCategoryData,
    UpdateCategoryData,
    FrontendCategoryNode,
} from '../../../services/categoryService';
import Button from '../../common/Button';
import { Loader2, AlertTriangle, Edit3, Trash2, PlusCircle, RefreshCw } from 'lucide-react';
import CategoryFormModal from './CategoryFormModal';

const ITEMS_PER_PAGE = 10;

const CategoryManagementSection: React.FC = () => {
    const { t } = useTranslation();
    const [categories, setCategories] = useState<FrontendCategory[]>([]);
    const [allCategoriesForSelect, setAllCategoriesForSelect] = useState<FrontendCategoryNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<FrontendCategory | null>(null);

    const fetchCategories = useCallback(async (page: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const response: PaginatedCategoriesApiResponse = await categoryService.getAllCategories(page, ITEMS_PER_PAGE);
            setCategories(response.data);
            setTotalItems(response.totalItems);
            setTotalPages(response.totalPages);
            setCurrentPage(response.currentPage);
        } catch (err: any) {
            setError(err.message || t('categories.loadError', 'Failed to load categories.'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    const fetchAllCategoriesForSelect = useCallback(async () => {
        try {
            const tree = await categoryService.getCategoryTree();
            setAllCategoriesForSelect(tree);
        } catch (err) {
            console.error("Failed to load categories for select dropdown:", err);
        }
    }, []);

    // useEffect(() => {
    //     fetchCategories(currentPage);
    //     fetchAllCategoriesForSelect();
    // }, [currentPage, fetchCategories, fetchAllCategoriesForSelect]);

    useEffect(() => {
        fetchCategories(currentPage);
    }, [currentPage, fetchCategories]); // fetchCategories depends on 't'
    
    useEffect(() => {
        fetchAllCategoriesForSelect();
    }, [fetchAllCategoriesForSelect]); 
    const handleAddCategory = () => {
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    const handleEditCategory = (category: FrontendCategory) => {
        setIsModalOpen(true);
        setEditingCategory(category);
    };

    const handleDeleteCategory = async (categoryId: string) => {
        if (window.confirm(t('categories.confirmDelete', `Are you sure you want to delete category ID ${categoryId}? This might affect events and child categories.`))) {
            try {
                await categoryService.deleteCategory(categoryId);
                fetchCategories(currentPage);
                fetchAllCategoriesForSelect();
            } catch (err: any) {
                setError(err.message || t('categories.deleteError', 'Failed to delete category.'));
            }
        }
    };

    const handleModalSave = async (data: CreateCategoryData | UpdateCategoryData, id?: string) => {
        try {
            if (id && editingCategory) {
                await categoryService.updateCategory(id, data as UpdateCategoryData);
            } else {
                await categoryService.createCategory(data as CreateCategoryData);
            }
            setIsModalOpen(false);
            setEditingCategory(null);
            fetchCategories(editingCategory ? currentPage : 1);
            fetchAllCategoriesForSelect();
        } catch (err: any) {
            console.error("Save category error:", err);
            throw err;
        }
    };

    if (isLoading && categories.length === 0) {
        return (
            <div className="flex items-center justify-center py-10 text-text-secondary dark:text-gray-400">
                <Loader2 size={24} className="animate-spin mr-2 rtl:ml-2 rtl:mr-0" />
                {t('common.loadingCategories', 'Loading Categories...')}
            </div>
        );
    }

    if (error && categories.length === 0) {
        return (
            <div className="py-6 px-4 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md text-sm flex flex-col items-center text-center">
                <AlertTriangle size={24} className="mb-2" /> {error}
                <Button variant="outline" size="sm" onClick={() => fetchCategories(1)} className="mt-3">
                    <RefreshCw size={14} className="mr-1" /> {t('common.retry', 'Try Again')}
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-text-primary dark:text-white">
                    {t('admin.categories.title', 'Manage Categories')}
                </h2>
                <Button onClick={handleAddCategory} size="sm">
                    <PlusCircle size={18} className="mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('admin.categories.addNew', 'Add New Category')}
                </Button>
            </div>

            {isModalOpen && (
                <CategoryFormModal
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setEditingCategory(null); }}
                    onSave={handleModalSave}
                    initialData={editingCategory}
                    allCategoriesForSelect={allCategoriesForSelect}
                />
            )}

            {error && !isLoading && (
                <div className="mb-4 py-3 px-4 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md text-sm">
                    {error}
                </div>
            )}

            {categories.length === 0 && !isLoading && (
                <p className="text-text-secondary dark:text-gray-400">{t('common.noCategoriesFound', 'No categories found.')}</p>
            )}

            {categories.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.id', 'ID')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.name', 'Name')}</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('categories.parentCategory', 'Parent ID')}</th>
                                <th className="relative px-6 py-3"><span className="sr-only">{t('common.actions', 'Actions')}</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {categories.map((category) => (
                                <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{category.id}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{category.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{category.parentCategoryId || t('common.none', 'None')}</td>
                                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2 rtl:space-x-reverse">
                                        <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                                            <Edit3 size={14} className="mr-1 rtl:ml-1 rtl:mr-0" /> {t('common.edit', 'Edit')}
                                        </Button>
                                        <Button 
                                        variant="danger"
                                         size="sm" 
                                         onClick={() => handleDeleteCategory(category.id)}>
                                            <Trash2 size={14} className="mr-1 rtl:ml-1 rtl:mr-0" /> {t('common.delete', 'Delete')}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                    <Button
                        onClick={() => fetchCategories(currentPage - 1)}
                        disabled={currentPage <= 1 || isLoading}
                        size="sm"
                        variant="outline"
                    >
                        {t('common.previous', 'Previous')}
                    </Button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        {t('common.page', 'Page')} {currentPage} {t('common.of', 'of')} {totalPages}
                    </span>
                    <Button
                        onClick={() => fetchCategories(currentPage + 1)}
                        disabled={currentPage >= totalPages || isLoading}
                        size="sm"
                        variant="outline"
                    >
                        {t('common.next', 'Next')}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default CategoryManagementSection;
