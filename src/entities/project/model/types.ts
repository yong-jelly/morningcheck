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

export interface Project {
  id: string;
  name: string;
  inviteCode: string;
  members: User[];
  checkIns: CheckIn[];
  createdBy: string;
  createdAt: string;
}
