import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const EXPECTED_HEADERS = [
  "appname",
  "apptrace_id",
  "timestamp",
  "status",
  "elapsedSeconds",
  "method",
  "action",
  "userid",
  "token",
  "data",
  "result",
  "error",
];

function hasValidFormat(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(4096);
    const bytesRead = fs.readSync(fd, buffer, 0, 4096, 0);
    fs.closeSync(fd);
    const firstLine = buffer.slice(0, bytesRead).toString("utf-8").split(/\r?\n/)[0];
    const headers = firstLine.split("\t").map((h) => h.trim().toLowerCase());
    return EXPECTED_HEADERS.every((h) => headers.includes(h.toLowerCase()));
  } catch {
    return false;
  }
}

export async function GET() {
  const dataDir = path.join(process.cwd(), "data");

  if (!fs.existsSync(dataDir)) {
    return NextResponse.json({ files: [] });
  }

  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.toLowerCase().endsWith(".txt"))
    .filter((f) => hasValidFormat(path.join(dataDir, f)))
    .sort();

  const latest = files.length > 0 ? files[files.length - 1] : null;

  return NextResponse.json({ files, latest });
}
