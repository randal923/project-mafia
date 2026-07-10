import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import {
  MissionTemplate,
  missionTemplateSchema,
} from "../../../shared/missionTemplate";

/**
 * Loads every mission template from the server/missions folder at boot.
 * Drop a new .yml file in that folder to add a mission — no code changes.
 * Invalid or duplicate files fail startup with a clear error.
 */
export class MissionTemplateService {
  private readonly templates = new Map<string, MissionTemplate>();

  constructor(directory: string = join(process.cwd(), "missions")) {
    // Underscore-prefixed files (e.g. _engine.yml) are not mission templates.
    const files = readdirSync(directory).filter(
      (file) =>
        (file.endsWith(".yml") || file.endsWith(".yaml")) &&
        !file.startsWith("_"),
    );

    for (const file of files) {
      const parsed = missionTemplateSchema.safeParse(
        parse(readFileSync(join(directory, file), "utf-8")),
      );

      if (!parsed.success) {
        throw new Error(
          `Invalid mission template ${file}: ${JSON.stringify(parsed.error.issues)}`,
        );
      }
      if (this.templates.has(parsed.data.id)) {
        throw new Error(`Duplicate mission template id: ${parsed.data.id}`);
      }

      this.templates.set(parsed.data.id, parsed.data);
    }

    if (this.templates.size === 0) {
      throw new Error(`No mission templates found in ${directory}`);
    }
  }

  all(): MissionTemplate[] {
    return [...this.templates.values()];
  }

  find(id: string): MissionTemplate | null {
    return this.templates.get(id) ?? null;
  }

  /** Fallback for missions created before templates carried an id. */
  first(): MissionTemplate {
    return this.all()[0]!;
  }
}
