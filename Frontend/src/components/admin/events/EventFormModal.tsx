import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FrontendEvent } from '../../../services/eventService'; // Type for initialData (event summary)
import { FrontendCategoryNode } from '../../../services/categoryService';
import { VenueSummary } from '../../../services/venueService'; // Assuming a VenueSummary type from venueService
import Button from '../../common/Button';
import Input from '../../common/Input';
import { X, AlertTriangle, Calendar as CalendarIcon, DollarSign, Link as LinkIcon, Tag as TagIcon, MapPin as MapPinIcon } from 'lucide-react';
import Constants from '../../../config/Constants'; // For SUPPORTED_CURRENCIES

// This is the shape of data the form will manage and submit
export interface EventFormData {
    name: string;
    description: string;
    date: string; // ISO Date string (YYYY-MM-DD) for <input type="date">
    time: string; // HH:MM for <input type="time">
    venueId: string; // Store as string from select, convert to number on save
    categoryId?: string; // Store as string from select
    priceValue: string; // Store as string from input, convert to number
    priceCurrency: string;
    photoUrl?: string;
}

interface EventFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: EventFormData, id?: string) => Promise<void>; // id is string for events
    initialEventData?: FrontendEvent | null;
    availableVenues: VenueSummary[];
    availableCategories: FrontendCategoryNode[];
    isLoading?: boolean; // To be controlled by the parent during save
    error?: string | null; // To be passed from the parent if save fails
}

// Basic Modal structure (you should have a common one)
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-xl m-auto transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal" className="p-1 -mr-2"><X size={22} /></Button>
                </div>
                <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">{children}</div>
                {footer && <div className="px-5 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 flex justify-end space-x-3 rtl:space-x-reverse">{footer}</div>}
            </div>
        </div>
    );
};


const EventFormModal: React.FC<EventFormModalProps> = ({
    isOpen, onClose, onSave, initialEventData, availableVenues, availableCategories,
    isLoading: parentIsLoading = false, // Default to false
    error: parentError = null         // Default to null
}) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<EventFormData>({
        name: '', description: '', date: '', time: '18:00', venueId: '', categoryId: '',
        priceValue: '0', priceCurrency: (Constants.SUPPORTED_CURRENCIES[0] as string || 'USD'), photoUrl: ''
    });
    const [formError, setFormError] = useState<string | null>(null); // Local form validation errors

    useEffect(() => {
        if (isOpen) {
            if (initialEventData) {
                const eventDate = new Date(initialEventData.date);
                setFormData({
                    name: initialEventData.name,
                    description: initialEventData.descriptionShort, // Or use a full description if available
                    date: !isNaN(eventDate.getTime()) ? eventDate.toISOString().split('T')[0] : '',
                    time: !isNaN(eventDate.getTime()) ? eventDate.toTimeString().substring(0, 5) : '18:00',
                    venueId: (initialEventData as any).venueId?.toString() || (availableVenues[0]?.id.toString() || ''), // Try to get venueId
                    categoryId: (initialEventData as any).categoryId?.toString() || '', // Try to get categoryId
                    priceValue: initialEventData.price.split(' ')[0] || '0',
                    priceCurrency: initialEventData.price.split(' ')[1] || Constants.SUPPORTED_CURRENCIES[0] as string,
                    photoUrl: initialEventData.photoUrl || 'https://ticketlinkz.com/wp-content/uploads/2014/12/EVENT-PLACEHOLDER-800.jpg',
                });
            } else {
                setFormData({
                    name: '', description: '', date: '', time: '18:00', venueId: availableVenues[0]?.id.toString() || '', 
                    categoryId: '', priceValue: '0', priceCurrency: Constants.SUPPORTED_CURRENCIES[0] as string, photoUrl: ''
                });
            }
            setFormError(null); // Reset local form error
        }
    }, [initialEventData, isOpen, availableVenues]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setFormError(null); // Clear error on change
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!formData.name.trim() || !formData.description.trim() || !formData.date || !formData.time || !formData.venueId) {
            setFormError(t('common.fillRequiredFields', 'Please fill all required fields: Name, Description, Date, Time, and Venue.'));
            return;
        }
        if (isNaN(parseFloat(formData.priceValue)) || parseFloat(formData.priceValue) < 0) {
            setFormError(t('events.validation.invalidPrice', 'Price must be a non-negative number.'));
            return;
        }

        await onSave(formData, initialEventData?.id);
        // Parent (EventManagementSection) will handle closing the modal on successful save.
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
                {(formError || parentError) && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 rounded-md text-sm text-red-700 dark:text-red-300">
                        {formError || parentError}
                    </div>
                )}
                <Input label={t('events.form.name', 'Event Name')} type="text" name="name" value={formData.name} onChange={handleChange} required />
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">{t('events.form.description', 'Description')}</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4} required
                        className="input-base" // Use your common input styles, e.g., from Input component theme
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label={t('events.form.date', 'Date')} type="date" name="date" value={formData.date} onChange={handleChange} required />
                    <Input label={t('events.form.time', 'Time')} type="time" name="time" value={formData.time} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="venueId" className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">{t('events.form.venue', 'Venue')}</label>
                    <select name="venueId" id="venueId" value={formData.venueId} onChange={handleChange} required className="input-base">
                        <option value="">{t('common.selectVenue', '-- Select Venue --')}</option>
                        {availableVenues.map(venue => <option key={venue.id} value={venue.id.toString()}>{venue.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">{t('events.form.categoryOptional', 'Category (Optional)')}</label>
                    <select name="categoryId" id="categoryId" value={formData.categoryId || ''} onChange={handleChange} className="input-base">
                        <option value="">{t('common.selectCategoryOptional', '-- Select Category --')}</option>
                        {categoryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label={t('events.form.priceValue', 'Price')} type="number" name="priceValue" value={formData.priceValue} onChange={handleChange} required leftIcon={<DollarSign size={16}/>} min="0" step="0.01"/>
                    <div>
                        <label htmlFor="priceCurrency" className="block text-sm font-medium text-text-secondary dark:text-gray-300 mb-1">{t('events.form.currency', 'Currency')}</label>
                        <select name="priceCurrency" id="priceCurrency" value={formData.priceCurrency} onChange={handleChange} required className="input-base">
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