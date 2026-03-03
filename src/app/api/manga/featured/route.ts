import { NextResponse } from "next/server";
import { getFeatured } from "@/lib/api/mangadex";

export async function GET() {
  try {
    const data = await getFeatured();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "CDN-Cache-Control": "public, s-maxage=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch featured", data: [] }, { status: 500 });
  }
}
