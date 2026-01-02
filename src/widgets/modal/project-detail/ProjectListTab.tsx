import { TeamCheckInList } from "@/widgets/TeamCheckInList";
import type { Project } from "@/entities/project/model/types";

interface ProjectListTabProps {
  project: Project;
  activeTab: "check-in" | "list" | "dashboard";
  onTabChange: (tab: "check-in" | "list" | "dashboard") => void;
  hasCheckedInToday: boolean;
}

export function ProjectListTab({ 
  project, 
  activeTab, 
  onTabChange, 
  hasCheckedInToday
}: ProjectListTabProps) {
  return (
    <div className="space-y-6">
      <TeamCheckInList 
        project={project} 
        activeTab={activeTab}
        onTabChange={onTabChange}
        hasCheckedInToday={hasCheckedInToday}
      />
    </div>
  );
}
