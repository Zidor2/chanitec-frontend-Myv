import React, { ReactNode } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { useMobile } from '../../hooks/useMobile';

interface MobileWrapperProps {
  children: ReactNode;
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
  mobilePadding?: number;
  desktopPadding?: number;
  mobileMargin?: number;
  desktopMargin?: number;
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
  mobileOnly?: boolean;
  desktopOnly?: boolean;
}

const MobileWrapper: React.FC<MobileWrapperProps> = ({
  children,
  className = '',
  mobileClassName = '',
  desktopClassName = '',
  mobilePadding = 2,
  desktopPadding = 3,
  mobileMargin = 1,
  desktopMargin = 2,
  hideOnMobile = false,
  hideOnDesktop = false,
  mobileOnly = false,
  desktopOnly = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const mobileState = useMobile();

  // Handle visibility based on device type
  if (hideOnMobile && isMobile) return null;
  if (hideOnDesktop && !isMobile) return null;
  if (mobileOnly && !isMobile) return null;
  if (desktopOnly && isMobile) return null;

  // Determine padding and margin based on device
  const padding = isMobile ? mobilePadding : desktopPadding;
  const margin = isMobile ? mobileMargin : desktopMargin;

  // Combine classes
  const combinedClassName = `${className} ${isMobile ? mobileClassName : desktopClassName}`.trim();

  return (
    <Box
      className={combinedClassName}
      sx={{
        padding: theme.spacing(padding),
        margin: theme.spacing(margin),
        // Mobile-specific optimizations
        ...(isMobile && {
          '& .MuiTableContainer-root': {
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          },
          '& .MuiButton-root': {
            minHeight: '44px',
            fontSize: '16px',
          },
          '& .MuiTextField-root': {
            '& .MuiInputBase-input': {
              fontSize: '16px', // Prevent zoom on iOS
            },
          },
        }),
      }}
    >
      {children}
    </Box>
  );
};

export default MobileWrapper;
