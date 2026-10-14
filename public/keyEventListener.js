const { uIOhook, UiohookKey } = require('uiohook-napi')

let keyToPress = ""

function startListenForKeys(win){
    uIOhook.on('keydown', (e) => {
        if (e.keycode === UiohookKey.F2) {
            win.webContents.send('open-menu')
        }
    })

    uIOhook.start()
}

module.exports = { startListenForKeys }