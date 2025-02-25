import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if the request is for the chat page
  if (request.nextUrl.pathname.startsWith('/chat')) {
    try {
      // Get the authenticated status from the cookie
      const authenticated = request.cookies.get('authenticated')?.value
      
      // If not authenticated, redirect to the landing page
      if (!authenticated) {
        const url = new URL('/', request.url)
        return NextResponse.redirect(url)
      }
    } catch (error) {
      console.error('Middleware error:', error)
      // If there's an error, redirect to the landing page as a fallback
      const url = new URL('/', request.url)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/chat/:path*'],
} 