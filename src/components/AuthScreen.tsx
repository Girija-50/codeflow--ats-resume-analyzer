import React, { useState } from "react";
import { User, Lock, Mail, Camera, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { UserProfile } from "../types/index.ts";

interface AuthScreenProps {
  onAuthSuccess: (token: string, user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [headline, setHeadline] = useState("Software Engineer");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Profile picture must be under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "signup" ? "/auth/signup" : "/auth/login";
      const payload =
        mode === "signup"
          ? { name, email, password, headline, avatar }
          : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      localStorage.setItem("token", data.token);
      onAuthSuccess(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-12">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-lg font-display">
            CF
          </div>
          <span className="text-2xl font-bold font-display tracking-tight text-slate-900">
            CodeFlow
          </span>
        </div>
        <p className="text-sm text-slate-600 max-w-sm mx-auto">
          Instantly transform your analytical insights into functional, production-ready code with ease.
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
        {/* Mode Toggle Tabs */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
              mode === "login"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
            }}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
              mode === "signup"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              {/* Profile Picture Upload Field */}
              <div className="flex items-center gap-4 py-1">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-300 overflow-hidden flex items-center justify-center">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="Profile avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-7 h-7 text-slate-400" />
                    )}
                  </div>
                  <label
                    htmlFor="signup-avatar-file"
                    className="absolute bottom-0 right-0 p-1.5 bg-slate-900 text-white rounded-full cursor-pointer hover:bg-slate-800 transition-colors shadow-xs"
                    title="Upload profile picture"
                  >
                    <Camera className="w-3 h-3" />
                  </label>
                  <input
                    id="signup-avatar-file"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block">
                    Profile Picture (Optional)
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click camera icon to upload your photo, or update later in your Profile page.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Professional Role / Headline
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            {loading ? (
              "Please wait..."
            ) : mode === "login" ? (
              <>
                Sign In to CodeFlow
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Create Account &amp; Open Workspace
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            JWT Secured
          </span>
        </div>
      </div>
    </div>
  );
};
