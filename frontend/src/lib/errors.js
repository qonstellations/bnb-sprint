// Single error-normalization pattern per PLAN Sec 32.
// Backend shape (API.md): { error: { code, message, details } }
export function normalizeApiError(err) {
  const status = err?.response?.status ?? 0;
  const payload = err?.response?.data?.error;
  const code = payload?.code ?? (status === 0 ? "NETWORK_ERROR" : "INTERNAL_ERROR");
  const message =
    payload?.message ??
    (status === 0
      ? "Network error. Check your connection and retry."
      : status === 401
        ? "Session expired. Please log in again."
        : status === 404
          ? "Not found."
          : "Something went wrong. Please retry.");

  return {
    code,
    message,
    status,
    details: payload?.details,
    isAuth: status === 401 || code === "UNAUTHORIZED",
    isValidation: status === 400 || code === "VALIDATION_ERROR",
  };
}
