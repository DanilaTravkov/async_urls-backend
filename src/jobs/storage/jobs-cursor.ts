import { Job } from '../domain/job.types';
import { InvalidJobsCursorError } from './invalid-jobs-cursor.error';

interface JobsCursorPayload {
  createdAt: string;
  id: string;
  version: 1;
}

export function encodeJobsCursor(job: Job): string {
  const payload: JobsCursorPayload = {
    createdAt: job.createdAt.toISOString(),
    id: job.id,
    version: 1,
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeJobsCursor(cursor: string): JobsCursorPayload {
  try {
    const value: unknown = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    );

    if (!isJobsCursorPayload(value)) {
      throw new InvalidJobsCursorError();
    }

    return value;
  } catch (error) {
    if (error instanceof InvalidJobsCursorError) {
      throw error;
    }

    throw new InvalidJobsCursorError();
  }
}

function isJobsCursorPayload(value: unknown): value is JobsCursorPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === 1 &&
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.createdAt === 'string' &&
    !Number.isNaN(Date.parse(candidate.createdAt))
  );
}
