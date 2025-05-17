// src/domain/event/value-objects/Venue.ts
// Assuming this is the correct path for your Venue VO/Entity

// Constants for max lengths (good practice to keep them at the top or in a shared constants file)
const MAX_VENUE_NAME_LENGTH = 100;
const MAX_STREET_LENGTH = 100;
const MAX_CITY_LENGTH = 50;
const MAX_STATE_LENGTH = 50;
const MAX_COUNTRY_LENGTH = 50;
const MAX_POSTAL_CODE_LENGTH = 20;

export default class Venue {
    readonly id: number; // Will be -1 for new, positive for persisted
    readonly name: string;
    readonly street: string;
    readonly city: string;
    readonly state: string;
    readonly country: string;
    readonly postalCode?: string;
    readonly placeUrl?: string;

    private constructor(
        id: number,
        name: string,
        street: string,
        city: string,
        state: string,
        country: string,
        postalCode: string | undefined,
        placeUrl?: string
    ) {
        // Validations are called after properties are potentially set by builder
        this.id = id; // Assign first, then validate contextually if needed
        this.name = name.trim();
        this.street = street.trim();
        this.city = city.trim();
        this.state = state.trim();
        this.country = country.trim();
        this.postalCode = postalCode?.trim();
        this.placeUrl = placeUrl?.trim();

        // Perform validations after trimming and assignment
        this.validateId(this.id);
        this.validateName(this.name);
        this.validateStreet(this.street);
        this.validateCity(this.city);
        this.validateCountry(this.country);

        if (this.state !== undefined) this.validateState(this.state);
        if (this.postalCode !== undefined) this.validatePostalCode(this.postalCode);
        if (this.placeUrl !== undefined && this.placeUrl !== '') this.validatePlaceUrl(this.placeUrl);
    }

    private validateId(id: number): void {
        // Allow -1 as a sentinel for new, unpersisted venues
        if (id <= 0 && id !== -1) {
            throw new Error("Venue ID must be a positive number (or -1 for new unpersisted venues).");
        }
    }

    private validateName(name: string): void {
        if (!name || name.length === 0) { // Use length after trim
            throw new Error("Venue name cannot be empty.");
        }
        if (name.length > MAX_VENUE_NAME_LENGTH) {
            throw new Error(`Venue name cannot exceed ${MAX_VENUE_NAME_LENGTH} characters.`);
        }
    }

    private validateStreet(street: string): void {
        if (!street || street.length === 0) {
            throw new Error("Street address cannot be empty.");
        }
        if (street.length > MAX_STREET_LENGTH) {
            throw new Error(`Street address cannot exceed ${MAX_STREET_LENGTH} characters.`);
        }
    }

    private validateCity(city: string): void {
        if (!city || city.length === 0) {
            throw new Error("City cannot be empty.");
        }
        if (city.length > MAX_CITY_LENGTH) {
            throw new Error(`City name cannot exceed ${MAX_CITY_LENGTH} characters.`);
        }
    }

    private validateState(state: string): void { // Only called if state is not undefined
        if (state.length === 0) { // If provided, it should not be an empty string after trim
            throw new Error("State cannot be an empty string if provided.");
        }
        if (state.length > MAX_STATE_LENGTH) {
            throw new Error(`State name cannot exceed ${MAX_STATE_LENGTH} characters.`);
        }
    }

    private validateCountry(country: string): void {
        if (!country || country.length === 0) {
            throw new Error("Country cannot be empty.");
        }
        if (country.length > MAX_COUNTRY_LENGTH) {
            throw new Error(`Country name cannot exceed ${MAX_COUNTRY_LENGTH} characters.`);
        }
    }

    private validatePostalCode(postalCode: string): void { // Only called if postalCode is not undefined
        if (postalCode.length === 0) {
            throw new Error("Postal code cannot be an empty string if provided.");
        }
        if (postalCode.length > MAX_POSTAL_CODE_LENGTH) {
            throw new Error(`Postal code cannot exceed ${MAX_POSTAL_CODE_LENGTH} characters.`);
        }
    }

    private validatePlaceUrl(placeUrl: string): void { // Only called if placeUrl is not undefined and not empty
        try {
            new URL(placeUrl); // Simple URL validation
        } catch (error) {
            throw new Error(`Invalid URL format for place URL: ${placeUrl}`);
        }
    }

    public equals(other: Venue): boolean {
        if (!(other instanceof Venue)) return false;
        return (
            this.id === other.id &&
            this.name === other.name &&
            this.street === other.street &&
            this.city === other.city &&
            this.state === other.state &&
            this.country === other.country &&
            this.postalCode === other.postalCode &&
            this.placeUrl === other.placeUrl
        );
    }

    public static Builder = class VenueBuilder {
        private _id: number = -1; // Default ID for a new, unpersisted venue
        private _name: string = 'N/A';
        private _street: string = 'N/A';
        private _city: string = 'N/A';
        private _state: string ='N/A';
        private _country: string = 'N/A';
        private _postalCode?: string;
        private _placeUrl?: string;

        // Only use withId if reconstructing an existing Venue from data
        public withId(id: number): VenueBuilder {
            this._id = id;
            return this;
        }
        public withName(name: string): VenueBuilder {
            this._name = name;
            return this;
        }
        public withStreet(street: string): VenueBuilder {
            this._street = street;
            return this;
        }
        public withCity(city: string): VenueBuilder {
            this._city = city;
            return this;
        }
        public withState(state: string): VenueBuilder {
            this._state = state;
            return this;
        }
        public withCountry(country: string): VenueBuilder {
            this._country = country;
            return this;
        }
        public withPostalCode(postalCode: string | undefined): VenueBuilder {
            this._postalCode = postalCode;
            return this;
        }
        public withPlaceUrl(placeUrl: string | undefined): VenueBuilder {
            this._placeUrl = placeUrl;
            return this;
        }

        public build(): Venue {
            // Basic check for essential fields that should be set by the builder user
            if (!this._name.trim() || !this._street.trim() || !this._city.trim() || !this._country.trim()) {
                throw new Error("Missing required fields for Venue (name, street, city, country are mandatory in builder).");
            }
            return new Venue(
                this._id,
                this._name,
                this._street,
                this._city,
                this._state,
                this._country,
                this._postalCode,
                this._placeUrl
            );
        }
    }
}