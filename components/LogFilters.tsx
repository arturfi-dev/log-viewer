"use client";

export interface Filters {
  search: string;
  status: string;
  method: string;
  action: string;
  userid: string;
  source: string;
  email: string;
}

interface Props {
  filters: Filters;
  sources: string[];
  onChange: (filters: Filters) => void;
  onReset: () => void;
  onSearch: () => void;
  emailStatus?: "idle" | "loading" | "found" | "not_found" | "error";
}

export default function LogFilters({ filters, sources, onChange, onReset, onSearch, emailStatus = "idle" }: Props) {
  const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...filters, [key]: e.target.value });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        {/* Email lookup */}
        <div className="w-64">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
            E-mail do usuário
          </label>
          <div className="relative">
            <input
              type="email"
              value={filters.email}
              onChange={set("email")}
              placeholder="usuario@exemplo.com"
              title="Busca o IdentityId pelo e-mail no banco de dados"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8 ${
                emailStatus === "found" ? "border-green-400" :
                emailStatus === "not_found" ? "border-red-400" :
                emailStatus === "error" ? "border-orange-400" :
                "border-gray-300"
              }`}
            />
            {emailStatus === "loading" && (
              <span className="absolute right-2 top-2.5 text-gray-400 text-xs animate-pulse">...</span>
            )}
            {emailStatus === "found" && (
              <span className="absolute right-2 top-2 text-green-500 text-sm">✓</span>
            )}
            {emailStatus === "not_found" && (
              <span className="absolute right-2 top-2 text-red-500 text-sm" title="Usuário não encontrado">✗</span>
            )}
          </div>
        </div>

        {/* Global search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
            Busca geral
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={set("search")}
            placeholder="Pesquisar em todos os campos..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status */}
        <div className="w-40">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
            Status
          </label>
          <input
            type="text"
            value={filters.status}
            onChange={set("status")}
            placeholder="ex: 404 ou !=404"
            title="Suporta: valor, !=valor, padrão com * (ex: !=404, 2*, !=5*)" 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Method */}
        <div className="w-40">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
            Method
          </label>
          <input
            type="text"
            value={filters.method}
            onChange={set("method")}
            placeholder="ex: GET ou !=POST"
            title="Suporta: valor, !=valor, padrão com * (ex: !=POST, GET)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action */}
        <div className="w-56">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
            Action
          </label>
          <input
            type="text"
            value={filters.action}
            onChange={set("action")}
            placeholder="ex: /api/* ou !=/api/enum/*"
            title="Suporta: valor, !=valor, wildcards * (ex: /api/*, !=/api/enum/*)" 
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Source file */}
        {sources.length > 0 && (
          <div className="w-52">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Arquivo
            </label>
            <select
              value={filters.source}
              onChange={set("source")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todos</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions */}
        <div className="self-end flex gap-2">
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 transition-colors"
          >
            Limpar
          </button>
          <button
            onClick={onSearch}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-colors"
          >
            Pesquisar
          </button>
        </div>
      </div>
    </div>
  );
}
