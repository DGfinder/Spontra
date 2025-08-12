#!/usr/bin/env node

const http = require('http');

const testAPI = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/hello',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('API Test Results:');
      console.log('Status Code:', res.statusCode);
      console.log('Response:', JSON.parse(data));
      console.log('✅ API is working!');
    });
  });

  req.on('error', (error) => {
    console.error('❌ API test failed:', error.message);
    console.log('Make sure the Next.js dev server is running: cd frontend && npm run dev');
  });

  req.end();
};

console.log('Testing /api/hello endpoint...');
testAPI();