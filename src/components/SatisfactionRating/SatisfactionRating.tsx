import React from 'react';
import './SatisfactionRating.css';

export const SATISFACTION_OPTIONS = [
  { score: 20, label: 'Très mauvais', mouth: 'M 13 26 Q 20 20 27 26' },
  { score: 40, label: 'Mauvais', mouth: 'M 14 25 Q 20 22 26 25' },
  { score: 60, label: 'Normal', mouth: 'M 14 25 L 26 25' },
  { score: 80, label: 'Bien', mouth: 'M 14 24 Q 20 29 26 24' },
  { score: 100, label: 'Parfait', mouth: 'M 13 23 Q 20 31 27 23' }
] as const;

export type SatisfactionScore = typeof SATISFACTION_OPTIONS[number]['score'] | 0;

export function parseSatisfactionScore(value: unknown): SatisfactionScore {
  if (value == null || value === '') return 0;
  const n = Number(String(value).trim());
  if (SATISFACTION_OPTIONS.some((option) => option.score === n)) {
    return n as SatisfactionScore;
  }
  if (Number.isInteger(n) && n >= 1 && n <= 5) {
    return (n * 20) as SatisfactionScore;
  }
  return 0;
}

function Face({ mouth }: { mouth: string }) {
  return (
    <svg className="satisfaction-face" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="satisfaction-face-head" cx="20" cy="20" r="16" />
      <circle className="satisfaction-face-feature" cx="14" cy="16" r="2" />
      <circle className="satisfaction-face-feature" cx="26" cy="16" r="2" />
      <path className="satisfaction-face-mouth" d={mouth} />
    </svg>
  );
}

interface SatisfactionRatingProps {
  value?: unknown;
  onChange?: (score: SatisfactionScore) => void;
  readOnly?: boolean;
  ariaLabel: string;
}

export default function SatisfactionRating({
  value,
  onChange,
  readOnly = false,
  ariaLabel
}: SatisfactionRatingProps) {
  const selected = parseSatisfactionScore(value);

  return (
    <div className="satisfaction-rating" role="radiogroup" aria-label={ariaLabel}>
      {SATISFACTION_OPTIONS.map((option) => {
        const isSelected = selected === option.score;
        const title = `${option.label} (${option.score})`;

        if (readOnly) {
          return (
            <div className="satisfaction-item" key={option.score}>
              <span
                className={'satisfaction-btn' + (isSelected ? ' selected' : '')}
                role="img"
                aria-label={title}
                title={title}
              >
                <Face mouth={option.mouth} />
              </span>
              <div className={'satisfaction-label' + (isSelected ? ' selected' : '')}>{option.score}</div>
            </div>
          );
        }

        return (
          <div className="satisfaction-item" key={option.score}>
            <button
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={'satisfaction-btn' + (isSelected ? ' selected' : '')}
              aria-label={title}
              title={title}
              onClick={() => onChange?.(isSelected ? 0 : option.score)}
            >
              <Face mouth={option.mouth} />
            </button>
            <div className={'satisfaction-label' + (isSelected ? ' selected' : '')}>{option.score}</div>
          </div>
        );
      })}
    </div>
  );
}
