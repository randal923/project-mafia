export const API_ERROR_CODES = [
  "active_job_exists",
  "attack_cooldown",
  "building_damaged",
  "building_max_level",
  "building_not_damaged",
  "building_not_owned",
  "building_staff_limit",
  "candidate_unavailable",
  "conflict",
  "crew_cannot_fire_on_job",
  "crew_capacity",
  "crew_consumable_forbidden",
  "crew_gear_confiscated",
  "crew_limit",
  "crew_member_not_found",
  "crew_not_free_to_fight",
  "crew_not_free_for_job",
  "crew_not_free_to_guard",
  "crew_not_free_to_train",
  "crew_not_free_to_work",
  "crew_not_imprisoned",
  "crew_on_job",
  "crew_skill_max",
  "crew_skill_required",
  "duplicate_property",
  "family_exists",
  "family_name_taken",
  "family_protected",
  "family_required",
  "forbidden",
  "full_health",
  "heat_already_zero",
  "insufficient_cash",
  "insufficient_funds",
  "internal_error",
  "invalid_auth_token",
  "invalid_crew_equipment_slot",
  "invalid_mission_choice",
  "invalid_request",
  "item_not_equippable",
  "item_not_in_stash",
  "item_not_usable",
  "item_reserved",
  "job_board_changed",
  "job_offer_unavailable",
  "landmark_requires_attack",
  "level_required",
  "mission_gear_required",
  "mission_item_unavailable",
  "mission_not_found",
  "mission_resolved",
  "no_active_job",
  "not_imprisoned",
  "own_turf",
  "player_not_found",
  "player_exists",
  "player_imprisoned",
  "player_name_taken",
  "precinct_unavailable_in_prison",
  "prison_attempt_cooldown",
  "property_limit",
  "property_not_for_sale",
  "rate_limited",
  "rank_too_low",
  "recruitment_locked",
  "recruitment_pool_empty",
  "release_pending",
  "request_failed",
  "required_fields",
  "resource_not_found",
  "racket_not_available",
  "route_not_found",
  "slot_empty",
  "stamina_required",
  "still_generating",
  "store_item_not_found",
  "territory_locked",
  "territory_required",
  "takeover_required",
  "turf_claimed",
  "turf_full",
  "turf_not_adjacent",
  "turf_not_found",
  "turf_not_owned",
  "turf_shielded",
  "unauthenticated",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export type ApiErrorParametersByCode = {
  [Code in ApiErrorCode]: Code extends
        | "building_staff_limit"
        | "crew_capacity"
        | "crew_limit"
        | "property_limit"
    ? { count: number }
    : Code extends "crew_member_not_found"
      ? { id?: string }
      : Code extends
            | "crew_gear_confiscated"
            | "crew_not_free_to_fight"
            | "crew_not_free_for_job"
            | "crew_not_free_to_guard"
            | "crew_not_free_to_train"
            | "crew_not_free_to_work"
            | "crew_not_imprisoned"
            | "crew_on_job"
            | "crew_skill_max"
        ? { name: string }
        : Code extends "crew_skill_required"
          ? { name: string; required: number }
          : Code extends "insufficient_cash"
            ? { amount: number }
            : Code extends "level_required" | "stamina_required"
              ? { required: number }
              : Code extends "mission_gear_required" | "mission_item_unavailable"
                ? { item: string }
                : Code extends "required_fields"
                  ? { count: number }
    : undefined;
};

export type ApiErrorDescriptor = {
  [Code in ApiErrorCode]: ApiErrorParametersByCode[Code] extends undefined
    ? { code: Code; params?: never }
    : { code: Code; params: ApiErrorParametersByCode[Code] };
}[ApiErrorCode];

export type ApiErrorResponse = {
  code: ApiErrorCode;
  error: string;
};

export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return API_ERROR_CODES.includes(value as ApiErrorCode);
}
