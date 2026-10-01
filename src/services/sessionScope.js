// Invalidates async work whenever authentication or demo identity changes.
export function createSessionScope() {
  let generation = 0;
  return {
    reset: () => ++generation,
    capture: () => generation,
    isCurrent: (value) => value === generation,
  };
}

export function clearLegacyPrivateState(storage = globalThis.localStorage) {
  for (const key of [
    'connecto-profile',
    'connecto-offers',
    'connecto-needs',
    'connecto-messages',
    'connecto-api-mode',
  ]) {
    try {
      storage?.removeItem(key);
    } catch {
      /* Storage may be unavailable. */
    }
  }
}
