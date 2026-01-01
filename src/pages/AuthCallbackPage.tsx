import { useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/shared/lib/supabase";
import { useAppStore } from "@/shared/lib/store";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth error:", error.message);
        navigate("/onboarding");
        return;
      }

      if (session?.user) {
        // 1. 기존 프로필이 있는지 확인
        const { data: existingProfile, error: fetchError } = await supabase
          .from("tbl_users")
          .select("*")
          .eq("auth_id", session.user.id)
          .maybeSingle();

        if (fetchError) {
          console.error("Profile fetch error:", fetchError.message);
        }

        let userProfile;

        if (!existingProfile) {
          // 프로필이 없는 경우에만 초기 생성
          userProfile = {
            auth_id: session.user.id,
            email: session.user.email,
            display_name: session.user.user_metadata.full_name || session.user.email?.split("@")[0] || "Unknown",
            avatar_url: session.user.user_metadata.avatar_url || "",
          };

          const { error: upsertError } = await supabase
            .from("tbl_users")
            .upsert(userProfile, { onConflict: "auth_id" });

          if (upsertError) {
            console.error("Profile sync error:", upsertError.message);
          }
        } else {
          // 기존 프로필이 있으면 해당 정보를 사용
          userProfile = existingProfile;
        }

        const user = {
          id: session.user.id,
          name: userProfile.display_name,
          email: userProfile.email || "",
          profileImageUrl: userProfile.avatar_url,
          bio: userProfile.bio || ""
        };
        
        login(user);
        navigate("/projects");
      } else {
        navigate("/onboarding");
      }
    };

    handleAuthCallback();
  }, [navigate, login]);

  return (
    <div className="flex items-center justify-center h-full bg-white dark:bg-surface-900">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-surface-500">인증 처리 중...</p>
      </div>
    </div>
  );
}
