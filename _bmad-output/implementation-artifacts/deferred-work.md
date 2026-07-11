# Deferred Work

- source_spec: `_bmad-output/implementation-artifacts/spec-equipment-driven-mission-balance.md`
  summary: Add a client component-test harness for interactive MissionRunner rendering and actions.
  evidence: The existing client test command only runs plain Node TypeScript tests and cannot render TSX; this change adds and successfully builds Storybook states, while mission mechanics and every path are executable server tests.
- source_spec: `_bmad-output/implementation-artifacts/spec-equipment-driven-mission-balance.md`
  summary: Repair the two pre-existing full-client ESLint violations outside the mission feature.
  evidence: `yarn lint` reports only `GameClock.tsx:21` (`react-hooks/set-state-in-effect`) and `PrisonPanel.tsx:65` (`react/no-unescaped-entities`); neither file differs from the baseline commit.
- source_spec: `_bmad-output/implementation-artifacts/spec-mission-gear-paths-and-power-clarity.md`
  summary: Define fair selection semantics when multiple mission gear requirements independently succeed on the same edge.
  evidence: The pre-existing first-success loop makes later overlapping requirements conditional on earlier failures, so their effective extra-occurrence rate is lower than the authored chance even though every requirement now has a guaranteed edge.
- source_spec: `_bmad-output/implementation-artifacts/spec-mission-gear-paths-and-power-clarity.md`
  summary: Remove or enforce the redundant SkeletonBuilder depth input so it cannot diverge from the mission template depth.
  evidence: The pre-existing builder contract accepts both `input.depth` and `template.depth`; production passes equal values, but a divergent caller can still build a tree whose runtime capacity differs from template validation.
