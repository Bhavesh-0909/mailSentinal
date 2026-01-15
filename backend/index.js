// server.js
const express = require('express');
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = 'your-secret-key-change-in-production';
const SMTP_PORT = 2525;
const HTTP_PORT = 3000;

// In-memory storage (use database in production)
const users = new Map();
const emails = new Map();
let emailIdCounter = 1;

// Helper function to get user emails
const getUserEmails = (userEmail) => {
  return Array.from(emails.values())
    .filter(email => email.to.includes(userEmail))
    .sort((a, b) => b.timestamp - a.timestamp);
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// User Registration
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  if (users.has(email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  users.set(email, {
    email,
    password: hashedPassword,
    name: name || email,
    createdAt: new Date()
  });
  
  res.json({ message: 'User registered successfully', email });
});

// User Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = users.get(email);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const validPassword = await bcrypt.compare(password, user.password);
  
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  
  res.json({
    token,
    user: {
      email: user.email,
      name: user.name
    }
  });
});

// Send Email
app.post('/api/send', authenticateToken, async (req, res) => {
  const { to, subject, text, html } = req.body;
  
  if (!to || !subject) {
    return res.status(400).json({ error: 'To and subject are required' });
  }
  
  try {
    const transporter = nodemailer.createTransport({
      host: 'localhost',
      port: SMTP_PORT,
      secure: false,
      auth: false
    });
    
    await transporter.sendMail({
      from: req.user.email,
      to,
      subject,
      text: text || '',
      html: html || text || ''
    });
    
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Send error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Get Inbox
app.get('/api/inbox', authenticateToken, (req, res) => {
  const userEmails = getUserEmails(req.user.email);
  
  const inbox = userEmails.map(email => ({
    id: email.id,
    from: email.from,
    subject: email.subject,
    timestamp: email.timestamp,
    read: email.read || false
  }));
  
  res.json({ emails: inbox, total: inbox.length });
});

// Get Single Email
app.get('/api/email/:id', authenticateToken, (req, res) => {
  const emailId = parseInt(req.params.id);
  const email = emails.get(emailId);
  
  if (!email) {
    return res.status(404).json({ error: 'Email not found' });
  }
  
  if (!email.to.includes(req.user.email)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  // Mark as read
  email.read = true;
  
  res.json({
    id: email.id,
    from: email.from,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
    timestamp: email.timestamp,
    read: email.read
  });
});

// Delete Email
app.delete('/api/email/:id', authenticateToken, (req, res) => {
  const emailId = parseInt(req.params.id);
  const email = emails.get(emailId);
  
  if (!email) {
    return res.status(404).json({ error: 'Email not found' });
  }
  
  if (!email.to.includes(req.user.email)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  emails.delete(emailId);
  res.json({ message: 'Email deleted successfully' });
});

// SMTP Server Setup
const smtpServer = new SMTPServer({
  authOptional: true,
  
  onData(stream, session, callback) {
    simpleParser(stream, (err, parsed) => {
      if (err) {
        console.error('Parse error:', err);
        return callback(err);
      }
      
      const emailData = {
        id: emailIdCounter++,
        from: parsed.from.text,
        to: parsed.to.text.split(',').map(e => e.trim()),
        subject: parsed.subject,
        text: parsed.text,
        html: parsed.html || parsed.text,
        timestamp: new Date(),
        read: false
      };
      
      emails.set(emailData.id, emailData);
      
      console.log('\n=== Email Received ===');
      console.log('ID:', emailData.id);
      console.log('From:', emailData.from);
      console.log('To:', emailData.to);
      console.log('Subject:', emailData.subject);
      
      callback(null, 'Message accepted');
    });
  }
});

// Start servers
smtpServer.listen(SMTP_PORT, () => {
  console.log(`SMTP Server running on port ${SMTP_PORT}`);
});

app.listen(HTTP_PORT, () => {
  console.log(`HTTP API Server running on port ${HTTP_PORT}`);
  console.log('\nAPI Endpoints:');
  console.log('POST /api/register - Register new user');
  console.log('POST /api/login - Login user');
  console.log('POST /api/send - Send email');
  console.log('GET /api/inbox - Get inbox');
  console.log('GET /api/email/:id - Get single email');
  console.log('DELETE /api/email/:id - Delete email');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  smtpServer.close();
  process.exit(0);
});