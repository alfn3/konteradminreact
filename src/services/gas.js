/**
 * Wrapper for API calls
 * If running locally in dev mode, uses fetch() to the GAS Web App URL.
 * If built and running inside GAS, uses google.script.run.
 */

// Ganti URL ini melalui file .env (.env.local) di root proyek
// VITE_GAS_WEB_APP_URL=https://script.google.com/macros/s/..../exec
const SCRIPT_URL = import.meta.env.VITE_GAS_WEB_APP_URL;

const MAX_RETRIES = 2;
const RETRY_DELAY = 1500; // ms

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWithRetry(functionName, args, attempt = 0) {
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: functionName,
        args: args
      }),
    });

    // Cek jika respons bukan OK
    if (!response.ok) {
      const text = await response.text();
      // Jika respons HTML (bukan JSON), kemungkinan redirect gagal
      if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        throw new Error(`Server returned HTML instead of JSON (Status ${response.status})`);
      }
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
    }

    const text = await response.text();
    
    // Kadang GAS mengembalikan HTML meskipun status 200 (redirect issue)
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html') || text.startsWith('<HTML')) {
      throw new Error('Redirect issue: received HTML instead of JSON');
    }

    return JSON.parse(text);
  } catch (err) {
    // Retry jika masih ada kesempatan
    if (attempt < MAX_RETRIES) {
      console.warn(`[GAS API] Retry ${attempt + 1}/${MAX_RETRIES} for ${functionName}:`, err.message);
      await sleep(RETRY_DELAY * (attempt + 1));
      return fetchWithRetry(functionName, args, attempt + 1);
    }
    throw err;
  }
}

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
        fetchWithRetry(functionName, args)
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
