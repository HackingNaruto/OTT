import { NextResponse } from 'next/server';

export function middleware(req) {
  const basicAuth = req.headers.get('authorization');

  // Read credentials from environment variables
  // In Vercel, you will set these in the Project Settings -> Environment Variables
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPwd = process.env.ADMIN_PASSWORD;

  // If credentials are not set in the environment, we can either block access completely or allow it.
  // It's safer to block access if they are supposed to be set.
  if (!adminUser || !adminPwd) {
    // Optionally allow if env is missing during local dev, but let's enforce it to be safe.
    return new NextResponse('Authentication not configured on server.', { status: 500 });
  }

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    // Decode base64
    const [user, pwd] = atob(authValue).split(':');

    if (user === adminUser && pwd === adminPwd) {
      return NextResponse.next();
    }
  }

  // Request Authentication
  return new NextResponse('Auth Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Panel"',
    },
  });
}

// Protect only the /admin routes
export const config = {
  matcher: ['/admin/:path*'],
};
