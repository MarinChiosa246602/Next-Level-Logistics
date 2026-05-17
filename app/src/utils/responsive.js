// Responsive design utilities and hooks

export const screenSizes = {
  xs: 320,      // Small phones
  sm: 480,      // Medium phones
  md: 768,      // Tablets
  lg: 1024,     // Large tablets
  xl: 1280,     // Large screens
};

export const breakpoints = {
  phone: '(max-width: 480px)',
  tablet: '(min-width: 768px)',
  desktop: '(min-width: 1024px)',
};

// Helper to get responsive padding based on screen size
export const getResponsivePadding = (screenWidth) => {
  if (screenWidth < 480) return 12;      // Small phones
  if (screenWidth < 768) return 16;      // Medium phones
  if (screenWidth < 1024) return 24;     // Tablets
  return 32;                              // Large screens
};

// Helper to get responsive font size
export const getResponsiveFontSize = (screenWidth, baseSize) => {
  if (screenWidth < 480) return baseSize * 0.9;
  if (screenWidth < 768) return baseSize;
  if (screenWidth < 1024) return baseSize * 1.1;
  return baseSize * 1.2;
};

// Layout helpers for different screen sizes
export const getResponsiveLayout = (screenWidth) => {
  return {
    isSmall: screenWidth < 480,
    isMedium: screenWidth >= 480 && screenWidth < 768,
    isLarge: screenWidth >= 768,
    columns: screenWidth < 768 ? 1 : screenWidth < 1024 ? 2 : 3,
    maxWidth: Math.min(screenWidth - 32, 600),
  };
};

// Dimensions that scale based on screen size
export const getResponsiveDimensions = (screenWidth) => {
  const isSmall = screenWidth < 480;
  return {
    buttonHeight: isSmall ? 44 : 48,
    cardWidth: '100%',
    imageThumbnailSize: isSmall ? 100 : 120,
    iconSize: isSmall ? 20 : 24,
  };
};
