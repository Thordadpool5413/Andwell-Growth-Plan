// Animation easing functions for smooth transitions
export const easings = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeInQuart: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
  easeOutQuart: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
  easeInQuint: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
  easeOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
  easeInExpo: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
  easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
  easeInCirc: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
  easeOutCirc: 'cubic-bezier(0.075, 0.82, 0.165, 1)',
  easeInElastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeOutElastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInBounce: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
  easeOutBounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

// Animation duration presets
export const durations = {
  instant: 0,
  fastest: 100,
  faster: 200,
  fast: 300,
  normal: 400,
  slow: 500,
  slower: 600,
  slowest: 800,
};

// Interpolate between values for smooth transitions
export const interpolate = (start, end, progress) => {
  return start + (end - start) * progress;
};

// Format number with animation
export const formatNumberWithAnimation = (value, formatter) => {
  if (typeof value !== 'number') return value;
  return formatter ? formatter(value) : value.toLocaleString();
};

// Get animation class names based on variant
export const getAnimationClass = (variant) => {
  const variants = {
    slideIn: 'animate-slide-in',
    slideOut: 'animate-slide-out',
    slideInLeft: 'animate-slide-in-left',
    slideInRight: 'animate-slide-in-right',
    slideInTop: 'animate-slide-in-top',
    slideInBottom: 'animate-slide-in-bottom',
    fadeIn: 'animate-fade-in',
    fadeOut: 'animate-fade-out',
    scaleIn: 'animate-scale-in',
    scaleOut: 'animate-scale-out',
    bounceIn: 'animate-bounce-in',
    bounceOut: 'animate-bounce-out',
    flipIn: 'animate-flip-in',
    rotateIn: 'animate-rotate-in',
    shake: 'animate-shake',
  };
  return variants[variant] || variants.fadeIn;
};

// Stagger animation helper
export const getStaggerDelay = (index, baseDelay = 50) => {
  return `${index * baseDelay}ms`;
};

// Spring physics animation
export const springAnimation = (mass = 1, tension = 170, friction = 26) => {
  return {
    mass,
    tension,
    friction,
    config: `cubic-bezier(0.68, -0.55, 0.265, 1.55)`,
  };
};

export default {
  easings,
  durations,
  interpolate,
  formatNumberWithAnimation,
  getAnimationClass,
  getStaggerDelay,
  springAnimation,
};
