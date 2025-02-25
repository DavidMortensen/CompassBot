import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if the request is for the chat page
  if (request.nextUrl.pathname.startsWith('/chat')) {
    // Get the authenticated status from the cookie
    const authenticated = request.cookies.get('authenticated')?.value

    // If not authenticated, redirect to the landing page
    if (!authenticated) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/chat/:path*'],
} 