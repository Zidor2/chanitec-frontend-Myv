import React, { useState, useEffect } from 'react';
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
  const [inputValue, setInputValue] = useState<string>(displayAsInteger ? Math.round(value).toString() : Number(value).toFixed(2));

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(displayAsInteger ? Math.round(value).toString() : Number(value).toFixed(2));
  }, [value, displayAsInteger]);
  if (displayOnly) {
    return (
      <Box className="custom-number-input display-only" sx={{ display: 'flex', flexDirection: 'column', width: fullWidth ? '100%' : 'auto' }}>
        {label && <span className="custom-number-label" style={{ fontWeight: 500, marginBottom: 2 }}>{label}</span>}
        <span className="custom-number-value" style={{ padding: '8.5px 14px', background: '#f5f5f5', borderRadius: 4, color: '#888', minHeight: 38 }}>{displayAsInteger ? Math.round(value) : Number(value).toFixed(2)}</span>
      </Box>
    );
  }

  const handleIncrease = () => {
    if (max === undefined || value < max) {
      onChange(Number((value + step).toFixed(2)));
    }
  };

  const handleDecrease = () => {
    if (value > min) {
      onChange(Number((value - step).toFixed(2)));
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
      if (max !== undefined && newValue > max) {
        onChange(max);
      } else if (newValue < min) {
        onChange(min);
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
    // When user finishes editing, validate and update the value
    if (inputValue === '') {
      // If input is empty, reset to minimum value
      onChange(min);
    } else {
      const newValue = parseFloat(inputValue);
      if (isNaN(newValue)) {
        // If invalid number, reset to current value
        setInputValue(displayAsInteger ? Math.round(value).toString() : Number(value).toFixed(2));
      } else {
        // Validate and update
        if (max !== undefined && newValue > max) {
          onChange(max);
        } else if (newValue < min) {
          onChange(min);
        } else {
          onChange(newValue);
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
          disabled={disabled || value <= min}
          className="number-control-button decrease-button"
        >
          <RemoveIcon fontSize="small" />
        </IconButton>

        <input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`custom-number-field ${variant} ${margin}`}
        />

        <IconButton
          size="small"
          onClick={handleIncrease}
          disabled={disabled || (max !== undefined && value >= max)}
          className="number-control-button increase-button"
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default CustomNumberInput;