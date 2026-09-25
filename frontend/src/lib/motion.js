// Shared motion language: one spring, one fade-up, one stagger.
// Import from here so every page animates with the same rhythm.
export const spring = { type: "spring", stiffness: 380, damping: 32 };

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
};

export const staggerParent = (gap = 0.05) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap } },
});
