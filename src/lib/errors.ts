export function getErrorMessage(error: unknown, fallback = "Please try again.") {
  return error instanceof Error ? error.message : typeof error === "object" && error !== null && "message" in error ? String(error.message) : fallback;
}
