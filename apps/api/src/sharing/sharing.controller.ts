import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { SharingService } from "./sharing.service.js";

@Controller()
export class SharingController {
  constructor(private readonly sharing: SharingService) {}

  @Get("applications/:applicationId/share-packets")
  listForApplication(@Param("applicationId") applicationId: string) {
    return this.sharing.listForApplication(applicationId);
  }

  @Post("applications/:applicationId/share-packets")
  createPacket(@Param("applicationId") applicationId: string, @Body() body: unknown) {
    return this.sharing.createPacket(applicationId, body);
  }

  @Post("applications/share-packets/:packetId/revoke")
  revokePacket(@Param("packetId") packetId: string) {
    return this.sharing.revokePacket(packetId);
  }

  @Get("shares/:token")
  viewSharedPacket(@Param("token") token: string) {
    return this.sharing.viewSharedPacket(token);
  }

  @Post("shares/:token/comments")
  createPublicComment(@Param("token") token: string, @Body() body: unknown) {
    return this.sharing.createPublicComment(token, body);
  }
}
