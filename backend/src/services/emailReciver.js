import { simpleParser } from 'mailparser';

/**
 * Parse incoming email stream
 */
export const parseEmailStream = async (stream) => {
  try {
    const parsed = await simpleParser(stream);

    return {
      from: parsed.from?.value[0]?.address || '',
      to: parsed.to?.value[0]?.address || '',
      subject: parsed.subject || '(No Subject)',
      body: parsed.text || parsed.html || '',
      attachments: parsed.attachments || [],
      messageId: parsed.messageId,
      date: parsed.date,
    };
  } catch (error) {
    console.error('Error parsing email:', error);
    throw error;
  }
};

/**
 * Extract attachment data from parsed email
 */
export const extractAttachments = (parsedAttachments) => {
  if (!parsedAttachments || parsedAttachments.length === 0) {
    return [];
  }

  return parsedAttachments.map(att => ({
    filename: att.filename || 'unnamed',
    contentType: att.contentType,
    buffer: att.content,
    size: att.size,
  }));
};