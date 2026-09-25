import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { instrumentsApi } from "../api/instruments.js";
import { queryKeys } from "../lib/queryClient.js";
import { EmptyState, ErrorState, Input, Skeleton } from "./ui.jsx";

// Single reusable search per PLAN Sec 9. Debounced, navigates to /stocks/:symbol.
export default function StockSearch({ autoFocus = false, placeholder = "Search ticker or company…" }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.instrumentSearch(debounced),
    queryFn: () => instrumentsApi.search(debounced),
    enabled: debounced.length > 0,
  });

  return (
    <div>
      <Input
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="Search stocks"
      />
      {debounced.length === 0 ? null : isLoading ? (
        <div className="mt-2 space-y-1.5" aria-busy="true" aria-label="Searching stocks">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : isError ? (
        <div className="mt-2">
          <ErrorState message="Search failed. Please retry." onRetry={() => refetch()} />
        </div>
      ) : data?.length === 0 ? (
        <div className="mt-2">
          <EmptyState title={`No results for “${debounced}”.`} hint="Try a ticker like AAPL or a company name." />
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-slate-800 rounded-xl border border-slate-800">
          {(data ?? []).map((item) => (
            <li key={item.symbol}>
              <button
                type="button"
                onClick={() => navigate(`/stocks/${item.symbol}`)}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-900"
              >
                <span className="text-sm font-medium">{item.symbol}</span>
                <span className="truncate text-xs text-slate-500">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
