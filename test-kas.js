import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_GAS_WEB_APP_URL;

async function test() {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'getManajemenKas',
      args: []
    })
  });
  const data = await res.json();
  console.log(data);
}
test();
