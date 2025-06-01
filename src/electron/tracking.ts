import { execFile } from 'child_process';
import path from 'path';

export const tracking = (data: any) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve('./src/python/search_google.py');

    const jsonData = JSON.stringify(data);
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

    console.log('jsonData', jsonData);
    console.log('pythonCommand', pythonCommand);

    execFile(pythonCommand, [scriptPath, jsonData], (error, stdout, stderr) => {
      if (error) {
        console.error('Error ejecutando Python:', error);
        return reject(error);
      }

      try {
        const results = JSON.parse(stdout);
        resolve(results);
      } catch (e) {
        console.error('Error parseando salida:', e);
        console.log('Salida cruda de Python:', stdout);
        reject(e);
      }
    });
  });
};
