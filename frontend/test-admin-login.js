const http = require('http');

// Simple test to fetch the admin login page and check for React errors
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/admin/login',
  method: 'GET'
};

console.log('Testing admin login page...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('Response received successfully');
    
    // Check if the HTML contains expected admin login elements
    const hasLoginForm = body.includes('Email Address');
    const hasPasswordField = body.includes('Password');
    const hasSubmitButton = body.includes('Sign In');
    const hasReactError = body.includes('Minified React error');
    const hasAdminTitle = body.includes('Spontra Admin');
    
    console.log('\n--- Page Content Analysis ---');
    console.log('Has Login Form:', hasLoginForm);
    console.log('Has Password Field:', hasPasswordField);
    console.log('Has Submit Button:', hasSubmitButton);
    console.log('Has Admin Title:', hasAdminTitle);
    console.log('Has React Error:', hasReactError);
    
    if (hasLoginForm && hasPasswordField && hasSubmitButton && hasAdminTitle && !hasReactError) {
      console.log('\n✅ SUCCESS: Admin login page appears to be working correctly!');
    } else {
      console.log('\n❌ ISSUE: Admin login page may have problems');
      if (hasReactError) {
        console.log('⚠️  React error detected in page content');
      }
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.end();