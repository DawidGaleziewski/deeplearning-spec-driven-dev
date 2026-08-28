/**
 * Booking lifecycle states. The transition logic (requested → confirmed →
 * completed/cancelled) is owned by Phase 5 — this phase only needs the value to
 * be representable and constrained in the schema.
 */
export const BOOKING_STATUSES = [
  'requested',
  'confirmed',
  'completed',
  'cancelled',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];
