import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;
const PASSWORD_HISTORY_LIMIT = 8;

// Common/default passwords blocked regardless of complexity score.
// Kept as a static list to avoid network dependency (no HIBP call at change time).
const BLOCKED_PASSWORDS = new Set([
  'Admin@123456', 'admin@123456', 'ADMIN@123456',
  'Password@123456', 'password@123456', 'PASSWORD@123456',
  'Password@1234', 'password@1234',
  'Admin@1234', 'admin@1234',
  'Welcome@123456', 'welcome@123456',
  'P@ssword1234', 'P@ssw0rd1234',
  'Changeme@123', 'changeme@123',
  'Letmein@123', 'letmein@123',
  'Qwerty@123456', 'qwerty@123456',
  'Test@123456', 'test@123456',
  'User@123456', 'user@123456',
  'System@123456', 'Audit@123456',
]);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordComplexity(password: string): { isValid: boolean; error?: string } {
  if (password.length < 12) {
    return { isValid: false, error: 'Password must be at least 12 characters long.' };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
    return {
      isValid: false,
      error: 'Password must include uppercase, lowercase, numbers, and special characters.',
    };
  }

  if (BLOCKED_PASSWORDS.has(password)) {
    return { isValid: false, error: 'This password is too common. Please choose a unique password.' };
  }

  return { isValid: true };
}

// Returns true if the candidate matches the current password hash — used to
// block same-password changes before writing to the database.
export async function isSameAsCurrent(candidate: string, currentHash: string): Promise<boolean> {
  return bcrypt.compare(candidate, currentHash);
}

// Returns true if the candidate matches any hash in the stored history array.
// Protects against password cycling (e.g. toggling between two passwords).
export async function isInPasswordHistory(candidate: string, history: string[]): Promise<boolean> {
  for (const pastHash of history) {
    if (await bcrypt.compare(candidate, pastHash)) return true;
  }
  return false;
}

// Returns an updated history array: prepends the new hash and trims to the limit.
export function buildUpdatedPasswordHistory(newHash: string, existingHistory: string[]): string[] {
  return [newHash, ...existingHistory].slice(0, PASSWORD_HISTORY_LIMIT);
}

/**
 * Checks if a password has expired.
 * Default expiration is 90 days for regular passwords.
 * Temporary passwords (requirePasswordChange = true) expire in 24 hours.
 */
export function isPasswordExpired(lastChanged: Date, isTemporary: boolean = false): boolean {
  const now = new Date();
  const lastChangedDate = new Date(lastChanged);
  
  if (isTemporary) {
    // Temporary credentials expire in 24 hours
    const expirationDate = new Date(lastChangedDate.getTime() + 24 * 60 * 60 * 1000);
    return now > expirationDate;
  }

  // Regular credentials expire in 90 days
  const expirationDate = new Date(lastChangedDate);
  expirationDate.setDate(expirationDate.getDate() + 90);
  return now > expirationDate;
}
