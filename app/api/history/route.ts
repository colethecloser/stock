import { NextRequest, NextResponse } from "next/server";
import { isDbEnabled, getHistory } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker") ?? "";
  if (!ticker) {
    return NextResponse.json({ error: "Provide a ?ticker= parameter." }, { status: 400 });
  }
  if (!isDbEnabled()) {
    return NextResponse.json({ enabled: false, points: [] });
  }
  try {
    const points = await getHistory(ticker);
    return NextResponse.json({ enabled: true, points });
  } catch (e) {
    return NextResponse.json(
      { enabled: true, points: [], error: (e as Error).message },
      { status: 500 }
    );
  }
}
