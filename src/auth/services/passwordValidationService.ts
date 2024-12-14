interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number;
}

export class PasswordValidationService {
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;
  private static readonly COMMON_PASSWORDS = [
    'password123', 'qwerty123', '12345678', 'letmein123',
    // Add more common passwords...
  ];

  static validate(password: string): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    } else if (password.length > this.MAX_LENGTH) {
      errors.push(`Password cannot be longer than ${this.MAX_LENGTH} characters`);
    } else {
      score += Math.min(password.length / 2, 10); // Up to 10 points for length
    }

    // Character type checks
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[^A-Za-z0-9]/.test(password);

    if (!hasUppercase) errors.push('Password must contain at least one uppercase letter');
    if (!hasLowercase) errors.push('Password must contain at least one lowercase letter');
    if (!hasNumbers) errors.push('Password must contain at least one number');
    if (!hasSpecialChars) errors.push('Password must contain at least one special character');

    // Add points for character variety
    if (hasUppercase) score += 5;
    if (hasLowercase) score += 5;
    if (hasNumbers) score += 5;
    if (hasSpecialChars) score += 5;

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) { // Repeated characters
      errors.push('Password should not contain repeated characters (e.g., "aaa")');
      score -= 5;
    }

    if (/^(?:abc|123|qwe|password|letme|admin)/i.test(password)) {
      errors.push('Password contains common patterns');
      score -= 5;
    }

    // Check against common passwords
    if (this.COMMON_PASSWORDS.includes(password.toLowerCase())) {
      errors.push('This is a commonly used password');
      score -= 10;
    }

    // Check for keyboard patterns
    const keyboardPatterns = ['qwerty', 'asdfgh', '123456'];
    if (keyboardPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
      errors.push('Password contains keyboard patterns');
      score -= 5;
    }

    // Normalize score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong';
    if (score < 40) strength = 'weak';
    else if (score < 70) strength = 'medium';
    else strength = 'strong';

    return {
      isValid: errors.length === 0,
      errors,
      strength,
      score
    };
  }
} 