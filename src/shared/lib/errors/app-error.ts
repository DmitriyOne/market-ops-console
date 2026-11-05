/**
 * Domain errors thrown on the server (route handlers, data loading).
 * Client-side transport failures are `ApiError`s in `@/shared/api` (ADR 0013).
 */
export type AppErrorCode =
  'invalid_request' | 'not_found' | 'data_integrity' | 'forbidden' | 'duplicate_name' | 'too_many';

type AppErrorOptions = { cause?: unknown; details?: Record<string, unknown> };

export abstract class AppError extends Error {
  abstract readonly code: AppErrorCode;
  /** HTTP status a route handler answers with. */
  abstract readonly status: number;
  /** Whether `message` is safe to show to API clients (never true for 5xx). */
  abstract readonly expose: boolean;
  readonly details?: Record<string, unknown>;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.details = options.details;
  }
}

/** The request is malformed or fails validation. */
export class ValidationError extends AppError {
  readonly code = 'invalid_request';
  readonly status = 400;
  readonly expose = true;
}

/** A requested resource does not exist. */
export class NotFoundError extends AppError {
  readonly code = 'not_found';
  readonly status = 404;
  readonly expose = true;

  constructor(resource: string, id: string, options: Omit<AppErrorOptions, 'details'> = {}) {
    super(`${resource} not found`, { ...options, details: { resource, id } });
  }
}

/** The request comes from another site (a write must come from our own pages). */
export class ForbiddenError extends AppError {
  readonly code = 'forbidden';
  readonly status = 403;
  readonly expose = true;
}

/** The request is valid but clashes with what is stored (a duplicate, a full list). */
export class ConflictError extends AppError {
  readonly status = 409;
  readonly expose = true;

  constructor(
    readonly code: 'duplicate_name' | 'too_many',
    message: string,
    options: AppErrorOptions = {},
  ) {
    super(message, options);
  }
}

/** Source data (data.json, fixtures) does not match its schema: a server fault. */
export class DataIntegrityError extends AppError {
  readonly code = 'data_integrity';
  readonly status = 500;
  readonly expose = false;
}
