import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
  const filePath = path.join(process.cwd(), 'data', 'json-data', 'footer.json');
  const fileData = fs.readFileSync(filePath, 'utf-8');
  const jsonData = JSON.parse(fileData);

  return NextResponse.json(jsonData);
  } catch (error) {
    console.error('Error reading JSON file:', error);
    return NextResponse.json({ error: 'Failed to load JSON' }, { status: 500 });
  }
}
