import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const mangaSlug = searchParams.get("mangaSlug");
  const where = mangaSlug ? { userId, mangaSlug } : { userId };
  const progress = await prisma.readingProgress.findMany({ where, orderBy: { readAt: "desc" } });
  return NextResponse.json(progress);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { mangaSlug, chapterNumber, pageNumber, totalPages } = await req.json();
  const progress = await prisma.readingProgress.upsert({
    where: { userId_mangaSlug_chapterNumber: { userId, mangaSlug, chapterNumber } },
    update: { pageNumber, totalPages, readAt: new Date() },
    create: { userId, mangaSlug, chapterNumber, pageNumber, totalPages },
  });
  return NextResponse.json(progress);
}
