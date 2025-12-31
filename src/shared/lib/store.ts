import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Project, CheckIn } from "@/entities/project/model/types";

interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
  projects: Project[];
  currentProjectId: string | null;
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  updateProfile: (profile: Partial<User>) => void;
  setCurrentUser: (user: User | null) => void;
  addProject: (project: Project) => void;
  setCurrentProjectId: (id: string | null) => void;
  addCheckIn: (projectId: string, checkIn: CheckIn) => void;
  removeCheckIn: (projectId: string, checkInId: string) => void;
  joinProject: (inviteCode: string, user: User) => boolean;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  inviteMember: (projectId: string, email: string) => void;
  acceptInvitation: (projectId: string, user: User) => void;
  removeInvitation: (projectId: string, invitationId: string) => void;
  removeMember: (projectId: string, userId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      projects: [],
      currentProjectId: null,

      login: (user) => set({ currentUser: user, isAuthenticated: true }),
      logout: () => set({ currentUser: null, isAuthenticated: false, currentProjectId: null }),
      
      updateProfile: (profile) => set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, ...profile } : null
      })),

      setCurrentUser: (user) => set({ currentUser: user }),
      
      addProject: (project) => set((state) => ({ 
        projects: [...state.projects, project],
        currentProjectId: project.id 
      })),

      setCurrentProjectId: (id) => set({ currentProjectId: id }),

      addCheckIn: (projectId, checkIn) => set((state) => ({
        projects: state.projects.map((p) => 
          p.id === projectId 
            ? { ...p, checkIns: [...p.checkIns, checkIn] }
            : p
        )
      })),

      removeCheckIn: (projectId, checkInId) => set((state) => ({
        projects: state.projects.map((p) => 
          p.id === projectId 
            ? { ...p, checkIns: p.checkIns.filter((c) => c.id !== checkInId) }
            : p
        )
      })),

      joinProject: (inviteCode, user) => {
        const { projects } = get();
        const project = projects.find((p) => p.inviteCode === inviteCode);
        
        if (project) {
          // 중복 체크
          const isAlreadyMember = project.members.some((m) => m.id === user.id);
          if (!isAlreadyMember) {
            set((state) => ({
              projects: state.projects.map((p) => 
                p.inviteCode === inviteCode 
                  ? { ...p, members: [...p.members, user] }
                  : p
              ),
              currentProjectId: project.id
            }));
          } else {
            set({ currentProjectId: project.id });
          }
          return true;
        }
        return false;
      },

      updateProject: (projectId, updates) => set((state) => ({
        projects: state.projects.map((p) => 
          p.id === projectId ? { ...p, ...updates } : p
        )
      })),

      inviteMember: (projectId, email) => set((state) => ({
        projects: state.projects.map((p) => 
          p.id === projectId 
            ? { 
                ...p, 
                invitations: [
                  ...(p.invitations || []), 
                  { 
                    id: crypto.randomUUID(), 
                    email, 
                    status: "pending", 
                    invitedAt: new Date().toISOString() 
                  }
                ] 
              } 
            : p
        )
      })),

      acceptInvitation: (projectId, user) => set((state) => ({
        projects: state.projects.map((p) => 
          p.id === projectId 
            ? { 
                ...p, 
                members: [...p.members, user],
                invitations: p.invitations?.map((i) => 
                  i.email === user.email ? { ...i, status: "accepted", acceptedAt: new Date().toISOString() } : i
                )
              } 
            : p
        )
      })),

      removeInvitation: (projectId, invitationId) => set((state) => ({
        projects: state.projects.map((p) => 
          p.id === projectId 
            ? { ...p, invitations: p.invitations?.filter((i) => i.id !== invitationId) }
            : p
        )
      })),

      removeMember: (projectId, userId) => set((state) => ({
        projects: state.projects.map((p) => 
          p.id === projectId 
            ? { ...p, members: p.members.filter((m) => m.id !== userId) }
            : p
        )
      }))
    }),
    {
      name: "morningcheck-storage",
    }
  )
);
