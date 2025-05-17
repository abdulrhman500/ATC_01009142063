export interface IJwtPayload {
    userId: string; // Or number, depending on your UserId type
    username: string;
    role: string; // Or RoleType
    // Add any other essential, non-sensitive data
}

export interface IJwtService {
    generateToken(payload: IJwtPayload): Promise<{ accessToken: string; expiresIn: number }>;
    verifyToken(token: string): Promise<IJwtPayload | null>; // For auth middleware later
}