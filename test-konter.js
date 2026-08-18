const fetch = require('node-fetch');

async function test() {
  const url = "https://script.google.com/macros/s/AKfycbywkutP2dn9KXvtH9-F5FoY1Hs4aB6UknKtf8EWuGPk3VQ8UqpEFiPHm6bYvuSunh21/exec";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action: "getKonter" })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
