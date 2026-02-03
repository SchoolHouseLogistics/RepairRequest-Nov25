import { Router } from "express";
import path from "path";
import fs from "fs";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db, contactMessages } from "../db";
import { insertContactMessageSchema } from "@shared/schema";
import { sendContactFormEmails, isZeptoMailConfigured } from "../zeptoMailService";

const router = Router();

// =============================================================================
// Configuration
// =============================================================================

// S3 Client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Upload directory for local file storage
const uploadDir = path.resolve(process.cwd(), 'uploads/photos');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// =============================================================================
// File Serving Routes
// =============================================================================

// Serve uploaded files - public access, no auth required
router.get("/api/uploads/:filename", (req: any, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    // Basic security check to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ message: "Invalid filename" });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    // Serve the file with correct mime type
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    console.error("Error serving file:", error);
    res.status(500).json({ message: "Failed to serve file" });
  }
});

// =============================================================================
// S3 Pre-signed URL Routes
// =============================================================================

// Generate pre-signed URL for S3 object access
router.get('/get-presigned-url', async (req, res) => {
  const { key } = req.query;

  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'Key parameter is required' });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET || 'repair-request-121905340783',
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    res.json({ url });
  } catch (err) {
    console.error('Error generating presigned URL:', err);
    res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
});

// =============================================================================
// Contact Form Routes
// =============================================================================

// Contact form submission endpoint
router.post("/api/contact", async (req, res) => {
  try {
    const parsed = insertContactMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.errors });
    }

    // Save to database
    const [created] = await db.insert(contactMessages).values(parsed.data).returning();

    // Send emails via ZeptoMail
    if (isZeptoMailConfigured()) {
      const emailResult = await sendContactFormEmails({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        phone: parsed.data.phone || undefined,
        organization: parsed.data.organization,
        organizationType: parsed.data.organizationType || undefined,
        inquiry: parsed.data.inquiry || undefined,
        message: parsed.data.message,
      });

      if (!emailResult.success) {
        console.error("Contact form email sending failed:", emailResult.error);
      }
    }

    res.status(201).json({ success: true, message: "Message received", data: created });
  } catch (error) {
    console.error("Error processing contact form:", error);
    res.status(500).json({ error: "Failed to submit message" });
  }
});

export default router;
