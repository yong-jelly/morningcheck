export interface User {
  id: string;
  name: string;
  email?: string;
  profileImageUrl?: string;
  bio?: string;
}

export interface CheckIn {
  id: string;
  userId: string;
  date: string; // yyyy-MM-dd
  condition: number; // 1-10
  note: string;
  createdAt: string;
}

export interface ProjectInvitation {
  id: string;
  email: string;
  status: "pending" | "accepted" | "rejected";
  invitedAt: string;
  acceptedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  iconType?: "emoji" | "image";
  inviteCode: string;
  members: User[];
  checkIns: CheckIn[];
  invitations?: ProjectInvitation[];
  createdBy: string;
  createdAt: string;
}
