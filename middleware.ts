import { NextRequest, NextResponse } from "next/server";
import { getCanonicalRedirectUrl } from "@/lib/canonical-url";

export function middleware(request: NextRequest) {
  const requestHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const redirectUrl = getCanonicalRedirectUrl({
    canonicalOrigin: process.env.NIMLOTH_CANONICAL_ORIGIN,
    requestHost,
    requestUrl: request.nextUrl,
  });

  return redirectUrl
    ? NextResponse.redirect(redirectUrl, 308)
    : NextResponse.next();
}
