import { NextResponse } from "next/server";
import { getChapterPages } from "@/lib/api/mangadex";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
    try {
        const data = await getChapterPages(params.id);
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Failed to fetch chapter pages", pages: [] }, { status: 500 });
    }
}
