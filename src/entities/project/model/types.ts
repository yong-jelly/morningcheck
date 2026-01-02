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

export interface ProjectJoinRequest {
  id: string;
  projectId: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  inviterId: string;
  email: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  invitedAt: string;
  respondedAt?: string;
}

export interface ProjectInvitationHistory {
  id: string;
  projectId: string;
  invitationId?: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  inviteeEmail: string;
  action: "invited" | "cancelled" | "accepted" | "rejected" | "requested" | "approved";
  metadata?: any;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  iconType?: "emoji" | "image";
  inviteCode: string;
  visibilityType: "public" | "request" | "invite";
  members: User[];
  checkIns: CheckIn[];
  invitations?: ProjectInvitation[];
  joinRequests?: ProjectJoinRequest[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  archivedAt?: string | null;
  stats?: {
    memberCount: number;
    checkInCount: number;
    avgCondition: number;
    participationRate: number;
    memberCountChange?: number; // 전일 대비 멤버 수 변화
  } | null;
  lastCheckIn?: {
    userDisplayName: string;
    userAvatarUrl?: string;
    checkInTime: string;
  } | null;
}
