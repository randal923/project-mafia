import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { EngineConfig, engineConfigSchema } from "../../../shared/engineConfig";

/**
 * Loads the global engine constants from server/missions/_engine.yml at
 * boot. An invalid file fails startup with the exact validation issues.
 */
export class EngineConfigService {
  readonly config: EngineConfig;

  constructor(
    filePath: string = join(process.cwd(), "missions", "_engine.yml"),
  ) {
    const parsed = engineConfigSchema.safeParse(
      parse(readFileSync(filePath, "utf-8")),
    );

    if (!parsed.success) {
      throw new Error(
        `Invalid engine config ${filePath}: ${JSON.stringify(parsed.error.issues)}`,
      );
    }

    this.config = parsed.data;
  }
}
