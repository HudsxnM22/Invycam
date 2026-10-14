const { uIOhook, UiohookKey } = require('uiohook-napi')
const util = require("./util");

function normalizeKeyName(key) {
    if (typeof key !== "string") return null

    const aliases = {
        " ": "Space",
        Control: "Ctrl",
        ";": "Semicolon",
        "=": "Equal",
        ",": "Comma",
        "-": "Minus",
        ".": "Period",
        "/": "Slash",
        "`": "Backquote",
        "[": "BracketLeft",
        "\\": "Backslash",
        "]": "BracketRight",
        "'": "Quote",
    }

    const name = Object.prototype.hasOwnProperty.call(aliases, key)
        ? aliases[key]
        : /^[a-z]$/i.test(key) ? key.toUpperCase() : key

    // Unsupported keys must not silently become another binding.
    return Object.prototype.hasOwnProperty.call(UiohookKey, name) ? name : null
}

let keyToPress = normalizeKeyName(util.getKeyBindings().changeMode)

function startListenForKeys(win){
    uIOhook.on('keydown', (e) => {
        if (keyToPress !== null && e.keycode === UiohookKey[keyToPress]) {
            win.webContents.send('open-menu')
        }
    })

    uIOhook.start()
}

function updateKeyBinding(key) {
    // The existing keydown callback reads this value on each key press.
    keyToPress = normalizeKeyName(key)
}

module.exports = { startListenForKeys, normalizeKeyName, updateKeyBinding }
