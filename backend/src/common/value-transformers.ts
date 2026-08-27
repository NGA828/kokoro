import { ValueTransformer } from 'typeorm';

/**
 * SQLite returns DATETIME columns as strings while MySQL returns JS Dates in
 * most driver configs. This transformer normalises both to real Date objects
 * on read, keeping entities portable across engines.
 */
export const dateTransformer: ValueTransformer = {
  to: (value?: Date | null): Date | null => {
    if (value === undefined || value === null) return null;
    return value instanceof Date ? value : new Date(value);
  },
  from: (value?: Date | string | null): Date | null => {
    if (value === undefined || value === null || value === '') return null;
    return value instanceof Date ? value : new Date(value);
  },
};

/** Stores a JSON-serialisable value as TEXT (portable across engines). */
export const jsonTransformer: ValueTransformer = {
  to: (value: unknown): string | null =>
    value === undefined || value === null ? null : JSON.stringify(value),
  from: (value: string | null): unknown => {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  },
};
