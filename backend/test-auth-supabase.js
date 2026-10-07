const http = require('http');

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('Testing Authentication with Supabase backend...');

  // 1. Lecturer Login
  const lecturerRes = await postJson('/api/auth/login', {
    email: 'jane.vance@school.edu',
    password: 'studentpass123'
  });
  console.log('1. Lecturer Login:', lecturerRes.status === 200 ? '✅ SUCCESS' : '❌ FAILED', lecturerRes.data.user?.name);

  // 2. Student Login by Matriculation Number
  const studentRes = await postJson('/api/auth/login', {
    email: '2024/1/89402CE',
    password: 'studentpass123'
  });
  console.log('2. Student Login by Matric No:', studentRes.status === 200 ? '✅ SUCCESS' : '❌ FAILED', studentRes.data.user?.name, `(Matric: ${studentRes.data.user?.matricNumber})`);
}

run().catch(console.error);
