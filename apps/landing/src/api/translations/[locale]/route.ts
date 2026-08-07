import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const localesPath = path.join(process.cwd(), "src/data");

export async function GET(req: Request, { params }: { params: { locale: string } }) {
  const filePath = path.join(localesPath, `${params.locale}.ts`);
  
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const data = fs.readFileSync(filePath, "utf-8");
  return NextResponse.json(JSON.parse(data));
}

export async function POST(req: Request, { params }: { params: { locale: string } }) {
  const filePath = path.join(localesPath, `${params.locale}.ts`);
  const body = await req.json();

  fs.writeFileSync(filePath, JSON.stringify(body, null, 2), "utf-8");

  return NextResponse.json({ success: true });
}
