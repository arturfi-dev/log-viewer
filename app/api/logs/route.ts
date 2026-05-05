import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface LogEntry {
  appname: string;
  apptrace_id: string;
  timestamp: string;
  status: string;
  elapsedSeconds: string;
  method: string;
  action: string;
  userid: string;
  token: string;
  data: string;
  result: string;
  error: string;
  _source: string;
}

/**
 * Supports expressions:
 *   plain value  → field contains value (case-insensitive)
 *   value*       → field starts with value
 *   *value       → field ends with value
 *   *value*      → field contains value (same as plain)
 *   !=expr       → negates any of the above
 *   wildcard *   acts as regex .*
 */
function matchesExpression(fieldValue: string, expr: string): boolean {
  if (!expr) return true;

  const negate = expr.startsWith("!=");
  const pattern = negate ? expr.slice(2) : expr;

  if (!pattern) return true;

  let matches: boolean;
  if (pattern.includes("*")) {
    // Convert wildcard pattern to anchored regex
    const regexStr = pattern
      .split("*")
      .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
      .join(".*");
    const regex = new RegExp(`^${regexStr}$`, "i");
    matches = regex.test(fieldValue);
  } else {
    // Plain: contains match (case-insensitive)
    matches = fieldValue.toLowerCase().includes(pattern.toLowerCase());
  }

  return negate ? !matches : matches;
}

function parseLogFile(filePath: string, sourceName: string): LogEntry[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split("\t");
  return lines.slice(1).map((line) => {
    const cols = line.split("\t");
    const entry: Record<string, string> = {};
    headers.forEach((h, i) => {
      entry[h.trim()] = (cols[i] ?? "").trim();
    });
    return {
      appname: entry["appname"] ?? "",
      apptrace_id: entry["apptrace_id"] ?? "",
      timestamp: entry["timestamp"] ?? "",
      status: entry["status"] ?? "",
      elapsedSeconds: entry["elapsedSeconds"] ?? "",
      method: entry["method"] ?? "",
      action: entry["action"] ?? "",
      userid: entry["userid"] ?? "",
      token: entry["token"] ?? "",
      data: entry["data"] ?? "",
      result: entry["result"] ?? "",
      error: entry["error"] ?? "",
      _source: sourceName,
    };
  });
}

export async function GET(request: NextRequest) {
  const dataDir = path.join(process.cwd(), "data");
  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith(".txt") || f.endsWith(".tsv") || f.endsWith(".log"));

  let entries: LogEntry[] = [];
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    entries = entries.concat(parseLogFile(filePath, file));
  }

  const { searchParams } = new URL(request.url);

  // Plain contains filter (no expression syntax)
  const filterFieldPlain = (field: keyof LogEntry, param: string) => {
    const value = searchParams.get(param);
    if (value) {
      const lower = value.toLowerCase();
      entries = entries.filter((e) => e[field].toLowerCase().includes(lower));
    }
  };

  // Expression filter: supports != and * wildcards
  const filterFieldExpr = (field: keyof LogEntry, param: string) => {
    const expr = searchParams.get(param);
    if (expr) {
      entries = entries.filter((e) => matchesExpression(e[field], expr));
    }
  };

  filterFieldPlain("appname", "appname");
  filterFieldExpr("status", "status");
  filterFieldExpr("method", "method");
  filterFieldExpr("action", "action");
  filterFieldPlain("userid", "userid");
  filterFieldPlain("error", "error");
  filterFieldPlain("_source", "source");

  const search = searchParams.get("search");
  if (search) {
    const lower = search.toLowerCase();
    entries = entries.filter((e) =>
      Object.values(e).some((v) => v.toLowerCase().includes(lower))
    );
  }

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(500, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50", 10)));
  const total = entries.length;
  const paginated = entries.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({ total, page, pageSize, data: paginated });
}
