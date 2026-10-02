import { GoneException, Injectable, NotFoundException } from "@nestjs/common";
import { createReviewerCommentSchema, createSharePacketSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { SharingRepository } from "./sharing.repository.js";

@Injectable()
export class SharingService {
  constructor(private readonly sharing: SharingRepository) {}

  listForApplication(applicationId: string) {
    return this.sharing.listForApplication(applicationId);
  }

  async createPacket(applicationId: string, body: unknown) {
    const packet = await this.sharing.createPacket(applicationId, parseBody(createSharePacketSchema, body));
    if (!packet) throw new NotFoundException("Application not found.");
    return packet;
  }

  async revokePacket(packetId: string) {
    const packet = await this.sharing.revokePacket(packetId);
    if (!packet) throw new NotFoundException("Share packet not found.");
    return packet;
  }

  async viewSharedPacket(token: string) {
    const packet = await this.sharing.viewSharedPacket(token);
    if (packet === "expired") throw new GoneException("Share link expired or revoked.");
    if (!packet) throw new NotFoundException("Share link not found.");
    return packet;
  }

  async createPublicComment(token: string, body: unknown) {
    const comment = await this.sharing.createPublicComment(token, parseBody(createReviewerCommentSchema, body));
    if (comment === "expired") throw new GoneException("Share link expired or revoked.");
    if (!comment) throw new NotFoundException("Share link not found.");
    return comment;
  }
}
