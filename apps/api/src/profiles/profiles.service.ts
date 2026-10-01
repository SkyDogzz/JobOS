import { Injectable } from "@nestjs/common";
import { upsertCandidateProfileSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { ProfilesRepository } from "./profiles.repository.js";

@Injectable()
export class ProfilesService {
  constructor(private readonly profiles: ProfilesRepository) {}

  getCurrent() {
    return this.profiles.getCurrent();
  }

  upsert(body: unknown) {
    return this.profiles.upsert(parseBody(upsertCandidateProfileSchema, body));
  }
}

