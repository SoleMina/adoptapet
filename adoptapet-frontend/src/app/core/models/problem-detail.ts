/** Error body of every service (RFC 7807). Validation errors add `errors` by field. */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Record<string, string>;
}
