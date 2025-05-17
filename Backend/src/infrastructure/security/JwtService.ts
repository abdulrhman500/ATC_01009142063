import { injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import { IJwtPayload, IJwtService } from '@domain/user/interfaces/IJwtService'; // Adjust path as needed

@injectable()
export class JwtService implements IJwtService {
    private readonly secret: string;
    private readonly expiresInSeconds: number;

    constructor() {
        this.secret = process.env.JWT_SECRET || 'your-fallback-super-secret-key-32-chars'; // Fallback, but MUST be set in .env
        const expiresIn = process.env.JWT_EXPIRES_IN || '1h'; // e.g., 1h, 7d, 3600 (for seconds)

        if (!process.env.JWT_SECRET) {
            console.warn("⚠️ JWT_SECRET is not set in environment variables. Using a default, insecure key. THIS IS NOT SAFE FOR PRODUCTION.");
        }


        if (typeof expiresIn === 'string' && /^\d+$/.test(expiresIn)) { // if it's a string of numbers, assume seconds
            this.expiresInSeconds = parseInt(expiresIn, 10);
        } else if (typeof expiresIn === 'string') { // if it's a string like "1h", "7d"
            try {
                // jwt.sign uses zeit/ms for string conversion, but we need seconds for consistency
                const match = expiresIn.match(/^(\d+)([smhd])$/);
                if (match) {
                    const value = parseInt(match[1]);
                    const unit = match[2];
                    if (unit === 's') this.expiresInSeconds = value;
                    else if (unit === 'm') this.expiresInSeconds = value * 60;
                    else if (unit === 'h') this.expiresInSeconds = value * 60 * 60;
                    else if (unit === 'd') this.expiresInSeconds = value * 60 * 60 * 24;
                    else this.expiresInSeconds = 3600; // Default to 1 hour in seconds
                } else {
                     this.expiresInSeconds = 3600; // Default if format is unrecognized
                }
            } catch (e) {
                this.expiresInSeconds = 3600; // Default to 1 hour in seconds on error
            }
        }
         else {
            this.expiresInSeconds = 3600; // Default to 1 hour in seconds
        }
    }

    async generateToken(payload: IJwtPayload): Promise<{ accessToken: string; expiresIn: number }> {
        const accessToken = jwt.sign(payload, this.secret, {
            expiresIn: this.expiresInSeconds,
        });
        return { accessToken, expiresIn: this.expiresInSeconds };
    }

    async verifyToken(token: string): Promise<IJwtPayload | null> {
        try {
            const decoded = jwt.verify(token, this.secret) as IJwtPayload;
            return decoded;
        } catch (error) {
            return null; // Token is invalid or expired
        }
    }
}