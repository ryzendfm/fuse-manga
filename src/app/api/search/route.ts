import { NextResponse } from "next/server";
import { searchManga } from "@/lib/api/mangadex";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q) return NextResponse.json({ count: 0, data: [] });
  try {
    const data = await searchManga(q);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
