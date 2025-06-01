"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTray = createTray;
const electron_1 = require("electron");
const pathResolver_js_1 = require("./pathResolver.js");
const path_1 = __importDefault(require("path"));
function createTray(mainWindow) {
    const tray = new electron_1.Tray(path_1.default.join((0, pathResolver_js_1.getAssetPath)(), process.platform === "darwin" ? "trayIconTemplate.png" : "trayIcon.png"));
    tray.setContextMenu(electron_1.Menu.buildFromTemplate([
        {
            label: "Show",
            click: () => {
                mainWindow.show();
                if (electron_1.app.dock) {
                    electron_1.app.dock.show();
                }
            },
        },
        {
            label: "Quit",
            click: () => electron_1.app.quit(),
        },
    ]));
}
