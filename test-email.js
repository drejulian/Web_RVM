require('dotenv').config();
const { sendPasswordResetEmail, verifyEmailConfig } = require('./lib/email');

async function testEmail() {
  console.log('🔍 Testing email configuration...\n');

  console.log('📧 Email Config:');
  console.log('  HOST:', process.env.EMAIL_HOST || 'smtp.gmail.com');
  console.log('  PORT:', process.env.EMAIL_PORT || '587');
  console.log('  USER:', process.env.EMAIL_USER || '❌ NOT SET');
  console.log('  PASS:', process.env.EMAIL_PASS ? '✅ SET' : '❌ NOT SET');
  console.log('  FROM:', process.env.EMAIL_FROM || '"RVM Support" <noreply@rvm.com>');
  console.log('');

  console.log('1️⃣ Verifying SMTP connection...');
  const isValid = await verifyEmailConfig();
  
  if (!isValid) {
    console.error('❌ SMTP configuration failed. Check your credentials.');
    process.exit(1);
  }

  console.log('✅ SMTP connection successful!\n');

  const testEmail = process.env.EMAIL_USER;
  const resetLink = 'http://localhost:3000/new-password?token=test-token-123';

  console.log(`2️⃣ Sending test email to: ${testEmail}`);
  
  try {
    await sendPasswordResetEmail(testEmail, resetLink);
    console.log('✅ Test email sent successfully!');
    console.log('📬 Check your inbox:', testEmail);
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    process.exit(1);
  }
}

testEmail();
