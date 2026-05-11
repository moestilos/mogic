/**
 * Mogic API base URL. Override at deploy time.
 * If empty, frontend remains in local-only mode (no remote calls).
 */
export const MOGIC_API_URL = (window as { __MOGIC_API_URL__?: string }).__MOGIC_API_URL__ ?? '';

export const API_ENABLED = !!MOGIC_API_URL;
