import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { getToken } from "../api/client.js";
import { queryKeys } from "./queryClient.js";
import { toast } from "./toast.js";

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
    socket.on("order:filled", (payload) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
      queryClient.invalidateQueries({ queryKey: queryKeys.positions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioSummary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioPerformance() });
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolioAllocation() });
      const summary = payload?.order
        ? `${payload.order.side} ${payload.order.quantity} × ${payload.order.symbol} filled.`
        : "Order filled.";
      toast.success(summary);
    });
    socket.on("portfolio:update", (payload) => {
      if (payload) queryClient.setQueryData(queryKeys.portfolioSummary(), payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [queryClient]);

  return socketRef;
}
