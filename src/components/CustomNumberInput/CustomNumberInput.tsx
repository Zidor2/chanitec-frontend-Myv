import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, IconButton } from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import './CustomNumberInput.scss';

interface CustomNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  fullWidth?: boolean;
  disabled?: boolean;
  variant?: 'outlined' | 'filled' | 'standard';
  margin?: 'none' | 'dense' | 'normal';
  displayOnly?: boolean;
  displayAsInteger?: boolean;
}

const CustomNumberInput: React.FC<CustomNumberInputProps> = ({
  value,
  onChange,
  label,
  min = 0,
  max,
  step = 1,
  fullWidth = false,
  disabled = false,
  variant = 'outlined',
  margin = 'dense',
  displayOnly = false,
  displayAsInteger = false
}) => {
  const formatForInput = useCallback(
    (n: number) => (displayAsInteger ? Math.round(n).toString() : Number(n).toFixed(2)),
    [displayAsInteger]
  );

  const [inputValue, setInputValue] = useState<string>(formatForInput(value));
  /** When true, the user is editing — do not overwrite the string from `value` on each keystroke. */
  const isFocusedRef = useRef(false);

  // Update input value when prop value changes (e.g. parent reset, +/- buttons) — not while typing
  useEffect(() => {
    if (!isFocusedRef.current) {
      setInputValue(formatForInput(value));
    }
  }, [value, formatForInput]);
  if (displayOnly) {
    return (
      <Box className="custom-number-input display-only" sx={{ display: 'flex', flexDirection: 'column', width: fullWidth ? '100%' : 'auto' }}>
        {label && <span className="custom-number-label" style={{ fontWeight: 500, marginBottom: 2 }}>{label}</span>}
        <span className="custom-number-value" style={{ padding: '8.5px 14px', background: '#f5f5f5', borderRadius: 4, color: '#888', minHeight: 38 }}>{displayAsInteger ? Math.round(value) : Number(value).toFixed(2)}</span>
      </Box>
    );
  }

  // Props may be strings (e.g. from API); `value + step` would concatenate strings and break `.toFixed`.
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  const safeStep = Number.isFinite(Number(step)) && Number(step) !== 0 ? Number(step) : 1;
  const safeMin = Number.isFinite(Number(min)) ? Number(min) : 0;
  const safeMax = max !== undefined && Number.isFinite(Number(max)) ? Number(max) : undefined;

  const handleIncrease = () => {
    if (safeMax === undefined || safeValue < safeMax) {
      let newVal = Number((safeValue + safeStep).toFixed(2));
      if (safeMax !== undefined && newVal > safeMax) {
        newVal = safeMax;
      }
      onChange(newVal);
      setInputValue(formatForInput(newVal));
    }
  };

  const handleDecrease = () => {
    if (safeValue > safeMin) {
      let newVal = Number((safeValue - safeStep).toFixed(2));
      if (newVal < safeMin) {
        newVal = safeMin;
      }
      onChange(newVal);
      setInputValue(formatForInput(newVal));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInputValue = e.target.value;
    setInputValue(newInputValue);

    // Allow empty input
    if (newInputValue === '') {
      return; // Don't update the parent value, let user continue typing
    }

    const newValue = parseFloat(newInputValue);
    if (!isNaN(newValue)) {
      if (safeMax !== undefined && newValue > safeMax) {
        onChange(safeMax);
        setInputValue(formatForInput(safeMax));
      } else if (newValue < safeMin) {
        onChange(safeMin);
        setInputValue(formatForInput(safeMin));
      } else {
        onChange(newValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrease();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrease();
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    // When user finishes editing, validate and update the value
    if (inputValue === '') {
      onChange(safeMin);
      setInputValue(formatForInput(safeMin));
    } else {
      const newValue = parseFloat(inputValue);
      if (isNaN(newValue)) {
        setInputValue(formatForInput(safeValue));
      } else {
        if (safeMax !== undefined && newValue > safeMax) {
          onChange(safeMax);
          setInputValue(formatForInput(safeMax));
        } else if (newValue < safeMin) {
          onChange(safeMin);
          setInputValue(formatForInput(safeMin));
        } else {
          onChange(newValue);
          setInputValue(formatForInput(newValue));
        }
      }
    }
  };

  return (
    <Box className="custom-number-input" sx={{ display: 'flex', flexDirection: 'column', width: fullWidth ? '100%' : 'auto' }}>
      {label && <span className="custom-number-label">{label}</span>}
      <Box className="custom-number-container">
        <IconButton
          size="small"
          onClick={handleDecrease}
          disabled={disabled || safeValue <= safeMin}
          className="number-control-button decrease-button"
        >
          <RemoveIcon fontSize="small" />
        </IconButton>

        <input
          type="number"
          value={inputValue}
          onFocus={() => {
            isFocusedRef.current = true;
          }}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          min={safeMin}
          max={safeMax}
          step={safeStep}
          disabled={disabled}
          className={`custom-number-field ${variant} ${margin}`}
        />

        <IconButton
          size="small"
          onClick={handleIncrease}
          disabled={disabled || (safeMax !== undefined && safeValue >= safeMax)}
          className="number-control-button increase-button"
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default CustomNumberInput;