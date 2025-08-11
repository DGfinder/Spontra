// Debug script to check what's happening with the login page
const fs = require('fs');

console.log('=== Admin Login Page Debug ===\n');

// Check if the login page file exists
const loginPagePath = './src/app/admin/login/page.tsx';
const layoutPath = './src/app/admin/layout.tsx';

if (fs.existsSync(loginPagePath)) {
    console.log('✅ Login page file exists:', loginPagePath);
    
    const content = fs.readFileSync(loginPagePath, 'utf8');
    console.log('📝 Page exports:', content.match(/export\s+default\s+function\s+\w+/g) || 'No default export found');
    console.log('🏷️  Has "use client":', content.includes("'use client'"));
    
} else {
    console.log('❌ Login page file NOT found:', loginPagePath);
}

if (fs.existsSync(layoutPath)) {
    console.log('✅ Admin layout file exists:', layoutPath);
    
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    console.log('🔒 Layout excludes login page:', layoutContent.includes("pathname === '/admin/login'"));
    
} else {
    console.log('❌ Admin layout file NOT found:', layoutPath);
}

// Check build output
const buildDir = './.next/static/chunks/app/admin/login/';
if (fs.existsSync(buildDir)) {
    console.log('✅ Login page built successfully');
    const files = fs.readdirSync(buildDir);
    console.log('📦 Built files:', files);
} else {
    console.log('❌ Login page NOT built');
}

console.log('\n=== Testing Server Response ===');

const http = require('http');
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/admin/login',
  method: 'GET',
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
};

const req = http.request(options, (res) => {
  console.log(`🌐 Status: ${res.statusCode}`);
  console.log(`📊 Content-Length: ${res.headers['content-length']}`);
  console.log(`🏷️  Content-Type: ${res.headers['content-type']}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    // Check for React error patterns
    const hasReactError = body.includes('Minified React error') || body.includes('invariant');
    const hasErrorBoundary = body.includes('__next_error__');
    const hasLoginContent = body.includes('Email Address') || body.includes('Spontra Admin');
    const hasLoadingSpinner = body.includes('animate-spin');
    
    console.log('\n--- Content Analysis ---');
    console.log('🚨 Has React Error:', hasReactError);
    console.log('🚨 Has Error Boundary:', hasErrorBoundary);
    console.log('📝 Has Login Content:', hasLoginContent);
    console.log('⏳ Has Loading Spinner:', hasLoadingSpinner);
    
    if (hasReactError) {
      console.log('⚠️  React error detected!');
    }
    if (hasErrorBoundary) {
      console.log('⚠️  Error boundary activated!');
    }
    if (hasLoadingSpinner) {
      console.log('⚠️  Still showing loading spinner!');
    }
    
    if (body.length < 100) {
      console.log('\n--- Raw Response ---');
      console.log(body);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request error: ${e.message}`);
});

req.end();