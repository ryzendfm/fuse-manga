import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const bookmarks = await prisma.bookmark.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(bookmarks);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { mangaSlug, mangaTitle, mangaCover, status, score } = await req.json();
  const bookmark = await prisma.bookmark.upsert({
    where: { userId_mangaSlug: { userId, mangaSlug } },
    update: { status, score, mangaTitle: mangaTitle || undefined, mangaCover: mangaCover || undefined },
    create: { userId, mangaSlug, mangaTitle: mangaTitle || "", mangaCover: mangaCover || "", status: status || "plan_to_read", score },
  });
  return NextResponse.json(bookmark);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { mangaSlug } = await req.json();
  await prisma.bookmark.deleteMany({ where: { userId, mangaSlug } });
  return NextResponse.json({ ok: true });
}
