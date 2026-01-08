// Configuration for backend services
// Note: JWT_SECRET should be set in production, but we allow a dev fallback for local testing

const getJwtSecret = (): string => {
     const secret = process.env.JWT_SECRET;
     if (!secret) {
          if (process.env.NODE_ENV === "production") {
               throw new Error("FATAL: JWT_SECRET environment variable is not set. Server cannot start without it.");
          }
          // Development fallback - only for local testing
          console.warn("WARNING: JWT_SECRET not set. Using insecure default for development.");
          return "dev-secret-change-in-production";
     }
     return secret;
};

export const JWT_SECRET: string = getJwtSecret();

// JWT token expiry in seconds (default: 7 days = 604800 seconds)
export const JWT_EXPIRY = parseInt(process.env.JWT_EXPIRY_SECONDS || "604800", 10);

// Bcrypt salt rounds (higher = more secure but slower)
export const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "12", 10);