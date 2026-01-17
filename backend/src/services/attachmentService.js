import cloudinary from '../config/cloudinary.js';
import { db } from '../config/database.js';
import { attachments } from '../db/schema.js';

/**
 * Upload file buffer to Cloudinary
 */
export const uploadToCloudinary = (buffer, fileName, mimeType) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'email-attachments',
        resource_type: 'auto',
        public_id: `${Date.now()}-${fileName}`,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Save attachment metadata to database
 */
export const saveAttachment = async (emailId, fileData) => {
  const [attachment] = await db
    .insert(attachments)
    .values({
      emailId,
      fileUrl: fileData.secure_url,
      fileName: fileData.original_filename || fileData.public_id,
      fileType: fileData.format || fileData.resource_type,
      fileSize: fileData.bytes,
    })
    .returning();

  return attachment;
};

/**
 * Process and upload multiple attachments
 */
export const processAttachments = async (emailId, files) => {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadPromises = files.map(async (file) => {
    try {
      const cloudinaryResult = await uploadToCloudinary(
        file.buffer,
        file.originalname || file.filename,
        file.mimetype || file.contentType
      );

      const attachment = await saveAttachment(emailId, {
        ...cloudinaryResult,
        original_filename: file.originalname || file.filename,
      });

      return attachment;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  });

  return Promise.all(uploadPromises);
};

/**
 * Get attachments for an email
 */
export const getAttachmentsByEmailId = async (emailId) => {
  return db
    .select()
    .from(attachments)
    .where(eq(attachments.emailId, emailId));
};