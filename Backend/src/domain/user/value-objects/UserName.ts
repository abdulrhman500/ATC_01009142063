// src/domain/user/value-objects/UserName.ts
import UserNamingException from '@shared/exceptions/UserNamingException'; // Ensure this path is correct

export default class UserName {
    // Define reasonable min/max lengths for individual name parts
    private static readonly MIN_PART_LENGTH = 1; // e.g., first/last name can't be just one letter if desired
    private static readonly MAX_PART_LENGTH = 50; // Max length for any single name part

    public readonly first: string;
    public readonly middle: string; // Can be an empty string
    public readonly last: string;

    constructor(first: string, middle: string, last: string) {
        this.first = this.validateNamePart(first, "First name");
        // Middle name can be an empty string (e.g. from DB default or optional input).
        // If it's not empty, then it should be validated like other parts.
        this.middle = middle.trim() === "" ? "" : this.validateNamePart(middle, "Middle name");
        this.last = this.validateNamePart(last, "Last name");
    }

    private validateNamePart(namePartInput: string, partDisplayName: string): string {
        const trimmedNamePart = namePartInput.trim();

        // Allow middle name to be an empty string after trimming.
        // First and Last names cannot be empty.
        if (trimmedNamePart === "") {
            if (partDisplayName === "Middle name") {
                return ""; // Valid: empty middle name
            } else {
                throw new UserNamingException(`${partDisplayName} cannot be empty.`);
            }
        }

        // Length checks apply to non-empty trimmed parts
        if (trimmedNamePart.length < UserName.MIN_PART_LENGTH) {
            throw new UserNamingException(
                `${partDisplayName} "${trimmedNamePart}" is too short. Minimum length is ${UserName.MIN_PART_LENGTH} character(s).`
            );
        }
        if (trimmedNamePart.length > UserName.MAX_PART_LENGTH) {
            throw new UserNamingException(
                `${partDisplayName} cannot exceed ${UserName.MAX_PART_LENGTH} characters.`
            );
        }

        // Regex: Allows letters (including common accented ones like À-ÿ),
        // and single internal spaces, hyphens, or apostrophes as separators between sequences of letters.
        // Does not allow these separators at the very start or end of the name part.
        // Does not allow consecutive separators.
        const nameRegex = /^[a-zA-ZÀ-ÿ]+(?:[ '-][a-zA-ZÀ-ÿ]+)*$/u;
        // For basic English letters only (no accents) and only space/hyphen (no apostrophe):
        // const nameRegex = /^[a-zA-Z]+(?:[ -][a-zA-Z]+)*$/;

        if (!nameRegex.test(trimmedNamePart)) {
            throw new UserNamingException(
                `${partDisplayName} "${trimmedNamePart}" contains invalid characters or formatting. ` +
                `Only letters, and single internal spaces, hyphens, or apostrophes (if applicable) are allowed between words.`
            );
        }
        return trimmedNamePart; // Return the validated and trimmed version
    }

    public getFirstName(): string {
        return this.first;
    }

    public getMiddleName(): string { // Returns "" if it was empty
        return this.middle;
    }

    public getLastName(): string {
        return this.last;
    }

    public getFullName(): string {
        return [this.first, this.middle, this.last]
            .filter(part => part && part.length > 0) // Filter out empty parts before joining
            .join(' ');
    }

    public equals(other: UserName): boolean {
        if (!other || !(other instanceof UserName)) {
            return false;
        }
        return this.first === other.first &&
               this.middle === other.middle &&
               this.last === other.last;
    }
}