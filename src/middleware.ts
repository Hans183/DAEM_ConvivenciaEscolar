import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import PocketBase from 'pocketbase';

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Ignorar las peticiones a estáticos, _next o API internas
    if (
        path.startsWith('/_next') ||
        path.startsWith('/api/') ||
        path.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|json|txt|woff2?|map)$/i)
    ) {
        return NextResponse.next();
    }

    const isPublicPath = path.startsWith('/auth');

    // Recupera la cookie cruda para pasarla a PocketBase
    const rawCookie = request.headers.get('cookie') || '';
    const pb = new PocketBase('https://apiconvivencia.daemlu.cl');

    // Carga la cookie en el AuthStore de PB
    pb.authStore.loadFromCookie(rawCookie);
    const isValid = pb.authStore.isValid;

    console.log(`[Middleware] Path: ${path} | Auth Valid: ${isValid}`);

    if (isPublicPath) {
        if (isValid) {
            // Si está logueado y trata de acceder a login, redirigirlo a dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
    }

    // --- PROTECCIÓN GLOBAL ---
    // Si NO es ruta pública y el token NO es válido o no existe
    if (!isValid) {
        console.log(`[Middleware] Blocked access to ${path}, redirecting to /auth/login`);
        const response = NextResponse.redirect(new URL('/auth/login', request.url));
        // Limpia cualquier cookie errónea que haya quedado
        response.cookies.delete('pb_auth');
        return response;
    }

    return NextResponse.next();
}

export const config = {
    // Mathcer extremadamente genérico y permisivo para asegurar que el middleware atrape casi todo.
    // Nosotros hacemos la exclusión de _next y api manualmente dentro de la función.
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
