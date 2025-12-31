import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { ArrowLeft, Camera, Check, LogOut, User as UserIcon } from "lucide-react";
import { useAppStore } from "@/shared/lib/store";
import { cn } from "@/shared/lib/cn";

export function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, updateProfile, logout } = useAppStore();
  
  const [name, setName] = useState(currentUser?.name || "");
  const [bio, setBio] = useState(currentUser?.bio || "");
  const [profileImageUrl, setProfileImageUrl] = useState(currentUser?.profileImageUrl || "");
  const [isSaving, setIsSaving] = useState(false);

  if (!currentUser) {
    navigate("/onboarding");
    return null;
  }

  const handleRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
    setProfileImageUrl(newAvatar);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 800));
    updateProfile({ name, bio, profileImageUrl });
    setIsSaving(false);
    // 저장 후 랜딩 페이지(시작 페이지)로 이동
    navigate("/");
  };

  const handleLogout = () => {
    logout();
    navigate("/onboarding");
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface-900">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between border-b border-surface-200 dark:border-surface-800 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/")}
            className="p-1.5 -ml-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md transition-colors text-surface-400"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-bold">Settings</h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg active:scale-95 disabled:opacity-50 transition-all"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-10">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-5">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 overflow-hidden flex items-center justify-center">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-8 h-8 text-surface-300" />
              )}
            </div>
            <button 
              onClick={handleRandomAvatar}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg flex items-center justify-center text-surface-500 hover:text-primary-600 shadow-minimal active:scale-90 transition-all"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest leading-none">{currentUser.email || "No Email"}</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest ml-1">Display Name</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full h-12 px-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 focus:border-primary-500 focus:ring-0 transition-all text-sm font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-surface-400 uppercase tracking-widest ml-1">Bio</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              className="w-full h-28 p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 focus:border-primary-500 focus:ring-0 transition-all text-sm font-medium resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-6 border-t border-surface-100 dark:border-surface-800">
          <button 
            onClick={handleLogout}
            className="w-full h-12 flex items-center justify-center gap-2 text-red-500 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
