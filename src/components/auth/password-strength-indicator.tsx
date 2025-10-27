import * as React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordStrengthIndicatorProps {
  password: string;
}

interface ValidationRule {
  label: string;
  test: (password: string) => boolean;
}

const validationRules: ValidationRule[] = [
  {
    label: 'At least 8 characters',
    test: (password) => password.length >= 8,
  },
  {
    label: 'Contains uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: 'Contains lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: 'Contains number',
    test: (password) => /\d/.test(password),
  },
  {
    label: 'Contains special character',
    test: (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  },
];

function calculateStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  const passedRules = validationRules.filter((rule) => rule.test(password)).length;
  
  if (passedRules === 0) {
    return { score: 0, label: 'Very Weak', color: 'bg-destructive' };
  } else if (passedRules <= 2) {
    return { score: 25, label: 'Weak', color: 'bg-error' };
  } else if (passedRules === 3) {
    return { score: 50, label: 'Medium', color: 'bg-warning' };
  } else if (passedRules === 4) {
    return { score: 75, label: 'Strong', color: 'bg-success' };
  } else {
    return { score: 100, label: 'Very Strong', color: 'bg-success' };
  }
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const strength = calculateStrength(password);
  const [announced, setAnnounced] = React.useState(false);

  // Announce strength changes to screen readers
  React.useEffect(() => {
    if (password) {
      setAnnounced(true);
      const timer = setTimeout(() => setAnnounced(false), 100);
      return () => clearTimeout(timer);
    }
    return undefined;  // Explicitly return undefined when password is falsy
  }, [strength.label, password]);

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Strength Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Password strength:</span>
          <span
            className={cn(
              'font-medium',
              strength.score >= 75 && 'text-success',
              strength.score >= 50 && strength.score < 75 && 'text-warning',
              strength.score < 50 && 'text-destructive'
            )}
            aria-live={announced ? 'polite' : 'off'}
            role="status"
          >
            {strength.label}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              strength.color
            )}
            style={{ width: `${strength.score}%` }}
            role="progressbar"
            aria-valuenow={strength.score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Password strength: ${strength.label}`}
          />
        </div>
      </div>

      {/* Validation Checklist */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Password must contain:</p>
        <ul className="space-y-1.5" role="list">
          {validationRules.map((rule, index) => {
            const isValid = rule.test(password);
            return (
              <li
                key={index}
                className="flex items-center gap-2 text-sm"
              >
                {isValid ? (
                  <CheckCircle
                    className="h-4 w-4 text-success shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <XCircle
                    className="h-4 w-4 text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    isValid ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {rule.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
