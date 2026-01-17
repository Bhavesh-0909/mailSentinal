# Custom Email Server Backend

A production-ready email server built with Node.js, Express, PostgreSQL (Supabase), and Drizzle ORM. Supports sending and receiving emails via SMTP with attachment handling through Cloudinary.

## 🚀 Features

- **Custom SMTP Server**: Receive emails on port 2525
- **Email Sending**: Send emails via nodemailer with SMTP
- **File Attachments**: Upload and store attachments via Cloudinary
- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **RESTful API**: Clean API endpoints for email management

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database (Supabase recommended)
- Cloudinary account
- SMTP credentials (Gmail, SendGrid, etc.)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Server
PORT=3000
SMTP_PORT=2525

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# SMTP for sending
SMTP_HOST=smtp.gmail.com
SMTP_PORT_SEND=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Domain
DOMAIN=yourdomain.com
```

### 3. Set Up Database

```bash
# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Start the Servers

You need to run **two separate processes**:

**Terminal 1 - API Server:**
```bash
npm start
# or for development with auto-reload:
npm run dev
```

**Terminal 2 - SMTP Server:**
```bash
npm run start:mail
# or for development:
npm run dev:mail
```

## 📡 API Endpoints

### Authentication

#### Register User
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
}
```

### Email Operations

All email endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

#### Send Email
```bash
POST /api/emails/send
Authorization: Bearer <token>
Content-Type: multipart/form-data

to: recipient@example.com
subject: Hello World
body: This is the email content
attachments: [file1, file2] # optional
```

#### Get Inbox
```bash
GET /api/emails/inbox?page=1&limit=20
Authorization: Bearer <token>
```

#### Get Sent Emails
```bash
GET /api/emails/sent?page=1&limit=20
Authorization: Bearer <token>
```

#### Get Email by ID
```bash
GET /api/emails/:id
Authorization: Bearer <token>
```

## 🧪 Testing the SMTP Server

### Method 1: Using Telnet (Manual Testing)

```bash
telnet localhost 2525
```

Then type the following commands:

```
HELO localhost
MAIL FROM:<sender@example.com>
RCPT TO:<registered-user@yourdomain.com>
DATA
Subject: Test Email
From: sender@example.com
To: registered-user@yourdomain.com

This is a test email body.
.
QUIT
```

**Important**: The recipient must be a registered user in your database!

### Method 2: Using a Node.js Script

Create `test-smtp.js`:

```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 2525,
  secure: false,
  tls: {
    rejectUnauthorized: false
  }
});

async function sendTestEmail() {
  try {
    const info = await transporter.sendMail({
      from: 'test@external.com',
      to: 'registered-user@yourdomain.com', // Must be registered!
      subject: 'Test Email via SMTP',
      text: 'This is a test email sent to our custom SMTP server.',
      html: '<p>This is a <strong>test email</strong>.</p>'
    });

    console.log('Message sent:', info.messageId);
  } catch (error) {
    console.error('Error:', error);
  }
}

sendTestEmail();
```

Run it:
```bash
node test-smtp.js
```

### Method 3: Using curl

```bash
curl -X POST http://localhost:3000/api/emails/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "to=recipient@example.com" \
  -F "subject=Test Subject" \
  -F "body=This is the email body" \
  -F "attachments=@/path/to/file.pdf"
```

## 📂 Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.js  # Drizzle DB connection
│   ├── cloudinary.js
│   └── smtp.js
├── db/
│   └── schema.js    # Drizzle schema definitions
├── middleware/
│   └── auth.js      # JWT authentication
├── controllers/     # Request handlers
│   ├── authController.js
│   └── emailController.js
├── services/        # Business logic
│   ├── emailSender.js
│   ├── emailReceiver.js
│   └── attachmentService.js
├── routes/          # API routes
│   ├── authRoutes.js
│   └── emailRoutes.js
├── utils/
│   └── emailParser.js
├── app.js           # Express API server
└── mail-server.js   # SMTP receiving server
```

## 🔒 Security Notes

1. **JWT Secret**: Use a strong, random secret in production
2. **Password Hashing**: Passwords are hashed with bcrypt (10 rounds)
3. **SMTP Port**: Port 2525 is used to avoid requiring root privileges
4. **Email Validation**: Recipients must exist in the database
5. **File Upload Limits**: 10MB max per file, 5 files max

## 🚧 Production Deployment

1. **Use environment-specific configs**: Different `.env` files for dev/staging/prod
2. **Use PM2 for process management**:
   ```bash
   npm install -g pm2
   pm2 start src/app.js --name email-api
   pm2 start src/mail-server.js --name email-smtp
   ```
3. **Set up reverse proxy** (Nginx) for the API
4. **Configure DNS MX records** to point to your SMTP server
5. **Use SSL/TLS** for production SMTP (port 465 or 587)
6. **Implement rate limiting** for API endpoints
7. **Set up monitoring** and logging (e.g., Winston, Sentry)

## 🐛 Troubleshooting

**Database connection fails:**
- Check your `DATABASE_URL` is correct
- Ensure your Supabase project allows connections from your IP

**SMTP server not receiving emails:**
- Verify recipient email exists in the `users` table
- Check SMTP server logs for errors
- Ensure port 2525 is not blocked by firewall

**Cloudinary upload fails:**
- Verify Cloudinary credentials in `.env`
- Check file size limits (default: 10MB)

**JWT authentication fails:**
- Ensure `JWT_SECRET` is set in `.env`
- Check token is sent in `Authorization: Bearer <token>` format

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.