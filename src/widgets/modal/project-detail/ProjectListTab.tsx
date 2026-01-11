import { TeamCheckInList } from "@/widgets/TeamCheckInList";
import type { Project } from "@/entities/project/model/types";

interface ProjectListTabProps {
  project: Project;
  activeTab: "check-in" | "list" | "stats" | "dashboard";
  onTabChange: (tab: "check-in" | "list" | "stats" | "dashboard") => void;
  hasCheckedInToday: boolean;
  selectedDate?: string;
  onInviteClick?: () => void;
  onSettingsClick?: () => void;
}

export function ProjectListTab({ 
  project, 
  activeTab, 
  onTabChange, 
  hasCheckedInToday,
  selectedDate,
  onInviteClick,
  onSettingsClick
}: ProjectListTabProps) {
  return (
    <div className="space-y-6">
      <TeamCheckInList 
        project={project} 
        activeTab={activeTab}
        onTabChange={onTabChange}
        hasCheckedInToday={hasCheckedInToday}
        selectedDate={selectedDate}
        onInviteClick={onInviteClick}
        onSettingsClick={onSettingsClick}
      />
    </div>
  );
}
