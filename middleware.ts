import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
	const token = await getToken({ req: request });
	const isAuthenticated = !!token;

	// Redirect unauthenticated users to the sign-in page
	if (!isAuthenticated && !request.nextUrl.pathname.startsWith("/api/auth")) {
		return NextResponse.redirect(new URL("/api/auth/signin", request.url));
	}

	// Allow authenticated users to proceed
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|favicon.ico).*)"],
};
