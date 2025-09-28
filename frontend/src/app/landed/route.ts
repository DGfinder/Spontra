import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const clickId = url.searchParams.get("clickId");
  if (!clickId) return NextResponse.json({ ok:false, error:"MISSING_CLICKID" }, { status: 400 });

  // Idempotent: mark landed; ignore if not found (bots can hit this)
  await prisma.click.updateMany({
    where: { clickId },
    data: { landed200: true }
  });

  // 1x1 transparent GIF to keep it pixel-friendly
  const gif = Buffer.from("R0lGODlhAQABAPAAAP///wAAACwAAAAAAQABAAACAkQBADs=", "base64");
  return new NextResponse(gif, {
    status: 200,
    headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" },
  });
}