export default class EventPhotoUrl {

    private readonly _url: string;

    constructor(url: string) {
        this.validateUrl(url);
        
        this._url = url;
    }

    private validateUrl(url: string): void {
        const urlPattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])?)\\.)+[a-z]{2,}|' + // domain name
            'localhost|' + // localhost
            '\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}|' + // ipv4
            '\\[([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}\\])' + // ipv6
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
        if (!urlPattern.test(url)) {
            throw new Error('Invalid URL');
        }
    }
    get url(): string {
        return this._url;
    }

    toString(): string {
        return this._url;
    }
}

