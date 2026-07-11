import { describe, expect, it } from "vitest";
import type { JobBoard } from "../../../../shared/job";
import { TEST_TEMPLATE } from "../../engine/__tests__/fixtures";
import type { EngineConfigService } from "../EngineConfigService";
import type { FirebaseService } from "../FirebaseService";
import { JobBoardService } from "../JobBoardService";
import type { MissionTemplateService } from "../MissionTemplateService";

describe("JobBoardService", () => {
  it("rejects offer metadata from an older board format", () => {
    const service = new JobBoardService(
      { firestore: {} } as FirebaseService,
      { all: () => [TEST_TEMPLATE] } as MissionTemplateService,
      {} as EngineConfigService,
    );
    const board: JobBoard = {
      generatedAt: "2026-07-11T00:00:00.000Z",
      offers: [],
      templatesKey: `v4:${TEST_TEMPLATE.id}`,
    };

    expect(service.isCurrent(board)).toBe(true);
    expect(
      service.isCurrent({ ...board, templatesKey: `v3:${TEST_TEMPLATE.id}` }),
    ).toBe(false);
  });
});
