const STORAGE_KEY = 'triviahub.playerName'
const MAX_LENGTH = 50

/** Reads the last player name from localStorage (empty string if missing). */
export function getStoredPlayerName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY)?.trim() ?? ''
  } catch {
    return ''
  }
}

/** Persists the player name for the next visit. */
export function setStoredPlayerName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, normalizePlayerName(name))
  } catch {
    // private mode / quota — ignore
  }
}

/** Trims whitespace from a raw name input. */
export function normalizePlayerName(raw: string): string {
  return raw.trim()
}

/** True when the name is non-empty and within the allowed length. */
export function isValidPlayerName(raw: string): boolean {
  const name = normalizePlayerName(raw)
  return name.length >= 1 && name.length <= MAX_LENGTH
}
