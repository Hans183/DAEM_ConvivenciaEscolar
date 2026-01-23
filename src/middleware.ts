import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import PocketBase from 'pocketbase';

export async function middleware(request: NextRequest) {
    const response = NextResponse.next();
    const path = request.nextUrl.pathname;

    // Define paths that require authentication
    const isProtectedPath = path.startsWith('/dashboard');

    if (isProtectedPath) {
        const authCookie = request.cookies.get('pb_auth');

        // Quick check: if no cookie, definitely not logged in
        if (!authCookie) {
            const url = request.nextUrl.clone();
            url.pathname = '/auth/v1/login';
            return NextResponse.redirect(url);
        }

        // Optional: Validate cookie with PocketBase if strictly needed, 
        // but existence check is decent for middleware performance first pass.
        // For deeper security, we can load the auth store.
        try {
            const pb = new PocketBase('https://apiconvivencia.daemlu.cl');
            pb.authStore.loadFromCookie(request.headers.get('cookie') || '');

            if (!pb.authStore.isValid) {
                throw new Error('Invalid token');
            }
        } catch (err) {
            const url = request.nextUrl.clone();
            url.pathname = '/auth/v1/login';
            return NextResponse.redirect(url);
        }
    }

    return response;
}

export const config = {
    matcher: ['/dashboard/:path*'],
};
