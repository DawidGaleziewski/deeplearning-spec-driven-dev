"use client";

import * as React from "react";

interface State<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

export interface AsyncState<T> extends State<T> {
  /** Re-run the loader (e.g. after a mutation). Keeps the current data visible until it resolves. */
  reload: () => void;
}

/**
 * Minimal data-loading hook: runs `loader` on mount and whenever `deps` change,
 * aborts in-flight requests on unmount/re-run, and exposes an imperative
 * `reload`. No caching — the Phase 3 surface (one list + a detail view) does
 * not need a data library.
 *
 * `reload` and a `deps` change do not blank the view back to a spinner; the
 * previous result stays until the new one lands (or fails).
 */
export function useAsync<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList,
): AsyncState<T> {
  const [state, setState] = React.useState<State<T>>({
    data: undefined,
    error: undefined,
    loading: true,
  });
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    let active = true;
    loader(controller.signal)
      .then((result) => {
        if (active) setState({ data: result, error: undefined, loading: false });
      })
      .catch((err: unknown) => {
        if (!active || controller.signal.aborted) return;
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err : new Error("Something went wrong"),
          loading: false,
        }));
      });
    return () => {
      active = false;
      controller.abort();
    };
    // `loader` identity is the caller's responsibility to stabilise via deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = React.useCallback(() => setNonce((n) => n + 1), []);

  return { ...state, reload };
}
