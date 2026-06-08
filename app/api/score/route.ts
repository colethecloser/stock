import { NextRequest, NextResponse } from "next/server";
import { scoreCompany, DEFAULT_WEIGHTS } from "@/lib/scoring";
import { resolveSnapshot, ResolveError } from "@/lib/resolve";
import type { Weights } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker") ?? "";
  try {
    const snap = await resolveSnapshot(ticker);
    return NextResponse.json(scoreCompany(snap, DEFAULT_WEIGHTS));
  } catch (e) {
    const err = e as ResolveError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { ticker?: string; weights?: Weights };
    const snap = await resolveSnapshot(body.ticker ?? "");
    return NextResponse.json(scoreCompany(snap, body.weights ?? DEFAULT_WEIGHTS));
  } catch (e) {
    const err = e as ResolveError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
