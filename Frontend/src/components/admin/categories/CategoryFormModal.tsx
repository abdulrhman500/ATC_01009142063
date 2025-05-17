import React, { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FrontendCategory, FrontendCategoryNode, CreateCategoryData, UpdateCategoryData } from '../../../services/categoryService'; // Adjust path
import Button from '../../common/Button';
import Input from '../../common/Input'; // Your common Input component
import { X, AlertTriangle } from 'lucide-react';

// Basic Modal structure (you might have a more advanced common Modal)
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode; // Optional footer for actions
}
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
            onClick={onClose} // Close on overlay click
            role="dialog"
            aria-modal="true"
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md m-auto overflow-hidden transform transition-all"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal content
            >
                <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal" className="p-1">
                        <X size={20} />
                    </Button>
                </div>
                <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">{children}</div>
                {footer && (
                    <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 flex justify-end space-x-3 rtl:space-x-reverse">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};


interface CategoryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateCategoryData | UpdateCategoryData, id?: string) => Promise<void>;
    initialData?: FrontendCategory | null; // For editing (uses FrontendCategory for id and parentId)
    allCategoriesForSelect: FrontendCategoryNode[]; // Tree structure for parent selection
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    allCategoriesForSelect
}) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    // parentCategoryId will store the ID as a string from select, convert to number or null on save
    const [parentCategoryId, setParentCategoryId] = useState<string>(''); // Empty string for "None" option
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) { // Reset form when modal opens or initialData changes
            if (initialData) {
                setName(initialData.name);
                setParentCategoryId(initialData.parentCategoryId || ''); // Handles null or undefined
            } else {
                setName('');
                setParentCategoryId(''); // Default to "None" for new category
            }
            setError(null); // Clear previous errors
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError(t('categories.validation.nameRequired', 'Category name is required.'));
            return;
        }

        setIsLoading(true);
        const parentIdNum = parentCategoryId ? parseInt(parentCategoryId, 10) : null;

        // Basic check to prevent self-parenting if editing
        if (initialData && initialData.id === parentCategoryId) {
            setError(t('categories.validation.selfParent', 'A category cannot be its own parent.'));
            setIsLoading(false);
            return;
        }
        // More robust cycle detection would traverse up the parent chain from selected parentId.
        // For now, this covers direct self-parenting.

        const dataToSave: CreateCategoryData | UpdateCategoryData = {
            name: name.trim(),
            parentCategoryId: parentIdNum,
        };

        try {
            await onSave(dataToSave, initialData?.id);
            // Parent (CategoryManagementSection) will call onClose upon successful save
        } catch (err: any) {
            setError(err.message || err.payload?.message || t('common.error', 'An unexpected error occurred.'));
        } finally {
            setIsLoading(false);
        }
    };

    // Helper to flatten the category tree for the select dropdown
    const generateSelectOptions = (nodes: FrontendCategoryNode[], level = 0, disabledId?: string): JSX.Element[] => {
        let options: JSX.Element[] = [];
        for (const node of nodes) {
            // Cannot select itself or its own descendants as a parent if editing
            const isPotentiallyOwnDescendantOrSelf = initialData?.id === node.id; // Simplified check; true cycle check is harder here

            options.push(
                <option key={node.id} value={node.id} disabled={isPotentiallyOwnDescendantOrSelf}>
                    {'--'.repeat(level) + ' ' + node.name}
                </option>
            );
            if (node.children && node.children.length > 0) {
                options = options.concat(generateSelectOptions(node.children, level + 1, disabledId));
            }
        }
        return options;
    };

    const categoryOptions = generateSelectOptions(allCategoriesForSelect, 0, initialData?.id);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? t('categories.editTitle', 'Edit Category') : t('categories.addTitle', 'Add New Category')}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button type="submit" form="category-form" loading={isLoading} disabled={isLoading}>
                        {initialData ? t('common.saveChanges', 'Save Changes') : t('common.create', 'Create')}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} id="category-form" className="space-y-4">
                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-600 rounded-md text-sm text-red-700 dark:text-red-300 flex items-center">
                       <AlertTriangle size={18} className="mr-2 shrink-0" /> {error}
                    </div>
                )}
                <Input
                    label={t('common.name', 'Category Name')}
                    type="text"
                    id="categoryName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder={t('categories.namePlaceholder', 'e.g., Technology Conferences')}
                />
                <div>
                    <label htmlFor="parentCategory" className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">
                        {t('categories.parentCategory', 'Parent Category')}
                    </label>
                    <select
                        id="parentCategory"
                        value={parentCategoryId} // Controlled component
                        onChange={(e) => setParentCategoryId(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-slate-700 text-text-primary dark:text-white"
                    >
                        <option value="">{t('common.noneSelect', '-- Select None (Root Category) --')}</option>
                        {categoryOptions}
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {t('categories.parentHelp', 'Select a parent to create a sub-category. Leave blank for a main category.')}
                    </p>
                    {/* TODO: Implement "Change Parent" button with advanced selector if needed */}
                </div>
            </form>
        </Modal>
    );
};

export default CategoryFormModal;