import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import {
  sendEmailHandler,
  getInbox,
  getSent,
  getEmailById,
} from '../controllers/emailController.js';

const router = express.Router();

// Configure multer for file uploads (in-memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// All routes require authentication
router.use(authenticateToken);

// POST /api/emails/send
router.post('/send', upload.array('attachments', 5), sendEmailHandler);

// GET /api/emails/inbox
router.get('/inbox', getInbox);

// GET /api/emails/sent
router.get('/sent', getSent);

// GET /api/emails/:id
router.get('/:id', getEmailById);

export default router;