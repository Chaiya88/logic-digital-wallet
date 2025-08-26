export type ErrorKind =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'AUTH'
  | 'PERMISSION'
  | 'RATE_LIMIT'
  | 'INTERNAL'
  | 'CONFLICT';

export class AppError extends Error {
  status: number;
  kind: ErrorKind;
  details?: any;
  constructor(kind: ErrorKind, message: string, status?: number, details?: any) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.status = status ?? mapKindToStatus(kind);
    this.details = details;
  }
}

function mapKindToStatus(kind: ErrorKind): number {
  switch (kind) {
    case 'VALIDATION': return 400;
    case 'NOT_FOUND': return 404;
    case 'AUTH': return 401;
    case 'PERMISSION': return 403;
    case 'RATE_LIMIT': return 429;
    case 'CONFLICT': return 409;
    case 'INTERNAL':
    default: return 500;
  }
}

export function isAppError(e: any): e is AppError {
  return e instanceof AppError;
}
