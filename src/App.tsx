import React, { useState, useEffect, useCallback } from "react";
import { Navbar, NavTab } from "./components/Navbar.tsx";
import { AuthScreen } from "./components/AuthScreen.tsx";
import { ResumeAnalyzer } from "./components/ResumeAnalyzer.tsx";
import { SavedReports } from "./components/SavedReports.tsx";
import { ProfilePage } from "./components/ProfilePage.tsx";
import { CodeStudio } from "./components/CodeStudio.tsx";
import { UserProfile, SavedResumeRecord } from "./types/index.ts";

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>("analyzer");
  const [savedResumes, setSavedResumes] = useState<SavedResumeRecord[]>([]);
  const [activeCodeTopic, setActiveCodeTopic] = useState<string>("");
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  const fetchHistory = useCallback(async (activeToken: string) => {
    try {
      const res = await fetch("/resume/history", {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.resumes)) {
          setSavedResumes(data.resumes);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const savedToken = localStorage.getItem("token");
      if (!savedToken) {
        if (isMounted) setAuthChecking(false);
        return;
      }

      try {
        const res = await fetch("/auth/me", {
          headers: { Authorization: `Bearer ${savedToken}` },
        });

        if (res.ok) {
          const userData = await res.json();
          if (isMounted) {
            setToken(savedToken);
            setUser(userData);
            fetchHistory(savedToken);
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem("token");
          if (isMounted) {
            setToken(null);
            setUser(null);
          }
        }
      } catch {
        // Network issue
      } finally {
        if (isMounted) setAuthChecking(false);
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [fetchHistory]);

  const handleAuthSuccess = (newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    fetchHistory(newToken);
    setCurrentTab("analyzer");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setSavedResumes([]);
  };

  const handleOpenCodeStudio = (skill: string) => {
    setActiveCodeTopic(skill);
    setCurrentTab("code-studio");
  };

  // Auth gate: if not authenticated, show Login & Sign Up screen first!
  if (!token || !user) {
    if (authChecking) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
        </div>
      );
    }
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}
        savedCount={savedResumes.length}
      />

      <main className="flex-1">
        {currentTab === "analyzer" && (
          <ResumeAnalyzer
            token={token}
            onAnalysisSaved={() => fetchHistory(token)}
            onOpenCodeStudioForSkill={handleOpenCodeStudio}
          />
        )}

        {currentTab === "saved" && (
          <SavedReports
            token={token}
            savedResumes={savedResumes}
            onRefresh={() => fetchHistory(token)}
            onGoToAnalyzer={() => setCurrentTab("analyzer")}
            onOpenCodeStudioForSkill={handleOpenCodeStudio}
          />
        )}

        {currentTab === "code-studio" && (
          <CodeStudio token={token} initialTopic={activeCodeTopic} />
        )}

        {currentTab === "profile" && (
          <ProfilePage
            user={user}
            token={token}
            onProfileUpdated={(updated) => setUser(updated)}
            savedResumesCount={savedResumes.length}
          />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-16 py-6">
        <div className="max-w-[1360px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>CodeFlow — AI ATS Resume Analyzer &amp; Code Studio</p>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setCurrentTab("analyzer")}
              className="hover:text-slate-900 transition-colors"
            >
              ATS Analyzer
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab("saved")}
              className="hover:text-slate-900 transition-colors"
            >
              Saved Reports ({savedResumes.length})
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab("code-studio")}
              className="hover:text-slate-900 transition-colors"
            >
              Code Studio
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab("profile")}
              className="hover:text-slate-900 transition-colors"
            >
              Profile
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
