import React from "react";
import { User, LogOut } from "lucide-react";
import { UserProfile } from "../types/index.ts";

export type NavTab = "analyzer" | "saved" | "code-studio" | "profile";

interface NavbarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  user: UserProfile | null;
  onLogout: () => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onLogout,
  savedCount,
}) => {
  const tabs: { id: NavTab; label: string }[] = [
    { id: "analyzer", label: "ATS Analyzer" },
    { id: "saved", label: `Saved Reports (${savedCount})` },
    { id: "code-studio", label: "Code Studio" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => setCurrentTab("analyzer")}
          className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap text-left flex items-center gap-2"
        >
          <span className="w-7 h-7 rounded-md bg-slate-900 text-white inline-flex items-center justify-center text-xs font-bold font-display">
            CF
          </span>
          CodeFlow
        </button>

        {/* Zone 2: 4 clean text navigation links */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentTab(tab.id)}
                className={`py-1 whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? "border-slate-900 text-slate-900 font-semibold"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Profile avatar & Logout */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentTab("profile")}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left"
            title="Edit Profile"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-none">
                {user?.name || "Developer"}
              </p>
              <p className="text-[11px] text-slate-500 leading-none mt-1 truncate max-w-[120px]">
                {user?.headline || "Software Engineer"}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
            title="Sign out of CodeFlow"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="flex md:hidden items-center gap-5 px-6 py-2 border-t border-slate-100 overflow-x-auto text-xs font-medium text-slate-600">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCurrentTab(tab.id)}
            className={`whitespace-nowrap pb-1 border-b-2 ${
              currentTab === tab.id
                ? "border-slate-900 text-slate-900 font-semibold"
                : "border-transparent text-slate-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
