import React, { useState, useEffect, useCallback, ChangeEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import eventService, { FrontendEvent, PaginatedEventsApiResponse, CreateEventData, UpdateEventData } from '../../../services/eventService'; // Ensure CreateEventData is imported
import venueService, { VenueSummary } from '../../../services/venueService';
import categoryService, { FrontendCategoryNode } from '../../../services/categoryService';
import Button from '../../common/Button';
import Input from '../../common/Input';
import { Loader2, AlertTriangle, Edit3, Trash2, PlusCircle, RefreshCw, Search, FilterX } from 'lucide-react';
import EventFormModal, { EventFormData } from './EventFormModal'; // Assuming EventFormData is exported from here

const ITEMS_PER_PAGE = 10;

const EventManagementSection: React.FC = () => {
    const { t, i18n } = useTranslation(); // Added i18n for date formatting
    const [events, setEvents] = useState<FrontendEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<FrontendEvent | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [isModalSaving, setIsModalSaving] = useState(false);

    const [availableVenues, setAvailableVenues] = useState<VenueSummary[]>([]);
    const [availableCategories, setAvailableCategories] = useState<FrontendCategoryNode[]>([]);

    const [searchQueryInput, setSearchQueryInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');

    const fetchAuxiliaryDataForForm = useCallback(async () => {
        try {
            const [venuesResponse, categoriesTree] = await Promise.all([
                venueService.getAllVenues(),
                categoryService.getCategoryTree()
            ]);
            setAvailableVenues(venuesResponse.data || []); // venuesResponse is PaginatedVenuesApiResponse
            setAvailableCategories(categoriesTree);
        } catch (err) {
            console.error("Failed to load auxiliary data for event form:", err);
            setError(t('events.auxDataLoadError', 'Could not load necessary data for event form.'));
        }
    }, [t]);

    const fetchEvents = useCallback(async (page: number, search: string, categoryFilterId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // eventService.getEvents expects categoryIds as string[]
            const categoryIdsParam = categoryFilterId ? [categoryFilterId] : undefined;
            const response = await eventService.getEvents(
                page, ITEMS_PER_PAGE, search, categoryIdsParam
            );
            setEvents(response.data);
            setTotalItems(response.totalItems);
            setTotalPages(response.totalPages);
            setCurrentPage(response.currentPage);
        } catch (err: any) {
            setError(err.message || t('events.loadError', 'Failed to load events.'));
            if (page === 1) setEvents([]); // Clear on error only if it's the first page load for this filter set
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        const handler = setTimeout(() => setSearchQuery(searchQueryInput), 500);
        return () => clearTimeout(handler);
    }, [searchQueryInput]);

    useEffect(() => {
        fetchEvents(currentPage, searchQuery, selectedCategoryFilter);
    }, [currentPage, searchQuery, selectedCategoryFilter, fetchEvents]);

    useEffect(() => {
        fetchAuxiliaryDataForForm();
    }, [fetchAuxiliaryDataForForm]);

    const isInitialFilterChange = useRef(true);
    useEffect(() => {
        if (isInitialFilterChange.current) {
            isInitialFilterChange.current = false;
            return;
        }
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            // If already on page 1, filters changed, so refetch page 1
            fetchEvents(1, searchQuery, selectedCategoryFilter);
        }
    }, [searchQuery, selectedCategoryFilter, fetchEvents]); // Removed currentPage

    const handleAddEvent = () => {
        setEditingEvent(null);
        setModalError(null);
        setIsEventModalOpen(true);
    };

    const handleEditEvent = (event: FrontendEvent) => {
        setEditingEvent(event);
        setModalError(null);
        setIsEventModalOpen(true);
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (window.confirm(t('events.confirmDelete', `Are you sure you want to delete event "${events.find(e=>e.id === eventId)?.name || eventId}"? This action cannot be undone.`))) {
            setIsLoading(true); // Indicate general loading for the list
            try {
                await eventService.deleteEvent(eventId); // Assuming service expects string ID
                // Refetch, ideally to the current page or page 1 if current page becomes empty
                fetchEvents(totalItems - 1 === (currentPage - 1) * ITEMS_PER_PAGE && currentPage > 1 ? currentPage - 1 : currentPage, searchQuery, selectedCategoryFilter);
            } catch (err: any) {
                setError(err.message || t('events.deleteError', 'Failed to delete event.'));
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleEventModalSave = async (formData: EventFormData, idToUpdate?: string) => {
        setIsModalSaving(true);
        setModalError(null);

        const combinedDateTime = new Date(`${formData.date}T${formData.time || '00:00:00'}`);
        if (isNaN(combinedDateTime.getTime())) {
            setModalError(t('events.validation.invalidDateTime', 'Invalid date or time provided.'));
            setIsModalSaving(false);
            return;
        }

        const apiPayload: CreateEventData = { // Type matches eventService.createEvent
            name: formData.name.trim(),
            description: formData.description.trim(),
            date: combinedDateTime.toISOString(),
            venueId: Number(formData.venueId), // Backend DTO expects number
            categoryId: formData.categoryId && formData.categoryId !== '' ? Number(formData.categoryId) : null,
            priceValue: parseFloat(formData.priceValue), // Use parseFloat
            priceCurrency: formData.priceCurrency,
            photoUrl: formData.photoUrl && formData.photoUrl.trim() !== '' ? formData.photoUrl.trim() : null, // Send null or undefined as per backend DTO
        };

        try {
            if (idToUpdate) { // Editing
                await eventService.updateEvent(idToUpdate, apiPayload as UpdateEventData); // Assuming UpdateEventData is compatible
            } else { // Creating
                await eventService.createEvent(apiPayload);
            }
            setIsEventModalOpen(false);
            setEditingEvent(null);
            // Refetch events. If it was an edit, stay on current page. If new, go to page 1 or last page.
            fetchEvents(idToUpdate ? currentPage : 1, searchQuery, selectedCategoryFilter);
        } catch (err: any) {
            console.error("Save event error:", err);
            setModalError(err.message || (err.errors && err.errors[0]?.msg) || t('common.saveError', 'Failed to save event. Please check the details.'));
            // Error is now set for the modal to display
        } finally {
            setIsModalSaving(false);
        }
    };
    
    const clearFilters = () => {
        setSearchQueryInput('');
        setSelectedCategoryFilter('');
        // Page reset is handled by useEffect watching searchQuery and selectedCategoryFilter
    };

    // Helper to flatten categories for the filter dropdown
    const flattenCategoriesForFilterSelect = (nodes: FrontendCategoryNode[], level = 0): { value: string, label: string }[] => {
        let options: { value: string, label: string }[] = [];
        for (const node of nodes) {
            options.push({ value: node.id, label: `${'--'.repeat(level)} ${node.name}` });
            if (node.children && node.children.length > 0) {
                options = options.concat(flattenCategoriesForFilterSelect(node.children, level + 1));
            }
        }
        return options;
    };

    const tableHeaders = [
        t('admin.events.table.name', "Name"),
        t('admin.events.table.date', "Date"),
        t('admin.events.table.venue', "Venue"),
        t('admin.events.table.category', "Category"),
        t('admin.events.table.price', "Price"),
        t('common.actions', "Actions")
    ];

    return (
        <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 dim:bg-slate-700 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 dim:border-slate-600">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-text-primary dark:text-white dim:text-slate-100">
                    {t('admin.events.title', 'Manage Events')}
                </h2>
                <Button onClick={handleAddEvent} size="md" className="w-full sm:w-auto">
                    <PlusCircle size={18} className="mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('admin.events.addNew', 'Add New Event')}
                </Button>
            </div>

            {/* Filters UI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 border dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                <Input
                    type="text"
                    placeholder={t('common.searchByNameDesc', 'Search by name/description...')}
                    value={searchQueryInput}
                    onChange={(e) => setSearchQueryInput(e.target.value)}
                    leftIcon={<Search size={18} className="text-gray-400 dark:text-gray-500" />}
                    aria-label={t('common.searchEvents', 'Search events')}
                />
                 <div>
                    <label htmlFor="eventCategoryFilter" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {t('common.filterByCategory', 'Filter by Category')}
                    </label>
                    <select
                        id="eventCategoryFilter"
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="input-base w-full"> {/* Use your common input styles */}
                        <option value="">{t('common.allCategories', 'All Categories')}</option>
                        {flattenCategoriesForFilterSelect(availableCategories).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                {(searchQuery || selectedCategoryFilter) && (
                    <Button variant="outline" onClick={clearFilters} className="self-end h-full md:mt-0 mt-4">
                        <FilterX size={16} className="mr-2" /> {t('common.clearFilters', 'Clear Filters')}
                    </Button>
                )}
            </div>

            {isEventModalOpen && (
                <EventFormModal
                    isOpen={isEventModalOpen}
                    onClose={() => { setIsEventModalOpen(false); setEditingEvent(null); setModalError(null); }}
                    onSave={handleEventModalSave}
                    initialEventData={editingEvent}
                    availableVenues={availableVenues}
                    availableCategories={availableCategories}
                    isLoading={isModalSaving} // Pass modal-specific loading state
                    error={modalError}       // Pass modal-specific error state
                />
            )}

            {/* Table or List of Events */}
            {isLoading && events.length === 0 && currentPage === 1 ? (
                <div className="text-center py-10"><Loader2 className="mx-auto h-12 w-12 text-primary-600 dark:text-primary-400 animate-spin" /></div>
            ) : error && events.length === 0 && currentPage === 1 ? (
                 <div className="py-6 px-4 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md text-sm flex flex-col items-center text-center">
                    <AlertTriangle size={24} className="mb-2" /> {error}
                    <Button variant="outline" size="sm" onClick={() => fetchEvents(1, searchQuery, selectedCategoryFilter)} className="mt-3">
                        <RefreshCw size={14} className="mr-1"/> {t('common.retry', 'Retry Again')}
                    </Button>
                </div>
            ) : events.length === 0 && !isLoading ? (
                <p className="text-center py-10 text-text-secondary dark:text-gray-400">{t('common.noEventsFoundFilters', 'No events found matching your criteria.')}</p>
            ) : (
                <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 dark:border-slate-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-100 dark:bg-slate-700/80">
                            <tr>
                                {tableHeaders.map(headerKey => (
                                    <th key={headerKey} scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                        {headerKey}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {events.map((event) => (
                                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{event.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {event.id}</div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{new Date(event.date).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{event.venueName}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{event.categoryName || t('common.notApplicable', 'N/A')}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{event.price}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2 rtl:space-x-reverse">
                                        <Button variant="icon" size="sm" onClick={() => handleEditEvent(event)} title={t('common.edit', 'Edit')} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                            <Edit3 size={16} />
                                        </Button>
                                        <Button variant="iconDanger" size="sm" onClick={() => handleDeleteEvent(event.id)} title={t('common.delete', 'Delete')} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                                            <Trash2 size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <Button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage <= 1 || isLoading} size="sm" variant="outline">
                        {t('common.previous', 'Previous')}
                    </Button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        {t('common.page', 'Page')} {currentPage} {t('common.of', 'of')} {totalPages}
                        <span className="hidden sm:inline"> ({t('common.totalItems', 'Total:')} {totalItems})</span>
                    </span>
                    <Button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage >= totalPages || isLoading} size="sm" variant="outline">
                        {t('common.next', 'Next')}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default EventManagementSection;