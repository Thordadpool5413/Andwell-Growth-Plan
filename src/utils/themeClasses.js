// Professional theme utility classes for consistent styling across all views
export const themeClasses = {
  // Cards with professional gradients and shadows
  card: (dark) => `
    rounded-xl border shadow-md transition-smooth
    ${dark 
      ? "border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-800/40 hover:from-slate-800/80 hover:to-slate-800/60" 
      : "border-slate-200/50 bg-gradient-to-br from-white/80 to-slate-50/80 hover:from-white hover:to-slate-100"}
    hover:shadow-lg
  `,
  
  // Metric cards with confidence levels
  metric: (dark) => `
    rounded-xl border shadow-sm p-5 transition-smooth
    ${dark 
      ? "border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-800/40 hover:from-slate-800/80 hover:to-slate-800/60" 
      : "border-slate-200/50 bg-gradient-to-br from-white/80 to-slate-50/80 hover:from-white hover:to-slate-100"}
    hover:shadow-md hover:scale-[1.01]
  `,
  
  // List items with hover effects
  listItem: (dark, isSelected) => `
    rounded-lg border p-4 transition-all duration-200 cursor-pointer
    ${isSelected
      ? dark ? "border-blue-500/60 bg-blue-950/40 shadow-md" : "border-blue-400 bg-blue-50 shadow-md"
      : dark ? "border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/60 hover:border-slate-600" : "border-slate-200/50 bg-white/50 hover:bg-slate-50/80 hover:border-slate-300"}
  `,
  
  // Section headers with accent colors
  sectionHeader: (dark) => `
    text-heading-sm font-bold mb-4
    ${dark ? "text-white" : "text-slate-950"}
  `,
  
  // Status badges with semantic colors
  badge: (tone, dark) => {
    const colors = {
      success: dark ? "bg-success-900/40 border-success-700/50 text-success-300" : "bg-success-100 border-success-300 text-success-700",
      warning: dark ? "bg-warning-900/40 border-warning-700/50 text-warning-300" : "bg-warning-100 border-warning-300 text-warning-700",
      error: dark ? "bg-error-900/40 border-error-700/50 text-error-300" : "bg-error-100 border-error-300 text-error-700",
      info: dark ? "bg-info-900/40 border-info-700/50 text-info-300" : "bg-info-100 border-info-300 text-info-700",
    };
    return `text-xs font-bold px-2.5 py-1 rounded-full border ${colors[tone] || colors.info}`;
  },
  
  // Data visualization colors
  positive: "text-positive font-semibold",
  negative: "text-negative font-semibold",
  neutral: "text-neutral font-semibold",
  
  // Responsive grid
  grid: {
    cols2: "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6",
    cols3: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6",
    cols4: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6",
  },
};

// Typography utilities
export const typography = {
  heading: "text-heading-sm font-bold",
  label: "text-label text-slate-500 dark:text-slate-400",
  body: "text-body-sm leading-relaxed",
  caption: "text-caption",
};
