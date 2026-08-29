import { Transform } from 'class-transformer';

/**
 * `@Trim()` — strips surrounding whitespace from a string field before
 * validation runs, so `"  "` fails `@IsNotEmpty()` and stored values are clean.
 * Non-string values pass through untouched for the validator to reject.
 */
export function Trim(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}
