/** Survives AuthProvider remounts (e.g. router.refresh) so we do not re-fetch /me on every navigation. */
let initialAuthCheckDone = false;

export function hasInitialAuthCheck(): boolean {
  return initialAuthCheckDone;
}

export function markInitialAuthCheckDone(): void {
  initialAuthCheckDone = true;
}

export function resetInitialAuthCheck(): void {
  initialAuthCheckDone = false;
}
