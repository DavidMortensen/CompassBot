import { NextResponse } from 'next/server';

// Securely handle invite codes
// IMPORTANT: In production, store this in an environment variable like INVITE_CODE
// This is a fallback if the environment variable is not set
const VALID_INVITE_CODE = process.env.INVITE_CODE || 'COMPASS-HRG-2024';

export async function POST(request: Request) {
  try {
    const { inviteCode } = await request.json();
    
    // Validate the invite code
    if (inviteCode === VALID_INVITE_CODE) {
      // Create the response with the success message
      const response = NextResponse.json({ 
        valid: true, 
        message: 'Invite code valid' 
      });
      
      // Set a secure HTTP-only cookie that expires in 7 days
      // Using more compatible cookie settings for Vercel
      response.cookies.set('authenticated', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
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