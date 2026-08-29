import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    origin: req.nextUrl.origin,
    host: req.headers.get("host"),
    xForwardedHost: req.headers.get("x-forwarded-host"),
    xForwardedProto: req.headers.get("x-forwarded-proto"),
  });
}
