/** Common shape for any paginated list endpoint across providers. */
export interface PaginatedResult<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
}
