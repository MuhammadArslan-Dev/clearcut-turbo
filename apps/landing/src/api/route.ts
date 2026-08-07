import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const localesPath = path.join(process.cwd(), "src/data");
  const files = fs
    .readdirSync(localesPath)
    .filter(file => file.endsWith(".ts")); // ✅ now it checks for .ts files

  return NextResponse.json(files);
}
