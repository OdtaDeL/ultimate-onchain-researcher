// Shared response/pagination shapes for the REST API layer. Every handler
// in src/api/ returns one of these envelopes — clients always get
// `{ success: true, data, pagination? }` or `{ success: false, error }`,
// never a bare DTO or a raw thrown error.

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  pagination?: PaginationMeta;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponseBody<T> = ApiSuccessResponse<T> | ApiErrorBody;
