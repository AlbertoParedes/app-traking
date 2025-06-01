"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMenu = createMenu;
const electron_1 = require("electron");
const util_js_1 = require("./util.js");
function createMenu(mainWindow) {
    electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate([
        {
            label: process.platform === "darwin" ? undefined : "App",
            type: "submenu",
            submenu: [
                {
                    label: "Quit",
                    click: electron_1.app.quit,
                },
                {
                    label: "DevTools",
                    click: () => mainWindow.webContents.openDevTools(),
                    visible: (0, util_js_1.isDev)(),
                },
            ],
        },
        {
            label: "View",
            type: "submenu",
            submenu: [
                {
                    label: "CPU",
                    click: () => (0, util_js_1.ipcWebContentsSend)("changeView", mainWindow.webContents, "CPU"),
                },
                {
                    label: "RAM",
                    click: () => (0, util_js_1.ipcWebContentsSend)("changeView", mainWindow.webContents, "RAM"),
                },
                {
                    label: "STORAGE",
                    click: () => (0, util_js_1.ipcWebContentsSend)("changeView", mainWindow.webContents, "STORAGE"),
                },
            ],
        },
    ]));
}
