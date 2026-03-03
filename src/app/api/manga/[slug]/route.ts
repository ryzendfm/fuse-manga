import { NextResponse } from "next/server";
import { getManga } from "@/lib/api/mangadex";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const data = await getManga(params.slug);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=180, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch manga" }, { status: 500 });
  }
}
