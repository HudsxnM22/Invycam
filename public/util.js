const { app } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

class util {
    static getSettingsPath() {
        return path.join(app.getPath("userData"), "settings.json");
    }

    static getSecurityTokenPath() {
        return path.join(app.getPath("userData"), "security_token.jwt");
    }

    static getSettings() {
        try {
            const json = fs.readFileSync(this.getSettingsPath(), "utf8");
            return JSON.parse(json);
        } catch (error) {
            // First launch: no settings file yet.
            if (error.code === "ENOENT") {
                return { keyBindings: { changeMode: "F2" } };
            }

            throw error;
        }
    }

    static getKeyBindings() {
        const bindings = this.getSettings().keyBindings ?? {};
        return { ...bindings, changeMode: bindings.changeMode ?? "F2" };
    }

    static setKeyBinding(action, key) {
        const settings = this.getSettings();

        settings.keyBindings ??= {};
        settings.keyBindings[action] = key;

        const filePath = this.getSettingsPath();

        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(
            filePath,
            JSON.stringify(settings, null, 4),
            "utf8"
        );
    }

    static getSecurityToken() {
        try {
            const jwt = fs.readFileSync(this.getSecurityTokenPath(), "utf8");
            return jwt;
        } catch (error) {
            // First launch: no token file yet.
            if (error.code === "ENOENT") {
                return null;
            }

            throw error;
        }
    }

    static saveSecurityToken(token) {
        const filePath = this.getSecurityTokenPath();

        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, token, "utf8");
    }

    static clearSecurityToken() {
        const filePath = this.getSecurityTokenPath();

        try {
            fs.unlinkSync(filePath);
        } catch (error) {
            if (error.code !== "ENOENT") {
                throw error;
            }
        }
    }
}

module.exports = util;
