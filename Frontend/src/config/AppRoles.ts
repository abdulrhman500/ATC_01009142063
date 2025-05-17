// src/config/AppRoles.ts
export enum AppRoles {
    Admin = 'admin',      // Value is 'admin'
    Customer = 'customer',// Changed from User to Customer, value is 'customer'
    // Guest = 'guest',   // 'guest' is typically represented by an unauthenticated state (user === null),
                          // rather than an assigned role to an authenticated user.
                          // You can keep it if 'guest' is an actual role your backend might assign to a logged-in user.
                          // For most cases, checking `!isAuthenticated` handles guests.
  }
  
  // You might also want a type for convenience if you use this enum widely:
  export type AppUserRole = AppRoles.Admin | AppRoles.Customer; // For authenticated user roles