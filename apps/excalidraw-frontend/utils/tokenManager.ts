import { HTTP_BACKEND } from "@/config";

const TOKEN_KEY = "auth_token";
const TOKEN_EXPIRY_KEY = "auth_token_expiry";

export const tokenManager = {
	/**
	 * Set token with expiration time (24 hours by default)
	 */
	setToken: (token: string, expiresIn: number = 24 * 60 * 60 * 1000) => {
		try {
			localStorage.setItem(TOKEN_KEY, token);
			const expiry = new Date().getTime() + expiresIn;
			localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.toString());
		} catch (error) {
			console.error("Failed to set token:", error);
		}
	},

	/**
	 * Get token if valid and not expired
	 */
	getToken: (): string | null => {
		try {
			const token = localStorage.getItem(TOKEN_KEY);
			const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

			if (!token || !expiry) return null;

			const expiryTime = parseInt(expiry, 10);
			const currentTime = new Date().getTime();

			// If token is expired, clear it
			if (currentTime > expiryTime) {
				tokenManager.clearToken();
				return null;
			}

			return token;
		} catch (error) {
			console.error("Failed to get token:", error);
			return null;
		}
	},

	/**
	 * Check if token exists and is valid
	 */
	hasValidToken: (): boolean => {
		return tokenManager.getToken() !== null;
	},

	/**
	 * Validate token with backend
	 */
	validateToken: async (): Promise<boolean> => {
		try {
			const token = localStorage.getItem(TOKEN_KEY);
			if (!token) return false;

			const response = await fetch(`${HTTP_BACKEND}/user/validate`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				return true;
			} else {
				// Token is invalid, clear it
				tokenManager.clearToken();
				return false;
			}
		} catch (error) {
			console.error("Token validation failed:", error);
			// On network error, assume token might still be valid
			// but return false to be safe
			return false;
		}
	},

	/**
	 * Refresh token with backend (if refresh endpoint exists)
	 */
	refreshToken: async (): Promise<boolean> => {
		try {
			const token = localStorage.getItem(TOKEN_KEY);
			if (!token) return false;

			const response = await fetch(`${HTTP_BACKEND}/user/refresh`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				const data = await response.json();
				if (data.token) {
					tokenManager.setToken(data.token);
					return true;
				}
			}
			return false;
		} catch (error) {
			console.error("Token refresh failed:", error);
			return false;
		}
	},

	/**
	 * Clear token from storage
	 */
	clearToken: () => {
		try {
			localStorage.removeItem(TOKEN_KEY);
			localStorage.removeItem(TOKEN_EXPIRY_KEY);
		} catch (error) {
			console.error("Failed to clear token:", error);
		}
	},

	/**
	 * Get time remaining before token expires (in milliseconds)
	 */
	getTimeUntilExpiry: (): number => {
		try {
			const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
			if (!expiry) return 0;

			const expiryTime = parseInt(expiry, 10);
			const currentTime = new Date().getTime();
			const remaining = expiryTime - currentTime;

			return remaining > 0 ? remaining : 0;
		} catch (error) {
			console.error("Failed to get expiry time:", error);
			return 0;
		}
	},

	/**
	 * Check if token is about to expire (within 5 minutes)
	 */
	isAboutToExpire: (): boolean => {
		const timeRemaining = tokenManager.getTimeUntilExpiry();
		const fiveMinutesInMs = 5 * 60 * 1000;
		return timeRemaining < fiveMinutesInMs && timeRemaining > 0;
	},
};
