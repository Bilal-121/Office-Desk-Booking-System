import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { sendSuccess, sendError } from '@/lib/api-response';
import { registerSchema } from '@/lib/validations';
import { withRateLimit } from '@/lib/middleware/rate-limit';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const validated = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return sendError(res, 'User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Create user with preferences
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        name: validated.name,
        teamId: validated.teamId,
        preferences: {
          create: {
            needsMonitor: false,
            needsStandingDesk: false,
            prefersQuietArea: false,
            needsWindow: false,
            needsPowerOutlet: true,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Update embedding for preferences (best-effort: the account already exists,
    // so a failure here shouldn't be reported as a failed registration)
    try {
      await prisma.$executeRaw`
        UPDATE user_preferences
        SET embedding = ARRAY[0.0, 0.0, 0.0, 0.0, 1.0]::vector
        WHERE "userId" = ${user.id}
      `;
    } catch (embeddingError) {
      console.error('Failed to set preference embedding for new user:', embeddingError);
    }

    return sendSuccess(res, user, 'User registered successfully', 201);
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.errors) {
      const errorMessage = error.errors
        .map((err: any) => `${err.path.join('.')}: ${err.message}`)
        .join(', ');
      return sendError(res, errorMessage, 400);
    }

    return sendError(res, 'Registration failed', 500);
  }
}

export default withRateLimit(handler, 10);
