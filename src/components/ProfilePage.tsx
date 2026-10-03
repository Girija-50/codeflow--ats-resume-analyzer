import React, { useState } from "react";
import { User, Camera, Check, AlertCircle, Save, Sparkles } from "lucide-react";
import { UserProfile } from "../types/index.ts";

interface ProfilePageProps {
  user: UserProfile;
  token: string;
  onProfileUpdated: (updatedUser: UserProfile) => void;
  savedResumesCount: number;
}

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Luna",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Aiden",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Maya",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Oliver",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Zoe",
];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  token,
  onProfileUpdated,
  savedResumesCount,
}) => {
  const [name, setName] = useState(user.name || "");
  const [headline, setHeadline] = useState(user.headline || "");
  const [bio, setBio] = useState(user.bio || "");
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2.5 * 1024 * 1024) {
        setErrorMsg("Image size must be under 2.5MB.");
        return;
      }
      setErrorMsg("");
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await fetch("/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          headline,
          bio,
          avatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      onProfileUpdated(data.user);
      setSuccessMsg("Profile and picture updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Error saving profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>Account Settings</span>
          <span aria-hidden="true">/</span>
          <span className="text-slate-900 font-medium">Profile Management</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
          Candidate Profile &amp; Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Update your personal details, profile picture, and career headline.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Avatar & Quick Stats */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
            <p className="text-xs font-semibold text-slate-700 mb-4">
              Profile Picture
            </p>
            <div className="relative inline-block mx-auto mb-4">
              <div className="w-28 h-28 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center shadow-xs">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-slate-400" />
                )}
              </div>
              <label
                htmlFor="profile-file-input"
                className="absolute bottom-0 right-1 p-2 bg-slate-900 text-white rounded-full cursor-pointer hover:bg-slate-800 transition-colors shadow-sm"
                title="Upload new photo"
              >
                <Camera className="w-4 h-4" />
              </label>
              <input
                id="profile-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Upload a JPG, PNG, or GIF (max 2.5MB).
            </p>

            {/* Preset Avatars */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-600 mb-2">
                Or pick a character avatar:
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {PRESET_AVATARS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatar(p)}
                    className={`w-8 h-8 rounded-full border overflow-hidden p-0.5 transition-transform hover:scale-110 ${
                      avatar === p ? "border-slate-900 ring-2 ring-slate-900/30" : "border-slate-200"
                    }`}
                  >
                    <img src={p} alt={`Avatar preset ${i + 1}`} className="w-full h-full rounded-full" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Telemetry Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-xs">
            <h3 className="font-semibold text-slate-900 font-display">
              Workspace Overview
            </h3>
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>Account Email</span>
              <span className="font-mono text-slate-900">{user.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
              <span>Resumes Analyzed</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {savedResumesCount}
              </span>
            </div>
            <div className="flex justify-between py-1 text-slate-600">
              <span>Member Since</span>
              <span className="font-mono text-slate-500">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Active"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Fields */}
        <div className="md:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Professional Role / Career Headline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Senior Full Stack Engineer (React &amp; Node.js)"
              className="w-full px-3.5 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
            />
            <p className="text-xs text-slate-500 mt-1">
              Appears on your generated resume reports and code generation headers.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Bio / Executive Summary
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief summary of your primary technical competencies, target positions, and career accomplishments..."
              className="w-full p-3.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Avatar Image URL (Optional)
            </label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://example.com/my-photo.jpg"
              className="w-full px-3.5 py-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-400" />
              Changes take effect immediately across all sessions.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
            >
              <Save className="w-3.5 h-3.5" />
              {loading ? "Saving Changes..." : "Save Profile"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
