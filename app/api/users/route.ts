import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";

const config: sql.config = {
  server: process.env.DB_SERVER ?? "",
  port: parseInt(process.env.DB_PORT ?? "1433", 10),
  database: process.env.DB_DATABASE ?? "",
  user: process.env.DB_USER ?? "",
  password: process.env.DB_PASSWORD ?? "",
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  connectionTimeout: 120000,
};

let pool: sql.ConnectionPool | null = null;

async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) return pool;
  pool = await new sql.ConnectionPool(config).connect();
  return pool;
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.trim();

  if (!email) {
    return NextResponse.json({ error: "Parâmetro 'email' obrigatório." }, { status: 400 });
  }

  try {
    const db = await getPool();
    const result = await db
      .request()
      .input("email", sql.NVarChar(256), email)
      .query("SELECT TOP 1 EMail, IdentityId FROM Users WHERE EMail = @email");

    if (result.recordset.length === 0) {
      return NextResponse.json({ found: false, identityId: null });
    }

    const row = result.recordset[0];
    return NextResponse.json({ found: true, email: row.EMail, identityId: row.IdentityId });
  } catch (err) {
    console.error("[/api/users] DB error:", err);
    return NextResponse.json({ error: "Falha ao consultar o banco." }, { status: 500 });
  }
}
