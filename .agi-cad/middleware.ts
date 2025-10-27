import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function middleware(req: NextRequest) {
  initAdmin();
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

  try {
    const decoded = await getAuth().verifyIdToken(token, true);
    (req as any).uid = decoded.uid;
    return NextResponse.next();
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }
}
