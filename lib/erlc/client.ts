import { mockActions, mockPlayers, mockRoles, mockServer } from "./mock-data";
import type { ErlcActionType } from "./types";

export class ErlcApiClient {
  constructor(private readonly apiKey?: string) {}

  async getServer() {
    // TODO: Replace with real PRC/ER:LC server endpoint when API credentials are connected.
    return mockServer;
  }

  async listPlayers() {
    // TODO: Replace with real player endpoint and normalize PRC response into ErlcPlayer.
    return mockPlayers;
  }

  async listModerationActions() {
    // TODO: Replace with database-backed audit log query.
    return mockActions;
  }

  async listStaffRoles() {
    // TODO: Replace with persistent role/permission storage.
    return mockRoles;
  }

  async runAction(input: { type: ErlcActionType; playerId?: string; reason?: string }) {
    // TODO: Call the real ER:LC command/API bridge here. Keep confirmation + permission checks before this call.
    return { ok: true, queued: true, input, usingMock: !this.apiKey };
  }
}

export const erlcClient = new ErlcApiClient(process.env.ERLC_API_KEY);
