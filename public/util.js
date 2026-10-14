const { app } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

class util {
    static getSettingsPath() {
        return path.join(app.getPath("userData"), "settings.json");
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
}

module.exports = util;
