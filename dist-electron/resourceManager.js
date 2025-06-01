"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pollResources = pollResources;
exports.getStaticData = getStaticData;
const os_utils_1 = __importDefault(require("os-utils"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const util_js_1 = require("./util.js");
const POLLING_INTERVAL = 500;
function pollResources(mainWindow) {
    setInterval(async () => {
        const cpuUsage = await getCpuUsage();
        const ramUsage = getRamUsage();
        const storageData = getStorageData();
        (0, util_js_1.ipcWebContentsSend)("statistics", mainWindow.webContents, {
            cpuUsage,
            ramUsage,
            storageUsage: storageData.usage,
        });
    }, POLLING_INTERVAL);
}
function getStaticData() {
    const totalStorage = getStorageData().total;
    const cpuModel = os_1.default.cpus()[0].model;
    const totalMemoryGB = Math.floor(os_utils_1.default.totalmem() / 1024);
    return {
        totalStorage,
        cpuModel,
        totalMemoryGB,
    };
}
function getCpuUsage() {
    return new Promise((resolve) => {
        os_utils_1.default.cpuUsage(resolve);
    });
}
function getRamUsage() {
    return 1 - os_utils_1.default.freememPercentage();
}
function getStorageData() {
    // requires node 18
    const stats = fs_1.default.statfsSync(process.platform === "win32" ? "C://" : "/");
    const total = stats.bsize * stats.blocks;
    const free = stats.bsize * stats.bfree;
    return {
        total: Math.floor(total / 1_000_000_000),
        usage: 1 - free / total,
    };
}
