"use client";

import { useState, useRef, useEffect } from "react";
import WorkspaceShell from "@/components/WorkspaceShell";
import { useWorkspace } from "@/context/WorkspaceContext";

// --- TYPES ---
type SettingsCategory =
  | "Profile"
  | "Security"
  | "Preferences"
  | "Notifications"
  | "Workspace"
  | "Data"
  | "Help";

type WorkspaceMember = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member";
  avatar: string;
};

const INITIAL_MEMBERS: WorkspaceMember[] = [
  {
    id: "m-1",
    name: "Nabila Sabrina",
    email: "nabila@example.com",
    role: "Owner",
    avatar: "NS",
  },
  {
    id: "m-2",
    name: "Ahmad Rizky",
    email: "ahmad.rizky@example.com",
    role: "Admin",
    avatar: "AR",
  },
  {
    id: "m-3",
    name: "M. Kenzie",
    email: "kenzie.uiux@example.com",
    role: "Member",
    avatar: "MK",
  },
  {
    id: "m-4",
    name: "Jasmine L.",
    email: "jasmine.backend@example.com",
    role: "Member",
    avatar: "JL",
  },
];

function Icon({ name, size = 14 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<string, React.ReactNode> = {
    user: (
      <>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    sliders: (
      <>
        <line x1="4" y1="21" x2="4" y2="14" />
        <line x1="4" y1="10" x2="4" y2="3" />
        <line x1="12" y1="21" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12" y2="3" />
        <line x1="20" y1="21" x2="20" y2="16" />
        <line x1="20" y1="12" x2="20" y2="3" />
        <line x1="1" y1="14" x2="7" y2="14" />
        <line x1="9" y1="8" x2="15" y2="8" />
        <line x1="17" y1="16" x2="23" y2="16" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
    users: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M9 21v-2a4 4 0 0 1 4-4h1" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    database: (
      <>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </>
    ),
    helpCircle: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </>
    ),
    x: <path d="M18 6 6 18M6 6l12 12" />,
    externalLink: (
      <>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.user}</svg>;
}

export default function SettingsPage() {
  const { profile, updateProfile } = useWorkspace();

  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("Profile");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States - Sync dengan Global Context
  const [fullName, setFullName] = useState(profile.name);
  const [emailAddress, setEmailAddress] = useState(profile.email);
  const [bio, setBio] = useState(profile.bio);

  useEffect(() => {
    setFullName(profile.name);
    setEmailAddress(profile.email);
    setBio(profile.bio);
  }, [profile]);

  // Security & Preferences local states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const [themeMode, setThemeMode] = useState<"Dark" | "Light" | "System">("Dark");
  const [language, setLanguage] = useState("English (US)");
  const [timeZone, setTimeZone] = useState("UTC+07:00 (Asia/Jakarta)");
  const [dateFormat, setDateFormat] = useState("YYYY-MM-DD");
  const [startOfWeek, setStartOfWeek] = useState<"Sunday" | "Monday">("Monday");
  const [defaultCalendarView, setDefaultCalendarView] = useState<"Month" | "Week" | "Day">("Month");

  const [notifNewMessages, setNotifNewMessages] = useState(true);
  const [notifMentions, setNotifMentions] = useState(true);
  const [notifTaskAssignment, setNotifTaskAssignment] = useState(true);
  const [notifDeadlineChanges, setNotifDeadlineChanges] = useState(true);
  const [notifScheduleReminders, setNotifScheduleReminders] = useState(false);
  const [notifEmailDigest, setNotifEmailDigest] = useState(true);

  const [workspaceName, setWorkspaceName] = useState("Orbit Workspace");
  const [membersList] = useState<WorkspaceMember[]>(INITIAL_MEMBERS);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Upload & Remove Photo -> Disimpan ke WorkspaceContext
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile({ avatarUrl: reader.result as string });
        triggerToast("Profile photo uploaded and saved.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    updateProfile({ avatarUrl: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
    triggerToast("Profile photo removed.");
  };

  // Simpan Form Profile -> Update Global Context & LocalStorage
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: fullName,
      email: emailAddress,
      bio,
    });
    triggerToast("Profile information saved permanently.");
  };

  const handleSecuritySave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New password and confirmation do not match.");
      return;
    }
    triggerToast("Security credentials updated.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const categories: { key: SettingsCategory; label: string; icon: string; desc: string }[] = [
    { key: "Profile", label: "Profile", icon: "user", desc: "Manage your personal information." },
    { key: "Security", label: "Security", icon: "shield", desc: "Password, sessions, and account safety." },
    { key: "Preferences", label: "Preferences", icon: "sliders", desc: "Customize your Orbit interface." },
    { key: "Notifications", label: "Notifications", icon: "bell", desc: "Control alert channels & preferences." },
    { key: "Workspace", label: "Workspace", icon: "users", desc: "Workspace identity & member access." },
    { key: "Data", label: "Data & Privacy", icon: "database", desc: "Export data and privacy settings." },
    { key: "Help", label: "Help & About", icon: "helpCircle", desc: "Documentation, support & app version." },
  ];

  return (
    <WorkspaceShell>
      <div className="p-5 pb-20 text-white space-y-4 max-w-6xl mx-auto w-full">
        <div className="pb-3 border-b border-[var(--line)]">
          <h1 className="text-[28px] font-bold tracking-tight text-white">Settings</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Manage your account and workspace preferences.
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />

        <div className="flex flex-col md:flex-row gap-6 items-start">
          <aside className="w-full md:w-56 shrink-0 bg-[#1e2022] border border-[var(--line)] rounded-2xl p-2 space-y-1">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                    isActive
                      ? "bg-[#282a2d] text-white font-semibold border border-[var(--line)]"
                      : "text-gray-400 hover:text-white hover:bg-[#242628]"
                  }`}
                >
                  <span className={isActive ? "text-[#98E499]" : "text-gray-400"}>
                    <Icon name={cat.icon} size={14} />
                  </span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </aside>

          <main className="flex-1 w-full bg-[#1e2022] border border-[var(--line)] rounded-2xl p-5 space-y-5">
            <div className="pb-3 border-b border-[var(--line)]">
              <h2 className="text-sm font-semibold text-white">
                {categories.find((c) => c.key === activeCategory)?.label}
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {categories.find((c) => c.key === activeCategory)?.desc}
              </p>
            </div>

            {/* CATEGORY 1: PROFILE */}
            {activeCategory === "Profile" && (
              <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
                <div className="flex items-center gap-4 p-3.5 rounded-xl bg-[#242628] border border-[var(--line)]">
                  <div className="relative shrink-0">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt="Profile avatar"
                        className="w-12 h-12 rounded-full object-cover border border-[#98E499]/50"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center font-bold text-sm text-violet-300">
                        {profile.initials}
                      </div>
                    )}
                  </div>

                  <div>
                    <strong className="block text-xs text-white font-semibold">{profile.name}</strong>
                    <span className="text-[10px] text-gray-400">JPG, PNG, or SVG (Max 5MB)</span>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    {profile.avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium transition cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 rounded-lg bg-[#35383a] hover:bg-[#404346] text-xs font-medium text-gray-200 transition cursor-pointer"
                    >
                      Change photo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">Full name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--line)] bg-[#242628] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#98E499]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">Email address</label>
                  <input
                    type="email"
                    required
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full rounded-xl border border-[var(--line)] bg-[#242628] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#98E499]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">Bio / Role Description</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-xl border border-[var(--line)] bg-[#242628] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#98E499]"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    style={{ backgroundColor: "#98E499", color: "#26282a" }}
                    className="px-4 py-1.5 rounded-xl font-bold text-xs hover:bg-[#85d886] transition cursor-pointer shadow-sm"
                  >
                    Save changes
                  </button>
                </div>
              </form>
            )}

            {/* CATEGORY 2: SECURITY */}
            {activeCategory === "Security" && (
              <div className="space-y-5 text-xs">
                <form onSubmit={handleSecuritySave} className="space-y-3">
                  <strong className="block text-xs font-semibold text-white">Change Password</strong>
                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px]">Current password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-xl border border-[var(--line)] bg-[#242628] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#98E499]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 mb-1 text-[11px]">New password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border border-[var(--line)] bg-[#242628] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#98E499]"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 text-[11px]">Confirm new password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-[var(--line)] bg-[#242628] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#98E499]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      style={{ backgroundColor: "#98E499", color: "#26282a" }}
                      className="px-4 py-1.5 rounded-xl font-bold text-xs hover:bg-[#85d886] transition cursor-pointer"
                    >
                      Update password
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* CATEGORY 3: PREFERENCES */}
            {activeCategory === "Preferences" && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px]">Appearance Theme</label>
                    <select
                      value={themeMode}
                      onChange={(e) => setThemeMode(e.target.value as any)}
                      className="w-full rounded-xl border border-[var(--line)] bg-[#242628] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#98E499]"
                    >
                      <option value="Dark">Dark Charcoal (Default)</option>
                      <option value="Light">Light Mode</option>
                      <option value="System">System Preference</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px]">Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full rounded-xl border border-[var(--line)] bg-[#242628] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#98E499]"
                    >
                      <option value="English (US)">English (US)</option>
                      <option value="Indonesian">Bahasa Indonesia</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORY 4: NOTIFICATIONS */}
            {activeCategory === "Notifications" && (
              <div className="space-y-3 text-xs">
                {[
                  { label: "New messages & direct replies", state: notifNewMessages, setter: setNotifNewMessages },
                  { label: "Mentions (@me) in discussions", state: notifMentions, setter: setNotifMentions },
                  { label: "Task assignment & status updates", state: notifTaskAssignment, setter: setNotifTaskAssignment },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#242628] border border-[var(--line)] flex items-center justify-between"
                  >
                    <span className="text-gray-200 font-medium text-xs">{item.label}</span>
                    <button
                      type="button"
                      onClick={() => item.setter(!item.state)}
                      style={{
                        backgroundColor: item.state ? "#98E499" : "#35383a",
                        color: item.state ? "#26282a" : "#9ca3af",
                      }}
                      className="px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer"
                    >
                      {item.state ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* CATEGORY 5: WORKSPACE */}
            {activeCategory === "Workspace" && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">Workspace Name</label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--line)] bg-[#242628] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#98E499]"
                  />
                </div>
              </div>
            )}

            {/* CATEGORY 6: DATA */}
            {activeCategory === "Data" && (
              <div className="p-4 rounded-xl bg-[#242628] border border-[var(--line)] space-y-2 text-xs">
                <strong className="block text-xs text-white font-semibold">Export Account Data</strong>
                <p className="text-[11px] text-gray-400">Download a JSON copy of your profile & workspace data.</p>
              </div>
            )}

            {/* CATEGORY 7: HELP */}
            {activeCategory === "Help" && (
              <div className="p-4 rounded-xl bg-[#242628] border border-[var(--line)] flex items-center justify-between text-xs">
                <div>
                  <strong className="block text-xs text-white font-semibold">Application Version</strong>
                  <span className="text-[10px] text-gray-400">Orbit SaaS Client Build</span>
                </div>
                <span className="text-xs font-mono text-[#98E499] bg-[#1e2022] px-2.5 py-1 rounded-lg">
                  v1.4.2-orbit
                </span>
              </div>
            )}
          </main>
        </div>

        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#282a2d] text-white border border-[#98E499]/40 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs">
            <span className="text-[#98E499]">
              <Icon name="check" size={14} />
            </span>
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}