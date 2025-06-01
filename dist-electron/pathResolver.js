"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreloadPath = getPreloadPath;
exports.getUIPath = getUIPath;
exports.getAssetPath = getAssetPath;
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
const util_js_1 = require("./util.js");
function getPreloadPath() {
    return path_1.default.join(electron_1.app.getAppPath(), (0, util_js_1.isDev)() ? "." : "..", "/dist-electron/preload.cjs");
}
function getUIPath() {
    return path_1.default.join(electron_1.app.getAppPath(), "/dist-react/index.html");
}
function getAssetPath() {
    return path_1.default.join(electron_1.app.getAppPath(), (0, util_js_1.isDev)() ? "." : "..", "/src/assets");
}
