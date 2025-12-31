import { CheckInForm } from "@/features/check-in/ui/CheckInForm";
import type { Project, User } from "@/entities/project/model/types";

interface ProjectCheckInTabProps {
  project: Project;
  currentUser: User;
  condition: number;
  setCondition: (v: number) => void;
  note: string;
  setNote: (v: string) => void;
  hasCheckedInToday: boolean;
}

export function ProjectCheckInTab({ 
  condition, 
  setCondition, 
  note, 
  setNote,
  hasCheckedInToday
}: ProjectCheckInTabProps) {
  if (hasCheckedInToday) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
          <span className="text-4xl">✨</span>
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">오늘의 체크인 완료!</h2>
          <p className="text-surface-500 dark:text-surface-400">팀원들의 상태를 확인해보세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CheckInForm 
        condition={condition} 
        setCondition={setCondition} 
        note={note} 
        setNote={setNote} 
      />
    </div>
  );
}
