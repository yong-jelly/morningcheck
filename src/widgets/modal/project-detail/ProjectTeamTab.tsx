import { TeamCheckInList } from "@/widgets/TeamCheckInList";
import type { Project } from "@/entities/project/model/types";

interface ProjectTeamTabProps {
  project: Project;
}

export function ProjectTeamTab({ project }: ProjectTeamTabProps) {
  return (
    <div className="space-y-6">
      <TeamCheckInList project={project} />
    </div>
  );
}
