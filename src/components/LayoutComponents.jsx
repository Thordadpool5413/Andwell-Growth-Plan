import React, { useState } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import { ChevronRight, Menu, X } from "lucide-react";

export function PageHeader({
  title,
  subtitle = null,
  breadcrumbs = [],
  actions = null,
  stats = [],
  className = "",
}) {
  const { dark } = useDarkMode();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`
      border-b transition-colors duration-300
      ${dark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-white/50"}
      backdrop-blur-md sticky top-0 z-40
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="mb-4 flex items-center gap-2 text-sm">
            {breadcrumbs.map((breadcrumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className={`h-4 w-4 ${dark ? "text-slate-600" : "text-slate-400"}`} />}
                <button
                  onClick={breadcrumb.onClick}
                  className={`font-medium transition-colors ${
                    idx === breadcrumbs.length - 1
                      ? dark ? "text-slate-400" : "text-slate-600"
                      : dark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                  }`}
                >
                  {breadcrumb.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Main header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className={`text-3xl sm:text-4xl font-black mb-1 ${dark ? "text-white" : "text-slate-900"}`}>
              {title}
            </h1>
            {subtitle && (
              <p className={`text-base ${dark ? "text-slate-400" : "text-slate-600"}`}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>

        {/* Stats row */}
        {stats.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col">
                <span className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-slate-500" : "text-slate-600"}`}>
                  {stat.label}
                </span>
                <span className={`text-lg sm:text-2xl font-bold mt-1 ${dark ? "text-white" : "text-slate-900"}`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function EnhancedNavBar({
  tabs = [],
  activeTab = "",
  onTabChange = () => {},
  rightContent = null,
  showIcons = true,
  className = "",
}) {
  const { dark } = useDarkMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabIcons = {
    "Executive View": "📊",
    "County Plan": "📍",
    "Referral Plan": "📞",
    "Competitive View": "🎯",
    "Service Lines": "🏥",
    "CMS Data": "💾",
    "Financial Model": "💰",
    "Staffing Model": "👥",
    "Sensitivity": "⚙️",
    "Opportunity Score": "⭐",
    "Launch Timeline": "🗓️",
    "Board Report": "📋",
    "Launch Checklist": "✓",
  };

  return (
    <nav className={`
      border-b transition-colors duration-300
      ${dark ? "border-slate-700 bg-slate-800/30" : "border-slate-200 bg-white/50"}
      backdrop-blur-md sticky top-20 z-30
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Desktop tabs */}
          <div className="hidden md:flex items-center gap-1 flex-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`
                  px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap
                  flex items-center gap-2
                  ${activeTab === tab
                    ? dark
                      ? "bg-blue-600 text-white shadow-shadow-md"
                      : "bg-slate-900 text-white shadow-shadow-sm"
                    : dark
                      ? "text-slate-300 hover:bg-slate-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }
                `}
              >
                {showIcons && <span>{tabIcons[tab] || "•"}</span>}
                {tab}
              </button>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Right content */}
          {rightContent && (
            <div className="ml-4 flex items-center gap-2">
              {rightContent}
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className={`pb-4 space-y-2 ${dark ? "border-t border-slate-700" : "border-t border-slate-200"}`}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  onTabChange(tab);
                  setMobileMenuOpen(false);
                }}
                className={`
                  block w-full text-left px-4 py-2 rounded-lg font-medium transition-colors
                  ${activeTab === tab
                    ? dark
                      ? "bg-blue-600 text-white"
                      : "bg-slate-900 text-white"
                    : dark
                      ? "text-slate-300 hover:bg-slate-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

export function PageSection({
  title,
  subtitle = null,
  action = null,
  children,
  className = "",
}) {
  const { dark } = useDarkMode();

  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>
            {title}
          </h2>
          {subtitle && (
            <p className={`text-sm mt-1 ${dark ? "text-slate-400" : "text-slate-600"}`}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}
