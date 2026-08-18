/**
 * Wrapper for API calls
 * If running locally in dev mode, uses fetch() to the GAS Web App URL.
 * If built and running inside GAS, uses google.script.run.
 */

// Ganti URL ini melalui file .env (.env.local) di root proyek
// VITE_GAS_WEB_APP_URL=https://script.google.com/macros/s/..../exec
const SCRIPT_URL = import.meta.env.VITE_GAS_WEB_APP_URL;

export const gasService = {
  async call(functionName, ...args) {
    return new Promise((resolve, reject) => {
      // 1. Cek apakah berjalan di Production (di dalam Google Apps Script)
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler((res) => {
            if (res && res.error) reject(new Error(res.message));
            else resolve(res);
          })
          .withFailureHandler((err) => reject(err))
          [functionName](...args);
      } 
      // 2. Cek apakah berjalan di Development (Localhost Vite)
      else if (SCRIPT_URL) {
        console.log(`[GAS API] Fetching: ${functionName}`, args);
        
        fetch(SCRIPT_URL, {
          method: 'POST',
          // Gunakan text/plain untuk menghindari CORS Preflight (OPTIONS request) di browser
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            action: functionName,
            args: args
          }),
        })
        .then(response => response.json())
        .then(res => {
          if (res && res.error) reject(new Error(res.message));
          else resolve(res);
        })
        .catch(err => {
          console.error(`[GAS API Error] ${functionName}:`, err);
          reject(err);
        });
      } 
      // 3. Fallback jika URL belum di set
      else {
        console.warn(`[GAS API Warning] VITE_GAS_WEB_APP_URL belum di-set di file .env!`);
        reject(new Error("URL Web App GAS belum dikonfigurasi."));
      }
    });
  }
};
