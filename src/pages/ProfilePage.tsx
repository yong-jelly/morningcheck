import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Camera, LogOut, User as UserIcon, Loader2 } from "lucide-react";
import { useAppStore } from "@/shared/lib/store";
import { supabase } from "@/shared/lib/supabase";
import { uploadProfileImage, getProfileImageUrl } from "@/shared/lib/storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { logout, updateProfile, isAuthenticated } = useAppStore();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // 1. 현재 인증된 사용자 가져오기
  const { data: authUser, isLoading: isAuthLoading, isFetched: isAuthFetched } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) return null;
      return user;
    },
    retry: false,
  });

  // 세션 유효성 검사: Supabase 세션이 없는데 스토어상 인증된 상태라면 초기화
  useEffect(() => {
    if (isAuthFetched && !isAuthLoading && !authUser && isAuthenticated) {
      console.warn("Invalid session detected. Clearing local data.");
      logout();
      navigate("/onboarding");
    }
  }, [authUser, isAuthLoading, isAuthFetched, isAuthenticated, logout, navigate]);

  // 2. 사용자 프로필 정보 가져오기
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["user-profile", authUser?.id],
    queryFn: async () => {
      if (!authUser) return null;
      const { data, error } = await supabase.rpc("v1_get_user_profile", {
        p_auth_id: authUser.id
      });
      
      if (error) {
        console.error("Profile fetch error:", error);
        throw error;
      }
      return data?.[0] || null;
    },
    enabled: !!authUser,
  });

  // 프로필 데이터 로드 시 상태 초기화
  useEffect(() => {
    if (profile) {
      setName(profile.display_name || "");
      setBio(profile.bio || "");
      setProfileImageUrl(profile.avatar_url || "");
    } else if (authUser) {
      // 프로필이 없는 경우 초기값 설정
      setName(authUser.user_metadata.full_name || "");
      setProfileImageUrl(authUser.user_metadata.avatar_url || "");
    }
  }, [profile, authUser]);

  // 이미지 URL 정규화 (Storage 경로를 URL로 변환)
  const resolvedProfileImageUrl = getProfileImageUrl(profileImageUrl, "lg");

  // 3. 프로필 수정 Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { display_name: string; bio: string; avatar_url: string }) => {
      if (!authUser) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc("v1_upsert_user_profile", {
        p_auth_id: authUser.id,
        p_email: authUser.email || "",
        p_display_name: updates.display_name,
        p_bio: updates.bio,
        p_avatar_url: updates.avatar_url,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-profile", authUser?.id] });
      
      // 전역 상태 업데이트
      updateProfile({
        name: data.display_name,
        profileImageUrl: data.avatar_url,
        bio: data.bio
      });

      toast.success("프로필이 저장되었습니다.");
      navigate("/");
    },
    onError: (error: any) => {
      toast.error(`저장 실패: ${error.message}`);
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate({
      display_name: name,
      bio,
      avatar_url: profileImageUrl,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate("/onboarding");
  };

  const handleRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
    setProfileImageUrl(newAvatar);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;

    setIsUploading(true);
    try {
      const { path, error } = await uploadProfileImage(file, authUser.id);
      if (error) throw error;

      setProfileImageUrl(path);
      toast.success("이미지가 업로드되었습니다.");
    } catch (error: any) {
      toast.error(`업로드 실패: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (isAuthLoading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-surface-900">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!authUser) {
    navigate("/onboarding");
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-surface-900 overflow-hidden">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between border-b border-surface-200 dark:border-surface-800 shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate("/")}
            className="w-10 h-10 flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 stroke-2" />
          </button>
          <h1 className="text-[17px] font-bold text-surface-900 dark:text-white">설정</h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={updateProfileMutation.isPending || !name.trim() || isUploading}
          className="px-5 h-9 bg-primary-600 text-white text-[14px] font-bold rounded-full active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {updateProfileMutation.isPending ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              저장 중...
            </>
          ) : "변경사항 저장"}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-10">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-5">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 overflow-hidden flex items-center justify-center">
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
              ) : resolvedProfileImageUrl ? (
                <img src={resolvedProfileImageUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-8 h-8 text-surface-300" />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg flex items-center justify-center text-surface-500 hover:text-primary-600 shadow-minimal active:scale-90 transition-all"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
          <button 
            onClick={handleRandomAvatar}
            className="text-[10px] font-bold text-primary-600 uppercase tracking-widest hover:underline"
          >
            랜덤 아바타
          </button>
          <div className="text-center">
            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-widest leading-none">{authUser.email || "이메일 없음"}</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-8">
          <div className="space-y-3">
            <label className="block text-[14px] font-bold text-surface-900 dark:text-white ml-1">표시 이름</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full h-14 px-4 rounded-2xl bg-surface-50 dark:bg-surface-900 border-none ring-1 ring-surface-200 dark:ring-surface-700 focus:ring-2 focus:ring-primary-500 transition-all text-[17px] font-bold"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-[14px] font-bold text-surface-900 dark:text-white ml-1">소개</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="자신을 소개해주세요"
              className="w-full min-h-[120px] p-4 rounded-2xl bg-surface-50 dark:bg-surface-900 border-none ring-1 ring-surface-200 dark:ring-surface-700 focus:ring-2 focus:ring-primary-500 transition-all text-[17px] font-bold resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-6 border-t border-surface-100 dark:border-surface-800">
          <button 
            onClick={handleLogout}
            className="w-full h-14 flex items-center justify-center gap-2 text-red-500 text-[14px] font-bold hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
