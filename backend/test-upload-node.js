const http = require('http');
const fs = require('fs');
const path = require('path');

async function testUpload(targetPort) {
  // 1. Login
  const token = await new Promise((resolve, reject) => {
    const data = JSON.stringify({ email: 'jane.vance@school.edu', password: 'studentpass123' });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b).token));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });

  // 2. Upload multipart test
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const fileContent = 'AuraClass Test Document Upload';
  const postData = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="document"; filename="test_assignment.txt"',
    'Content-Type: text/plain',
    '',
    fileContent,
    `--${boundary}--`
  ].join('\r\n');

  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: targetPort,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(b) }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('Testing upload to port 5000 (direct backend)...');
  const res5000 = await testUpload(5000);
  console.log('Port 5000 Result:', res5000.status, res5000.data.file?.originalName, res5000.data.file?.url);

  console.log('Testing upload to port 5173 (Vite proxy)...');
  const res5173 = await testUpload(5173);
  console.log('Port 5173 Result:', res5173.status, res5173.data.file?.originalName, res5173.data.file?.url);
}

run().catch(console.error);
