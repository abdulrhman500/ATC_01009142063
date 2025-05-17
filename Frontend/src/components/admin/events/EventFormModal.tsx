import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FrontendEvent } from '../../../services/eventService'; // Your type for an event object
import { FrontendCategoryNode } from '../../../services/categoryService';
import { VenueSummary } from '../../../services/venueService'; // Type for venue list items
import Button from '../../common/Button';
import Input from '../../common/Input'; // Your common Input component
import { X, AlertTriangle, Calendar as CalendarIcon, DollarSign, Link as LinkIcon } from 'lucide-react';
import Constants from '../../../config/Constants'; // Adjust path as per your project

// This interface defines the structure of the form's local state
export interface EventFormData {
    name: string;
    description: string;
    date: string;         // YYYY-MM-DD for <input type="date">
    time: string;         // HH:MM for <input type="time">
    venueId: string;      // Store as string (from select value), convert to number on save
    categoryId: string;   // Store as string (from select value), convert to number or null on save
    priceValue: string;   // Store as string, convert to number
    priceCurrency: string;
    photoUrl: string;     // Store as string
}

interface EventFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: EventFormData, id?: string) => Promise<void>; // id is string for existing events
    initialEventData?: FrontendEvent | null; // For editing
    availableVenues: VenueSummary[];
    availableCategories: FrontendCategoryNode[];
    isLoading?: boolean; // Controlled by the parent (EventManagementSection) during onSave
    error?: string | null;   // Error message from parent's onSave attempt
}

// Basic Modal structure (re-included for completeness, ideally this is a common component)
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }> = ({
    isOpen, onClose, title, children, footer
}) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl m-auto transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal" className="p-1 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></Button>
                </div>
                <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto space-y-5 scrollbar-thin dark:scrollbar-thumb-slate-600 dark:scrollbar-track-slate-700">{children}</div>
                {footer && <div className="px-5 sm:px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 flex justify-end space-x-3 rtl:space-x-reverse">{footer}</div>}
            </div>
        </div>
    );
};

const EventFormModal: React.FC<EventFormModalProps> = ({
    isOpen, onClose, onSave, initialEventData, availableVenues, availableCategories,
    isLoading: parentIsLoading = false,
    error: parentError = null
}) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<EventFormData>({
        name: '', description: '', date: '', time: '18:00', venueId: '', categoryId: '',
        priceValue: '0.00', priceCurrency: Constants.SUPPORTED_CURRENCIES[0] as string, photoUrl: ''
    });
    // Local form validation error, distinct from parentError (API error)
    const [localFormError, setLocalFormError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialEventData) {
                const eventDateObj = new Date(initialEventData.date);
                const isValidDate = !isNaN(eventDateObj.getTime());
                // Assuming initialEventData.price is like "199.99 USD"
                const priceParts = initialEventData.price?.split(' ') || ['0', Constants.SUPPORTED_CURRENCIES[0] as string];

                setFormData({
                    name: initialEventData.name || '',
                    description: (initialEventData as any).description || initialEventData.descriptionShort || '', // Prefer full description
                    date: isValidDate ? eventDateObj.toISOString().split('T')[0] : '',
                    time: isValidDate ? eventDateObj.toTimeString().substring(0, 5) : '18:00',
                    // For editing, initialEventData (FrontendEvent) must provide these IDs as strings
                    venueId: (initialEventData as any).venueId?.toString() || '', // Needs to be on FrontendEvent
                    categoryId: (initialEventData as any).categoryId?.toString() || '', // Needs to be on FrontendEvent
                    priceValue: priceParts[0],
                    priceCurrency: priceParts[1] || Constants.SUPPORTED_CURRENCIES[0] as string,
                    photoUrl: initialEventData.photoUrl || '',
                });
            } else { // Reset for "Add New"
                setFormData({
                    name: '', description: '', date: '', time: '18:00',
                    venueId: availableVenues.length > 0 ? String(availableVenues[0].id) : '', // Default to first venue if available
                    categoryId: '', // Default to "None"
                    priceValue: '0.00', priceCurrency: Constants.SUPPORTED_CURRENCIES[0] as string, photoUrl: ''
                });
            }
            setLocalFormError(null); // Reset local form error when modal opens or data changes
        }
    }, [initialEventData, isOpen, availableVenues]); // Rerun if availableVenues changes for default

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (localFormError) setLocalFormError(null); // Clear local error on any change
    };

    const validateForm = (): boolean => {
        if (!formData.name.trim()) { setLocalFormError(t('events.validation.nameRequired', 'Event name is required.')); return false; }
        if (!formData.description.trim()) { setLocalFormError(t('events.validation.descriptionRequired', 'Description is required.')); return false; }
        if (!formData.date) { setLocalFormError(t('events.validation.dateRequired', 'Date is required.')); return false; }
        if (!formData.time) { setLocalFormError(t('events.validation.timeRequired', 'Time is required.')); return false; }
        if (!formData.venueId) { setLocalFormError(t('events.validation.venueRequired', 'Venue is required.')); return false; }
        
        const priceNum = parseFloat(formData.priceValue);
        if (isNaN(priceNum) || priceNum < 0) {
            setLocalFormError(t('events.validation.invalidPrice', 'Price must be a non-negative number.'));
            return false;
        }
        if (!Constants.SUPPORTED_CURRENCIES.includes(formData.priceCurrency as any)) {
            setLocalFormError(t('events.validation.invalidCurrency', 'Invalid currency selected.'));
            return false;
        }
        if (formData.photoUrl && formData.photoUrl.trim() !== '') {
            try { new URL(formData.photoUrl); }
            catch (_) { setLocalFormError(t('events.validation.invalidPhotoUrl', 'Photo URL is not a valid URL.')); return false; }
        }
        return true;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLocalFormError(null); // Clear local error first

        if (!validateForm()) { // Perform client-side validation
            return;
        }
        // Parent component (EventManagementSection) will set its own isLoading and error states via onSave
        await onSave(formData, initialEventData?.id);
    };

    const flattenCategoriesForSelect = (nodes: FrontendCategoryNode[], level = 0): { value: string, label: string }[] => {
        let options: { value: string, label: string }[] = [];
        for (const node of nodes) {
            options.push({ value: node.id, label: `${'— '.repeat(level)} ${node.name}` });
            if (node.children && node.children.length > 0) {
                options = options.concat(flattenCategoriesForSelect(node.children, level + 1));
            }
        }
        return options;
    };
    const categoryOptions = flattenCategoriesForSelect(availableCategories || []);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialEventData ? t('admin.events.editEvent', 'Edit Event') : t('admin.events.addEvent', 'Add New Event')}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={parentIsLoading}>
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button type="submit" form="event-form" loading={parentIsLoading} disabled={parentIsLoading}>
                        {initialEventData ? t('common.saveChanges', 'Save Changes') : t('common.createEvent', 'Create Event')}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} id="event-form" className="space-y-5">
                {(localFormError || parentError) && ( // Display local form error OR parent (API) error
                    <div className="p-3 mb-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 rounded-md text-sm text-red-700 dark:text-red-300 flex items-center">
                       <AlertTriangle size={18} className="mr-2 shrink-0" /> {localFormError || parentError}
                    </div>
                )}
                <Input label={t('events.form.name', 'Event Name')} type="text" name="name" value={formData.name} onChange={handleChange} required />
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">{t('events.form.description', 'Description')}</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} required
                        className="input-base w-full p-2.5 border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label={t('events.form.date', 'Date')} type="date" name="date" value={formData.date} onChange={handleChange} required />
                    <Input label={t('events.form.time', 'Time')} type="time" name="time" value={formData.time} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="venueId" className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">{t('events.form.venue', 'Venue')}</label>
                    <select name="venueId" id="venueId" value={formData.venueId} onChange={handleChange} required className="input-base w-full">
                        <option value="">{t('common.selectVenue', '-- Select Venue --')}</option>
                        {availableVenues.map(venue => <option key={venue.id} value={String(venue.id)}>{venue.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">{t('events.form.categoryOptional', 'Category (Optional)')}</label>
                    <select name="categoryId" id="categoryId" value={formData.categoryId || ''} onChange={handleChange} className="input-base w-full">
                        <option value="">{t('common.selectCategoryOptional', '-- Select Category --')}</option>
                        {categoryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label={t('events.form.priceValue', 'Price')} type="number" name="priceValue" value={formData.priceValue} onChange={handleChange} required leftIcon={<DollarSign size={16}/>} min="0" step="0.01"/>
                    <div>
                        <label htmlFor="priceCurrency" className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">{t('events.form.currency', 'Currency')}</label>
                        <select name="priceCurrency" id="priceCurrency" value={formData.priceCurrency} onChange={handleChange} required className="input-base w-full">
                            {(Constants.SUPPORTED_CURRENCIES as readonly string[]).map(curr => <option key={curr} value={curr}>{curr}</option>)}
                        </select>
                    </div>
                </div>
                <Input label={t('events.form.photoUrlOptional', 'Photo URL (Optional)')} type="url" name="photoUrl" value={formData.photoUrl || ''} onChange={handleChange} placeholder="https://example.com/image.jpg" leftIcon={<LinkIcon size={16}/>}/>
            </form>
        </Modal>
    );
};

export default EventFormModal;