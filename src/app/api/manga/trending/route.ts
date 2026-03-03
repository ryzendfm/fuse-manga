import { NextResponse } from "next/server";
import { getTrending } from "@/lib/api/mangadex";

export async function GET() {
  try {
    const data = await getTrending();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "CDN-Cache-Control": "public, s-maxage=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch trending", data: [] }, { status: 500 });
  }
}
