"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import LogFilters, { type Filters } from "@/components/LogFilters";
import LogTable from "@/components/LogTable";
import type { LogEntry } from "@/app/api/logs/route";

const DEFAULT_FILTERS: Filters = {
  search: "",
  status: "",
  method: "",
  action: "",
  dateFrom: "",
  dateTo: "",
  source: "",
  email: "",
};

interface ApiResponse {
  total: number;
  page: number;
  pageSize: number;
  data: LogEntry[];
}

type EmailStatus = "idle" | "loading" | "found" | "not_found" | "error";

export default function HomePage() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ApiResponse>({ total: 0, page: 1, pageSize: 50, data: [] });
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  // resolved userid from email lookup (populated at search time)
  const resolvedUserIdRef = useRef<string | null>(null);
  // hold current filters ref so handleSearch always uses latest state
  const filtersRef = useRef<Filters>(DEFAULT_FILTERS);

  const buildUrl = useCallback((f: Filters, p: number, userId: string | null) => {
    const params = new URLSearchParams();
    if (f.search) params.set("search", f.search);
    if (f.status) params.set("status", f.status);
    if (f.method) params.set("method", f.method);
    if (f.action) params.set("action", f.action);
    if (f.dateFrom) params.set("dateFrom", f.dateFrom);
    if (f.dateTo) params.set("dateTo", f.dateTo);
    if (f.source) params.set("source", f.source);
    if (userId) params.set("userid", userId);
    params.set("page", String(p));
    params.set("pageSize", "50");
    return `/api/logs?${params.toString()}`;
  }, []);

  const fetchLogs = useCallback(
    async (f: Filters, p: number, userId: string | null) => {
      setLoading(true);
      try {
        const res = await fetch(buildUrl(f, p, userId));
        const json: ApiResponse = await res.json();
        setResult(json);
      } finally {
        setLoading(false);
      }
    },
    [buildUrl]
  );

  useEffect(() => {
    fetch("/api/files")
      .then((r) => r.json())
      .then((json: { files: string[]; latest: string | null }) => {
        setSources(json.files);
        if (json.latest) {
          const initial: Filters = { ...DEFAULT_FILTERS, source: json.latest };
          setFilters(initial);
          filtersRef.current = initial;
          fetchLogs(initial, 1, null);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiltersChange = (f: Filters) => {
    // Only update state — search is triggered by the button
    filtersRef.current = f;
    setFilters(f);
    // Reset email status if email was cleared
    if (!f.email) {
      setEmailStatus("idle");
      resolvedUserIdRef.current = null;
    }
  };

  const handleSearch = async () => {
    const f = filtersRef.current;
    setPage(1);

    if (f.email) {
      setEmailStatus("loading");
      try {
        const res = await fetch(`/api/users?email=${encodeURIComponent(f.email)}`);
        const data = await res.json();
        if (data.found) {
          setEmailStatus("found");
          const uid = String(data.identityId);
          resolvedUserIdRef.current = uid;
          fetchLogs(f, 1, uid);
        } else {
          setEmailStatus("not_found");
          resolvedUserIdRef.current = null;
          fetchLogs(f, 1, "__no_match__");
        }
      } catch {
        setEmailStatus("error");
        resolvedUserIdRef.current = null;
        fetchLogs(f, 1, null);
      }
    } else {
      resolvedUserIdRef.current = null;
      fetchLogs(f, 1, null);
    }
  };

  const handleReset = () => {
    resolvedUserIdRef.current = null;
    setEmailStatus("idle");
    // keep latest source on reset
    const latestSource = sources.length > 0 ? sources[sources.length - 1] : "";
    const reset: Filters = { ...DEFAULT_FILTERS, source: latestSource };
    filtersRef.current = reset;
    setFilters(reset);
    setPage(1);
    fetchLogs(reset, 1, null);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchLogs(filtersRef.current, p, resolvedUserIdRef.current);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Log Viewer</h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualização e filtragem dos logs da aplicação <strong>LeiDoBem</strong>
          </p>
        </div>

        <LogFilters
          filters={filters}
          sources={sources}
          onChange={handleFiltersChange}
          onReset={handleReset}
          onSearch={handleSearch}
          emailStatus={emailStatus}
        />

        <div className={loading ? "opacity-60 pointer-events-none" : ""}>
          <LogTable
            data={result.data}
            total={result.total}
            page={page}
            pageSize={result.pageSize}
            onPageChange={handlePageChange}
          />
        </div>

        {loading && (
          <div className="text-center text-sm text-gray-400 animate-pulse">Carregando...</div>
        )}
      </div>
    </main>
  );
}

