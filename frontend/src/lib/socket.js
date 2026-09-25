import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { getToken } from "../api/client.js";
import { queryKeys } from "./queryClient.js";
import { pushToast } from "./toast.js";

// Socket.IO live feed per API.md: price:update, order:filled, portfolio:update, alert:triggered.
// Real URL only (VITE_SOCKET_URL). No connection when URL is missing.
export function useLiveSocket() {
  const queryClient = useQueryClient();
  const socketRef = useRef(null);

  useEffect(() => {
    const url = import.meta.env.VITE_SOCKET_URL;
    if (!url) return undefined;

    const socket = io(url, { auth: { token: getToken() } });
    socketRef.current = socket;

    socket.on("price:update", (payload) => {
      if (payload?.symbol) {
        queryClient.setQueryData(queryKeys.quote(payload.symbol), payload);
      }
    });
    socket.on("order:filled", () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] });
    });
    socket.on("portfolio:update", (payload) => {
      if (payload) queryClient.setQueryData(queryKeys.portfolioSummary(), payload);
    });
    // Dev2 live path: toast once per triggered alert, then refresh lists.
    // Polling fallback lives in src/pages/Alerts.jsx (30s refetch + toast-on-new).
    socket.on("alert:triggered", (payload) => {
      const event = payload?.event ?? payload;
      const rule = payload?.rule;
      const key =
        (event?.ruleId ?? rule?._id ?? "") + ":" + (event?.createdAt ?? "");
      pushToast(
        event?.message ?? `Alert triggered: ${event?.symbol ?? rule?.symbol ?? ""}`,
        `live:${key}`
      );
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-rules"] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient]);

  return socketRef;
}
