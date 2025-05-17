import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import eventService, { FrontendEvent, PaginatedEventsApiResponse } from '../../../services/eventService';
import venueService, { VenueSummary } from '../../../services/venueService'; // For venue dropdown
import categoryService, { FrontendCategoryNode } from '../../../services/categoryService'; // For category dropdown
import Button from '../../common/Button';
import { Loader2, AlertTriangle, Edit3, Trash2, PlusCircle, RefreshCw, Search, FilterX } from 'lucide-react';
import EventFormModal, { EventFormData } from './EventFormModal'; // Import the modal and its form data type
import Input from '../../common/Input'; // For search
import { map } from 'framer-motion/client';

const ITEMS_PER_PAGE = 10;

const EventManagementSection: React.FC = () => {
    const { t } = useTranslation();
    const [events, setEvents] = useState<FrontendEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<FrontendEvent | null>(null);

    // For form dropdowns
    const [availableVenues, setAvailableVenues] = useState<VenueSummary[]>([]);
    const [availableCategories, setAvailableCategories] = useState<FrontendCategoryNode[]>([]);

    // Filters
    const [searchQueryInput, setSearchQueryInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>(''); // Single category ID string for filter

     const fetchAuxiliaryDataForForm = useCallback(async () => {
        try {
            const [venuesRes, categoriesRes] = await Promise.all([
                venueService.getAllVenues(), // Assuming this fetches all venues
                categoryService.getCategoryTree()
            ]);
            setAvailableVenues(venuesRes.data); // Assuming getAllVenues returns { data: VenueSummary[] }
            setAvailableCategories(categoriesRes);
        } catch (err) {
            console.error("Failed to load auxiliary data for event form:", err);
            // Set an error state for these if needed, or just log
        }
    }, []);


    const fetchEvents = useCallback(async (page: number, search: string, categoryId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const catIdsArray = categoryId ? [categoryId] : [];
            const response: PaginatedEventsApiResponse = await eventService.getEvents(
                page,
                ITEMS_PER_PAGE,
                search,
                catIdsArray.map(a => String(a)) // eventService.getEvents expects string[] for category IDs
            );
            setEvents(response.data);
            setTotalItems(response.totalItems);
            setTotalPages(response.totalPages);
            setCurrentPage(response.currentPage);
        } catch (err: any) {
            setError(err.message || t('events.loadError', 'Failed to load events.'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => setSearchQuery(searchQueryInput), 500);
        return () => clearTimeout(handler);
    }, [searchQueryInput]);

    // Initial data fetch and refetch on filters/page change
    useEffect(() => {
        fetchEvents(currentPage, searchQuery, selectedCategoryFilter);
    }, [currentPage, searchQuery, selectedCategoryFilter, fetchEvents]);

    useEffect(() => { // Fetch data for form dropdowns once
        fetchAuxiliaryDataForForm();
    }, [fetchAuxiliaryDataForForm]);

    // Reset page to 1 when filters change
     useEffect(() => {
        if (currentPage !== 1) { // Avoid resetting if already on page 1 due to another effect
            setCurrentPage(1);
        }
    }, [searchQuery, selectedCategoryFilter]);


    const handleAddEvent = () => {
        setEditingEvent(null);
        setIsEventModalOpen(true);
    };

    const handleEditEvent = (event: FrontendEvent) => {
        setEditingEvent(event);
        setIsEventModalOpen(true);
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (window.confirm(t('events.confirmDelete', `Are you sure you want to delete event ID ${eventId}?`))) {
            try {
                setIsLoading(true); // Show loading for delete action
                await eventService.deleteEvent(Number(eventId)); // Assuming service expects number
                fetchEvents(1, searchQuery, selectedCategoryFilter); // Refetch from page 1 after delete
            } catch (err: any) {
                setError(err.message || t('events.deleteError', 'Failed to delete event.'));
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleEventModalSave = async (data: EventFormData, id?: string) => {
        // Convert DTO data to what createEvent/updateEvent service methods expect
        // CreateEventRequestDto from backend has: name, desc, date (ISO string), venueId (num), categoryId (num|null), priceVal, priceCurr, photoUrl
        const apiPayload = {
            name: data.name,
            description: data.description,
            date: new Date(data.date).toISOString(), // Ensure it's ISO string for backend
            venueId: Number(data.venueId),
            categoryId: data.categoryId ? Number(data.categoryId) : null,
            priceValue: Number(data.priceValue),
            priceCurrency: data.priceCurrency,
            photoUrl: data.photoUrl || null, // Send null if empty
        };

        try {
            if (id) { // Editing
                await eventService.updateEvent(Number(id), apiPayload);
            } else { // Creating
                await eventService.createEvent(apiPayload as any); // Cast if createEvent expects slightly different type
            }
            setIsEventModalOpen(false);
            setEditingEvent(null);
            fetchEvents(id ? currentPage : 1, searchQuery, selectedCategoryFilter); // Refetch (go to page 1 for new)
        } catch (err: any) {
            console.error("Save event error:", err);
            // Error will be displayed in the modal by its own error state
            throw err; // Re-throw for the modal to catch and display
        }
    };
    
    const clearFilters = () => {
        setSearchQueryInput('');
        setSelectedCategoryFilter('');
        // fetchEvents will be triggered by useEffect due to filter state change
    };


    if (isLoading && events.length === 0 && currentPage === 1) { /* Initial Loading state */ }
    if (error && events.length === 0 && currentPage === 1) { /* Initial Error state */ }

    return (
        <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-xl font-semibold text-text-primary dark:text-white">
                    {t('admin.events.title', 'Manage Events')}
                </h2>
                <Button onClick={handleAddEvent} size="sm" className="w-full sm:w-auto">
                    <PlusCircle size={18} className="mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('admin.events.addNew', 'Add New Event')}
                </Button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 border dark:border-slate-700 rounded-lg">
                <Input
                    type="text"
                    placeholder={t('common.searchByNameDesc', 'Search by name/description...')}
                    value={searchQueryInput}
                    onChange={(e) => setSearchQueryInput(e.target.value)}
                    leftIcon={<Search size={18} className="text-gray-400" />}
                />
                 <div>
                    <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('common.filterByCategory', 'Filter by Category')}
                    </label>
                    <select
                        id="categoryFilter"
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-slate-700 text-text-primary dark:text-white"
                    >
                        <option value="">{t('common.allCategories', 'All Categories')}</option>
                        {/* Simple flat list for filter dropdown for now */}
                        {availableCategories.flatMap(c => [{id: c.id, name: c.name}, ...(c.children || []).map(child => ({id: child.id, name: `-- ${child.name}`}))]).map(opt => (
                            <option key={opt.id} value={opt.id.toString()}>{opt.name}</option>
                        ))}
                    </select>
                </div>
                {(searchQuery || selectedCategoryFilter) && (
                    <Button variant="outline" onClick={clearFilters} className="self-end">
                        <FilterX size={16} className="mr-2" /> {t('common.clearFilters', 'Clear Filters')}
                    </Button>
                )}
            </div>


            {isEventModalOpen && (
                <EventFormModal
                    isOpen={isEventModalOpen}
                    onClose={() => { setIsEventModalOpen(false); setEditingEvent(null); }}
                    onSave={handleEventModalSave}
                    initialEventData={editingEvent}
                    availableVenues={availableVenues}
                    availableCategories={availableCategories}
                />
            )}

            {isLoading && events.length === 0 && currentPage === 1 ? (
                <div className="text-center py-10"><Loader2 className="mx-auto h-12 w-12 text-primary-600 animate-spin" /></div>
            ) : error && events.length === 0 && currentPage === 1 ? (
                 <div className="py-6 px-4 text-red-700 ..."> {/* Error display */} </div>
            ) : events.length === 0 && !isLoading ? (
                <p className="text-center py-10 text-text-secondary dark:text-gray-400">{t('common.noEventsFound', 'No events found matching your criteria.')}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        {/* Table Head */}
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">VenueSummary</th>
                                {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th> */}
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                                <th className="relative px-4 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        {/* Table Body */}
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {events.map((event) => (
                                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{event.name}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(event.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{event.venueName}</td>
                                    {/* <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{event.categoryName}</td> */}
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{event.price}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2 rtl:space-x-reverse">
                                        <Button variant="outline" size="sm" onClick={() => handleEditEvent(event)}><Edit3 size={14} /> <span className="ml-1 rtl:mr-1 rtl:ml-0 hidden sm:inline">Edit</span></Button>
                                        <Button variant="danger" size="sm" onClick={() => handleDeleteEvent(event.id)}><Trash2 size={14} /> <span className="ml-1 rtl:mr-1 rtl:ml-0 hidden sm:inline">Delete</span></Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-between items-center">
                    {/* ... Pagination buttons ... */}
                </div>
            )}
        </div>
    );
};

export default EventManagementSection;