"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require('electron');
electron.contextBridge.exposeInMainWorld('electron', {
    subscribeStatistics: (callback) => ipcOn('statistics', (stats) => {
        callback(stats);
    }),
    subscribeChangeView: (callback) => ipcOn('changeView', (view) => {
        callback(view);
    }),
    getStaticData: () => ipcInvoke('getStaticData'),
    sendFrameAction: (payload) => ipcSend('sendFrameAction', payload),
    sendKeyword: (payload) => ipcInvoke('sendKeyword', payload)
});
function ipcInvoke(key, payload) {
    return electron.ipcRenderer.invoke(key, payload);
}
function ipcOn(key, callback) {
    const cb = (_, payload) => callback(payload);
    electron.ipcRenderer.on(key, cb);
    return () => electron.ipcRenderer.off(key, cb);
}
function ipcSend(key, payload) {
    electron.ipcRenderer.send(key, payload);
}
