const url = 'https://script.google.com/macros/s/AKfycbywkutP2dn9KXvtH9-F5FoY1Hs4aB6UknKtf8EWuGPk3VQ8UqpEFiPHm6bYvuSunh21/exec';

const gasService = {
  call: async (action, ...args) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, args })
    });
    return res.json();
  }
};

async function test() {
  console.log("Fetching getDataStok to inject custom code...");
  // We can't inject easily, but wait, do we have an API to get raw data?
  // Let's check what APIs are available.
  try {
    const res = await gasService.call('getDataStok', 'KARTU');
    console.log("Result KARTU:", res.data ? res.data.length : res);
  } catch (e) {
    console.error("Error:", e);
  }
}

test();
