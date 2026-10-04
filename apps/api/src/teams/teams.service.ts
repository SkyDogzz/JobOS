import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { requireCurrentUserId } from "../common/current-user.js";
import { TeamsRepository } from "./teams.repository.js";

type Role = "owner" | "admin" | "editor" | "viewer";
type Permission = "view" | "edit" | "export" | "delete";

const rolePermissions: Record<Role, Permission[]> = {
  owner: ["view", "edit", "export", "delete"],
  admin: ["view", "edit", "export", "delete"],
  editor: ["view", "edit"],
  viewer: ["view"]
};

@Injectable()
export class TeamsService {
  constructor(private readonly teams: TeamsRepository) {}

  async listWorkspaces() {
    const userId = requireCurrentUserId();
    const memberships = await this.teams.listMemberships(userId);
    if (!memberships.some((row) => row.organization.kind === "personal")) {
      const personal = await this.teams.createOrganization({
        ownerUserId: userId,
        name: "Personal workspace",
        slug: `personal-${userId.replaceAll("-", "")}`,
        kind: "personal",
        settings: { defaultWorkspace: true }
      });
      memberships.push({ organization: personal, membership: { id: "", organizationId: personal.id, userId, role: "owner", status: "active", invitedEmail: null, createdAt: new Date(), updatedAt: new Date() } });
    }
    return memberships.map((row) => serializeWorkspace(row));
  }

  async createWorkspace(body: unknown) {
    const userId = requireCurrentUserId();
    const input = parseWorkspace(body);
    const organization = await this.teams.createOrganization({
      ownerUserId: userId,
      name: input.name,
      slug: `${slugify(input.name)}-${Date.now().toString(36)}`,
      kind: "team",
      settings: input.settings
    });
    return { organization, role: "owner", permissions: rolePermissions.owner };
  }

  async updateSettings(id: string, body: unknown) {
    await this.assertPermission(id, "edit");
    const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const organization = await this.teams.updateSettings(id, {
      defaultVisibility: typeof input.defaultVisibility === "string" ? input.defaultVisibility : "private",
      exportPolicy: typeof input.exportPolicy === "string" ? input.exportPolicy : "owners_admins",
      requireApprovalForDelete: input.requireApprovalForDelete !== false
    });
    if (!organization) throw new NotFoundException("Workspace not found.");
    return organization;
  }

  async addMember(id: string, body: unknown) {
    await this.assertPermission(id, "delete");
    const input = parseMember(body);
    const membership = await this.teams.addMembership({ organizationId: id, ...input });
    if (!membership) throw new NotFoundException("User not found.");
    return membership;
  }

  async listWorkspaceJobs(id: string) {
    await this.assertPermission(id, "view");
    return this.teams.listWorkspaceJobs(id);
  }

  async assertPermission(organizationId: string, permission: Permission) {
    const userId = requireCurrentUserId();
    const membership = await this.teams.findMembership(organizationId, userId);
    if (!membership) throw new ForbiddenException("Workspace access denied.");
    const role = membership.role as Role;
    if (!rolePermissions[role]?.includes(permission)) throw new ForbiddenException(`Workspace ${permission} permission required.`);
    return { membership, permissions: rolePermissions[role] };
  }
}

function serializeWorkspace(row: Awaited<ReturnType<TeamsRepository["listMemberships"]>>[number]) {
  const role = row.membership.role as Role;
  return { ...row.organization, role, permissions: rolePermissions[role] };
}

function parseWorkspace(body: unknown) {
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const name = typeof input.name === "string" && input.name.trim() ? input.name.trim() : "Job Search Team";
  const settings = input.settings && typeof input.settings === "object" ? input.settings as Record<string, unknown> : {};
  return { name, settings };
}

function parseMember(body: unknown) {
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!email.includes("@")) throw new ForbiddenException("A valid member email is required.");
  const role = ["admin", "editor", "viewer"].includes(String(input.role)) ? input.role as "admin" | "editor" | "viewer" : "viewer";
  return { email, role };
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "team";
}
