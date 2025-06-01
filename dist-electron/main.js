"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const util_js_1 = require("./util.js");
const resourceManager_js_1 = require("./resourceManager.js");
const pathResolver_js_1 = require("./pathResolver.js");
const tray_js_1 = require("./tray.js");
const menu_js_1 = require("./menu.js");
const tracking_js_1 = require("./tracking.js");
electron_1.app.on('ready', () => {
    const mainWindow = new electron_1.BrowserWindow({
        webPreferences: {
            preload: (0, pathResolver_js_1.getPreloadPath)(),
            devTools: true
        },
        // disables default system frame (dont do this if you want a proper working menu bar)
        frame: true
    });
    if ((0, util_js_1.isDev)()) {
        mainWindow.loadURL('http://localhost:5123');
    }
    else {
        mainWindow.loadFile((0, pathResolver_js_1.getUIPath)());
    }
    (0, resourceManager_js_1.pollResources)(mainWindow);
    (0, util_js_1.ipcMainHandle)('getStaticData', () => {
        return (0, resourceManager_js_1.getStaticData)();
    });
    (0, util_js_1.ipcMainOn)('sendFrameAction', (payload) => {
        switch (payload) {
            case 'CLOSE':
                mainWindow.close();
                break;
            case 'MAXIMIZE':
                mainWindow.maximize();
                break;
            case 'MINIMIZE':
                mainWindow.minimize();
                break;
        }
    });
    (0, util_js_1.ipcMainHandle)('sendKeyword', async (payload) => {
        return new Promise(async (resolve, reject) => {
            const response = await (0, tracking_js_1.tracking)(payload);
            console.log('payload', payload);
            console.log('response', response);
            resolve(response);
        });
    });
    (0, tray_js_1.createTray)(mainWindow);
    handleCloseEvents(mainWindow);
    (0, menu_js_1.createMenu)(mainWindow);
});
function handleCloseEvents(mainWindow) {
    let willClose = false;
    mainWindow.on('close', (e) => {
        if (willClose) {
            return;
        }
        e.preventDefault();
        mainWindow.hide();
        if (electron_1.app.dock) {
            electron_1.app.dock.hide();
        }
    });
    electron_1.app.on('before-quit', () => {
        willClose = true;
    });
    mainWindow.on('show', () => {
        willClose = false;
    });
}
