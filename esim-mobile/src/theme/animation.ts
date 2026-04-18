export const Animation = {
  // Durations (in ms)
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },

  // Easing curves
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Bouncy
  },

  // Common spring configs (for react-native-reanimated)
  spring: {
    gentle: {
      damping: 20,
      stiffness: 90,
    },
    wobbly: {
      damping: 8,
      stiffness: 100,
    },
    stiff: {
      damping: 15,
      stiffness: 200,
    },
  },
} as const;