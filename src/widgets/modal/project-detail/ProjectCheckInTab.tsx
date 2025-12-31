import { CheckInForm } from "@/features/check-in/ui/CheckInForm";
import type { Project, User } from "@/entities/project/model/types";

interface ProjectCheckInTabProps {
  project: Project;
  currentUser: User;
  condition: number;
  setCondition: (v: number) => void;
  note: string;
  setNote: (v: string) => void;
}

export function ProjectCheckInTab({ 
  condition, 
  setCondition, 
  note, 
  setNote
}: ProjectCheckInTabProps) {
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
