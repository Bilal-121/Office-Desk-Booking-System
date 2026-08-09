// Shared avatar-initials logic — up to 2 letters from a full name, so every
// avatar chip in the app (nav, admin tables) reads the same way.
export function getInitials(name: string | null | undefined): string {
  return (name || '?')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
