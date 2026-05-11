import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Hashes a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a password against a hash using bcrypt.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validates password complexity requirements.
 * - At least 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
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
      error: 'Password must include uppercase, lowercase, numbers, and special characters.' 
    };
  }
  
  return { isValid: true };
}

/**
 * Checks if a password has expired.
 * Default expiration is 90 days.
 */
export function isPasswordExpired(lastChanged: Date, days: number = 90): boolean {
  const now = new Date();
  const expirationDate = new Date(lastChanged);
  expirationDate.setDate(expirationDate.getDate() + days);
  return now > expirationDate;
}
