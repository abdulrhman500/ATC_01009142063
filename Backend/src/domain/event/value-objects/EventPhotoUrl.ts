export default class EventPhotoUrl {
    private readonly _url: string;

    constructor(url: string) {
        const sanitized = EventPhotoUrl.sanitize(url);

        if (!EventPhotoUrl.isValidUrlOrPath(sanitized)) {
            throw new Error(`Invalid URL or file path: ${url}`);
        }

        this._url = sanitized;
    }

    private static sanitize(input: string): string {
        let url = input.trim();

        // Normalize backslashes to forward slashes for consistency (except for Windows paths)
        if (!/^[a-zA-Z]:\\/.test(url) && !/^\\\\/.test(url)) {
            url = url.replace(/\\/g, '/');
        }

        // Remove duplicate slashes (e.g. `/folder//file` -> `/folder/file`)
        url = url.replace(/\/{2,}/g, '/');

        // Normalize hostnames to lowercase if it's a URL
        try {
            const parsed = new URL(url);
            parsed.hostname = parsed.hostname.toLowerCase();
            return parsed.toString();
        } catch {
            // Not a valid URL (probably a local path), just return sanitized string
            return url;
        }
    }

    private static isValidUrlOrPath(url: string): boolean {
        const pattern = new RegExp(
            '^(?:' +
                '(https?:\\/\\/)' +
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])?)\\.)+[a-z]{2,}|' +
                'localhost|' +
                '\\d{1,3}(\\.\\d{1,3}){3}|' +
                '\\[([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}\\])' +
                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
                '(\\?[;&a-z\\d%_.~+=-]*)?' +
                '(\\#[-a-z\\d_]*)?' +
            ')' +
            '|' +
            '([.~]?\\/?([\\w.-]+\\/?)*[\\w.-]*)' +
            '|' +
            '([a-zA-Z]:\\\\[\\w\\s.-\\\\]*|\\\\\\\\[\\w\\s.-]+\\\\[\\w\\s.-\\\\]+)' +
            ')$',
            'i'
        );
        return pattern.test(url);
    }

    get url(): string {
        return this._url;
    }

    toString(): string {
        return this._url;
    }
}
