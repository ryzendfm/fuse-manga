import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();
    if (!username || !email || !password) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (exists) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, email, passwordHash },
    });
    return NextResponse.json({ id: user.id, username: user.username, email: user.email });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
