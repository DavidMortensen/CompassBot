import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Securely handle invite codes
// IMPORTANT: In production, store this in an environment variable like INVITE_CODE
// This is a fallback if the environment variable is not set
const VALID_INVITE_CODE = process.env.INVITE_CODE || 'COMPASS-HRG-2024';

export async function POST(request: Request) {
  try {
    const { inviteCode } = await request.json();
    
    // Validate the invite code
    if (inviteCode === VALID_INVITE_CODE) {
      // Set a secure HTTP-only cookie that expires in 7 days
      const cookieStore = cookies();
      cookieStore.set({
        name: 'authenticated',
        value: 'true',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return NextResponse.json({ 
        valid: true, 
        message: 'Invite code valid' 
      });
    }

    // Invalid code
    return NextResponse.json(
      { valid: false, message: 'Invalid invite code' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error validating invite code:', error);
    return NextResponse.json(
      { valid: false, message: 'Server error processing invite code' },
      { status: 500 }
    );
  }
} 