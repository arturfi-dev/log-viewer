"use client";

import type { LogEntry } from "@/app/api/logs/route";

const STATUS_COLOR: Record<string, string> = {
  "2": "bg-green-100 text-green-800",
  "3": "bg-yellow-100 text-yellow-800",
  "4": "bg-red-100 text-red-800",
  "5": "bg-rose-200 text-rose-900",
};

function statusBadge(status: string) {
  const cls = STATUS_COLOR[status[0]] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}>
      {status}
    </span>
  );
}

const METHOD_COLOR: Record<string, string> = {
  GET: "bg-blue-100 text-blue-800",
  POST: "bg-green-100 text-green-800",
  PUT: "bg-yellow-100 text-yellow-800",
  PATCH: "bg-orange-100 text-orange-800",
  DELETE: "bg-red-100 text-red-800",
  HEAD: "bg-purple-100 text-purple-800",
  OPTIONS: "bg-gray-100 text-gray-600",
};

function methodBadge(method: string) {
  const cls = METHOD_COLOR[method.toUpperCase()] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-bold ${cls}`}>
      {method}
    </span>
  );
}

interface Props {
  data: LogEntry[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function formatTimestampBRT(raw: string): string {
  if (!raw) return raw;
  try {
    const date = new Date(raw);
    if (isNaN(date.getTime())) return raw;
    return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  } catch {
    return raw;
  }
}

const COLUMNS: { key: keyof LogEntry; label: string; truncate?: boolean }[] = [
  { key: "timestamp", label: "Timestamp" },
  { key: "status", label: "Status" },
  { key: "method", label: "Method" },
  { key: "action", label: "Action" },
  { key: "elapsedSeconds", label: "Elapsed (s)" },
  { key: "userid", label: "User ID", truncate: true },
  { key: "apptrace_id", label: "Trace ID", truncate: true },
  { key: "error", label: "Error", truncate: true },
  { key: "_source", label: "Arquivo" },
];

export default function LogTable({ data, total, page, pageSize, onPageChange }: Props) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          <strong className="text-gray-800">{total.toLocaleString()}</strong> registros encontrados
        </span>
        <span>
          Página {page} de {totalPages || 1}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="text-center py-10 text-gray-400">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.apptrace_id + idx} className="hover:bg-gray-50 transition-colors">
                  {COLUMNS.map((col) => {
                    const value = row[col.key];
                    if (col.key === "status") return <td key={col.key} className="px-3 py-2 whitespace-nowrap">{statusBadge(value)}</td>;
                    if (col.key === "method") return <td key={col.key} className="px-3 py-2 whitespace-nowrap">{methodBadge(value)}</td>;
                    if (col.key === "timestamp") return <td key={col.key} className="px-3 py-2 whitespace-nowrap text-gray-700">{formatTimestampBRT(value)}</td>;
                    return (
                      <td
                        key={col.key}
                        className={`px-3 py-2 ${col.truncate ? "max-w-[160px] truncate" : "whitespace-nowrap"} text-gray-700`}
                        title={col.truncate ? value : undefined}
                      >
                        {value || <span className="text-gray-300">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 justify-center pt-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
          >
            «
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
          >
            ‹
          </button>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            let p: number;
            if (totalPages <= 7) p = i + 1;
            else if (page <= 4) p = i + 1;
            else if (page >= totalPages - 3) p = totalPages - 6 + i;
            else p = page - 3 + i;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`px-2.5 py-1 text-xs rounded border ${
                  p === page
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
          >
            ›
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            className="px-2 py-1 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100"
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}
