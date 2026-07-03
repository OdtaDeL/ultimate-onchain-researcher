// Type-only mirror of the backend's response envelope (src/api/types.ts).
// `import type` is erased at compile time, so referencing src/api/* here
// never pulls its runtime handler code (which needs a SupabaseClient) into
// the frontend bundle — only the shapes are shared.
export type { ApiSuccessResponse, ApiErrorBody, ApiResponseBody, PaginationMeta, PaginationParams } from "@/api/types";
