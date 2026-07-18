import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { setFloorPlan } from '@/lib/floor-plans-storage';
import { withAdminAuth } from '@/lib/middleware/auth';
import { withRateLimit } from '@/lib/middleware/rate-limit';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// Verify the actual file bytes match a known image format, rather than trusting
// the client-supplied Content-Type/extension alone.
function hasValidImageSignature(filepath: string): boolean {
  const buffer = Buffer.alloc(12);
  const fd = fs.openSync(filepath, 'r');
  try {
    fs.readSync(fd, buffer, 0, 12, 0);
  } finally {
    fs.closeSync(fd);
  }

  const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isWebp = buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';

  return isPng || isJpeg || isWebp;
}

// Simple file upload handler - in production, use cloud storage like S3, Cloudinary, etc.
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      uploadDir: path.join(process.cwd(), 'public', 'uploads', 'floor-plans'),
      keepExtensions: true,
      filter: (part) => {
        const ext = path.extname(part.originalFilename || '').toLowerCase();
        return !!part.mimetype && ALLOWED_MIME_TYPES.has(part.mimetype) && ALLOWED_EXTENSIONS.has(ext);
      },
      filename: (name, ext, part) => {
        const safeExt = ALLOWED_EXTENSIONS.has(ext.toLowerCase()) ? ext.toLowerCase() : '.jpg';
        return `floor-${Date.now()}${safeExt}`;
      },
    });

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'floor-plans');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const floorId = Array.isArray(fields.floorId) ? fields.floorId[0] : fields.floorId;

    if (!file || !floorId) {
      return res.status(400).json({ success: false, error: 'A valid image file (jpg, png, webp) and floorId are required' });
    }

    // Get the public URL
    const fileName = path.basename(file.filepath);
    const publicUrl = `/uploads/floor-plans/${fileName}`;

    // Update floor with map URL
    try {
      const floor = await prisma.floor.update({
        where: { id: floorId },
        data: { mapUrl: publicUrl },
      });

      return res.status(200).json({
        success: true,
        data: {
          mapUrl: publicUrl,
          floor,
        },
      });
    } catch (dbError) {
      console.warn('⚠️ Database update failed, saving to offline storage...');
      
      // Fallback: Save to offline storage
      setFloorPlan(floorId as string, publicUrl);
      
      return res.status(200).json({
        success: true,
        data: {
          mapUrl: publicUrl,
          message: 'Floor plan uploaded and saved to offline storage',
        },
      });
    }
  } catch (error) {
    console.error('Upload floor plan error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload floor plan',
    });
  }
}

export default withRateLimit(withAdminAuth(handler), 20);

