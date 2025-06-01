"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tracking = void 0;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const tracking = (data) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path_1.default.resolve('./src/python/search_google.py');
        const jsonData = JSON.stringify(data);
        const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
        console.log('jsonData', jsonData);
        (0, child_process_1.execFile)(pythonCommand, [scriptPath, jsonData], (error, stdout, stderr) => {
            if (error) {
                console.error('Error ejecutando Python:', error);
                return reject(error);
            }
            try {
                const results = JSON.parse(stdout);
                resolve(results);
            }
            catch (e) {
                console.error('Error parseando salida:', e);
                console.log('Salida cruda de Python:', stdout);
                reject(e);
            }
        });
    });
};
exports.tracking = tracking;
