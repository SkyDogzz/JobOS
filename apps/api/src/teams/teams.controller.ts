import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { TeamsService } from "./teams.service.js";

@Controller("teams")
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Get("workspaces")
  workspaces() {
    return this.teams.listWorkspaces();
  }

  @Post("workspaces")
  createWorkspace(@Body() body: unknown) {
    return this.teams.createWorkspace(body);
  }

  @Patch("workspaces/:id/settings")
  updateSettings(@Param("id") id: string, @Body() body: unknown) {
    return this.teams.updateSettings(id, body);
  }

  @Post("workspaces/:id/members")
  addMember(@Param("id") id: string, @Body() body: unknown) {
    return this.teams.addMember(id, body);
  }

  @Get("workspaces/:id/jobs")
  workspaceJobs(@Param("id") id: string) {
    return this.teams.listWorkspaceJobs(id);
  }
}
