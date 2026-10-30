import axios from "axios";
import useClientStore from "../Hooks/useClientStore";
import useModeStore from "../Hooks/useModeStore"

const API_URL = "http://localhost:8000/api";

/**
 * Client for the backend auth endpoints. All members are static, so use it as `AuthService.login(...)`
 * without creating an instance.
 *
 * Service-level failures (wrong password, taken username, bad reset code) come back as a 200 with
 * an `error` field in the response data. Token failures (401/403) and validation failures (422)
 * are non-2xx, so axios rejects and the method throws.
 */
export class AuthService {
    /**
     * Long standing access token (7 days). Set by login, register and resetPassword.
     * @type {string|null}
     */
    static jwtToken = null;

    /**
     * Short lived reset token (10 minutes). Set by verifyResetToken, consumed and cleared by resetPassword.
     * @type {string|null}
     */
    static resetToken = null;

    /**
     * Verifies the JWT token stored in the application. If it's valid, restores the session
     * (`jwtToken` + `loggedIn`). If it's invalid or expired, logs out to clear it.
     * @returns {Promise<boolean>} - Returns true if the current stored token is valid, false otherwise.
     */
    static async verifyToken() {
        const { token: storedToken } = await window.ipc.getSecurityToken();
        if (!storedToken) {
            return false;
        }
        let username = ""

        try {
            const response = await axios.get(`${API_URL}/verify-token`, {
                headers: { Authorization: `Bearer ${storedToken}` }
            });
            
            username = response.data.username
        } catch (error) {
            if (error.response?.status === 401) {
                await this.logout();
            }
            return false;
        }

        await this.setSession(storedToken, username);
        return true;
    }

    /**
     * Stores an access token everywhere the app needs it: in memory, on disk via IPC, and marks the store as logged in.
     * Does nothing if there's no token, e.g. when the backend returned `{error}`.
     * @param {string|null} token - Access token from the backend.
     * @returns {Promise<void>}
     */
    static async setSession(token, username) {
        if (!token) {
            return;
        }
        this.jwtToken = token;
        await window.ipc.saveSecurityToken(token);
        useClientStore.getState().setLoggedIn(true);
        useClientStore.getState().setUsername(username);
    }

    /**
     * Logs in with an existing account and stores the returned access token in `jwtToken`.
     * @param {string} email - Account email.
     * @param {string} password - Plain text password.
     * @returns {Promise<{message: string, username: string, token: string} | {error: string}>}
     *   The new session on success, or `{error}` if the email or password is wrong.
     */
    static async login(email, password) {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        await this.setSession(response.data.token, response.data.username);
        return response.data;
    }

    /**
     * Creates a new account and stores the returned access token in `jwtToken`, so the user is logged in right away.
     * @param {string} username - Unique username, max 30 characters.
     * @param {string} email - Unique account email.
     * @param {string} password - Plain text password, hashed by the backend.
     * @returns {Promise<{message: string, username: string, token: string} | {error: string}>}
     *   The new session on success, or `{error}` if the username or email is taken.
     */
    static async register(username, email, password) {
        const response = await axios.post(`${API_URL}/create-account`, { username, email, password });
        await this.setSession(response.data.token, response.data.username);
        return response.data;
    }

    /**
     * Starts the forgot password flow. The backend emails a 6 digit reset code if the account exists.
     * The response is the same whether or not the email has an account.
     * @param {string} email - Account email to send the reset code to.
     * @returns {Promise<{message: string}>}
     */
    static async requestPasswordReset(email) {
        const response = await axios.post(`${API_URL}/forgot-password`, { email });
        return response.data;
    }

    /**
     * Checks the emailed reset code. On success stores the short lived reset token in `resetToken`
     * for resetPassword to use. The code is single use.
     * @param {string} email - Account email the code was sent to.
     * @param {string} code - 6 digit reset code from the email.
     * @returns {Promise<{message: string, temp_token: string} | {error: string}>}
     *   The reset token on success, or `{error}` if the email or code is wrong.
     */
    static async verifyResetToken(email, code) {
        const response = await axios.post(`${API_URL}/new-password-authenticate`, { email, code });
        this.resetToken = response.data.temp_token || null;
        return response.data;
    }

    /**
     * Sets a new password using the reset token from verifyResetToken, sent as a Bearer header.
     * On success stores the returned access token in `jwtToken` and clears `resetToken`.
     * @param {string} email - Account email. Required by the backend model, but the account is taken from the reset token.
     * @param {string} newPassword - New plain text password.
     * @returns {Promise<{message: string, token: string}>} The new session.
     * @throws {import("axios").AxiosError} 401 if the reset token is missing, invalid or expired.
     */
    static async resetPassword(email, newPassword) {
        const response = await axios.post(
            `${API_URL}/new-password`,
            { email, new_password: newPassword },
            { headers: { Authorization: `Bearer ${this.resetToken}` } }
        );
        this.resetToken = null;
        await this.setSession(response.data.token, response.data.username);
        return response.data;
    }

    /**
     * Starts the Discord OAuth flow: asks the backend for Discord's authorize URL, then opens it
     * in the user's system browser. The backend's callback handles the rest and fires the
     * "oauth-login-event" IPC event once a session is ready.
     * @returns {Promise<void>}
     */
    static async loginWithDiscord() {
        const response = await axios.get(`${API_URL}/auth/discord/login`);
        //enter operation mode so that the user can interact with their browser to authorize discord. can be fixed with their hotkey.
        await useModeStore.setState({ mode: "operation" })
        await window.ipc.enterOperationMode();
        await window.ipc.openExternal(response.data.url);
    }

    /**
     * Logs out locally: clears both tokens from memory, deletes the saved token file, and marks the store as logged out.
     * JWTs are stateless, so there's no backend call. The old token stays valid until it expires.
     * @returns {Promise<void>}
     */
    static async logout() {
        this.jwtToken = null;
        this.resetToken = null;
        await window.ipc.clearSecurityToken();
        useClientStore.getState().setLoggedIn(false);
    }
}
