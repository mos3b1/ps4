import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // Test database connection
    const result = await db.execute("SELECT 1 as test");
    
    return NextResponse.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error("[API ERROR] Health check failed:", error);
    return NextResponse.json({
      status: "error",
      database: "disconnected",
      error: String(error),
    }, { status: 500, headers: corsHeaders });
  }
}
