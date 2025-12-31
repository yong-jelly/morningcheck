import { TeamCheckInList } from "@/widgets/TeamCheckInList";
import type { Project } from "@/entities/project/model/types";

interface ProjectTeamTabProps {
  project: Project;
  activeTab: "check-in" | "team" | "history";
  onTabChange: (tab: "check-in" | "team" | "history") => void;
  onSettingsOpen: () => void;
  hasCheckedInToday: boolean;
}

export function ProjectTeamTab({ 
  project, 
  activeTab, 
  onTabChange, 
  onSettingsOpen,
  hasCheckedInToday
}: ProjectTeamTabProps) {
  return (
    <div className="space-y-6">
      <TeamCheckInList 
        project={project} 
        activeTab={activeTab}
        onTabChange={onTabChange}
        onSettingsOpen={onSettingsOpen}
        hasCheckedInToday={hasCheckedInToday}
      />
    </div>
  );
}
