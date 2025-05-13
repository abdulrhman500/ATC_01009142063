const MAX_STREET_LENGTH = 100;
const MAX_CITY_LENGTH = 50;
const MAX_STATE_LENGTH = 50;
const MAX_COUNTRY_LENGTH = 50;
const MAX_POSTAL_CODE_LENGTH = 20;

export default class Venue {
  readonly id: number;
  readonly name: string;
  readonly street: string;
  readonly city: string;
  readonly state?: string;
  readonly country: string;
  readonly postalCode?: string;
  readonly placeUrl?: string;

  private constructor(
    id: number,
    name: string,
    street: string,
    city: string,
    state: string | undefined,
    country: string,
    postalCode: string | undefined,
    placeUrl?: string
  ) {
    this.validateId(id);
    this.validateName(name);
    this.validateStreet(street);
    this.validateCity(city);
    this.validateCountry(country);

    // Optional fields validation
    if (state !== undefined) this.validateState(state);
    if (postalCode !== undefined) this.validatePostalCode(postalCode);
    if (placeUrl !== undefined) this.validatePlaceUrl(placeUrl);

    this.id = id;
    this.name = name;
    this.street = street;
    this.city = city;
    this.state = state;
    this.country = country;
    this.postalCode = postalCode;
    this.placeUrl = placeUrl;
  }

  private validateId(id: number): void {
    if (id <= 0) {
      throw new Error("Venue ID must be a positive number");
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("Venue name cannot be empty");
    }

    if (name.trim().length > 100) {
      throw new Error("Venue name cannot exceed 100 characters");
    }
  }

  private validateStreet(street: string): void {
    if (!street || street.trim().length === 0) {
      throw new Error("Street address cannot be empty");
    }

    if (street.trim().length > MAX_STREET_LENGTH) {
      throw new Error(`Street address cannot exceed ${MAX_STREET_LENGTH} characters`);
    }
  }

  private validateCity(city: string): void {
    if (!city || city.trim().length === 0) {
      throw new Error("City cannot be empty");
    }

    if (city.trim().length > MAX_CITY_LENGTH) {
      throw new Error(`City name cannot exceed ${MAX_CITY_LENGTH} characters`);
    }
  }

  private validateState(state: string): void {
    if (state.trim().length === 0) {
      throw new Error("State cannot be empty if provided");
    }

    if (state.trim().length > MAX_STATE_LENGTH) {
      throw new Error(`State name cannot exceed ${MAX_STATE_LENGTH} characters`);
    }
  }

  private validateCountry(country: string): void {
    if (!country || country.trim().length === 0) {
      throw new Error("Country cannot be empty");
    }

    if (country.trim().length > MAX_COUNTRY_LENGTH) {
      throw new Error(`Country name cannot exceed ${MAX_COUNTRY_LENGTH} characters`);
    }
  }

  private validatePostalCode(postalCode: string): void {
    if (postalCode.trim().length === 0) {
      throw new Error("Postal code cannot be empty if provided");
    }

    if (postalCode.trim().length > MAX_POSTAL_CODE_LENGTH) {
      throw new Error(`Postal code cannot exceed ${MAX_POSTAL_CODE_LENGTH} characters`);
    }
  }

  private validatePlaceUrl(placeUrl: string): void {
    if (placeUrl.trim().length === 0) {
      throw new Error("Place URL cannot be empty if provided");
    }

    try {
      new URL(placeUrl);
    } catch (error) {
      throw new Error("Invalid URL format for place URL");
    }
  }

  // Value object equality check
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

  // Builder pattern implementation
  public static Builder = class VenueBuilder {
    private _id: number = 0;
    private _name: string = '';
    private _street: string = '';
    private _city: string = '';
    private _state?: string;
    private _country: string = '';
    private _postalCode?: string;
    private _placeUrl?: string;

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

    public withPostalCode(postalCode: string): VenueBuilder {
      this._postalCode = postalCode;
      return this;
    }

    public withPlaceUrl(placeUrl: string): VenueBuilder {
      this._placeUrl = placeUrl;
      return this;
    }

    public build(): Venue {
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