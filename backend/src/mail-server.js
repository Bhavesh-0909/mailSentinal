import { SMTPServer } from 'smtp-server';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import { handleIncomingEmail } from './services/emailReceiver.js';

dotenv.config();

const SMTP_PORT = parseInt(process.env.SMTP_PORT || '2525');

// Create SMTP server
const server = new SMTPServer({
  // Allow connections without authentication
  authOptional: true,
  
  // Disable authentication
  disabledCommands: ['AUTH'],
  
  // Banner displayed on connection
  banner: 'Custom Email Server Ready',
  
  // Handle incoming email data
  onData(stream, session, callback) {
    console.log('\n📬 Receiving email...');
    
    handleIncomingEmail(stream, session)
      .then(() => {
        console.log('✅ Email processed successfully\n');
        callback(null, 'Message accepted');
      })
      .catch((error) => {
        console.error('❌ Error processing email:', error);
        callback(new Error('Failed to process email'));
      });
  },

  // Log connections
  onConnect(session, callback) {
    console.log(`🔌 New connection from ${session.remoteAddress}`);
    callback();
  },

  // Log when email envelope is received
  onMailFrom(address, session, callback) {
    console.log(`📤 MAIL FROM: ${address.address}`);
    callback();
  },

  onRcptTo(address, session, callback) {
    console.log(`📥 RCPT TO: ${address.address}`);
    callback();
  },
});

// Error handling
server.on('error', (err) => {
  console.error('❌ SMTP Server Error:', err);
});

// Start SMTP server
const startSMTPServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    server.listen(SMTP_PORT, () => {
      console.log('\n=================================');
      console.log(`📧 SMTP Server listening on port ${SMTP_PORT}`);
      console.log(`📬 Ready to receive emails`);
      console.log(`🔧 Test with: telnet localhost ${SMTP_PORT}`);
      console.log('=================================\n');
    });
  } catch (error) {
    console.error('❌ Error starting SMTP server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down SMTP server...');
  server.close(() => {
    console.log('✅ SMTP server closed');
    process.exit(0);
  });
});

startSMTPServer();