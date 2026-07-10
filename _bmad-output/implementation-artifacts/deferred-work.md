# Deferred Work

- source_spec: `_bmad-output/implementation-artifacts/spec-equipment-driven-mission-balance.md`
  summary: Add a client component-test harness for interactive MissionRunner rendering and actions.
  evidence: The existing client test command only runs plain Node TypeScript tests and cannot render TSX; this change adds and successfully builds Storybook states, while mission mechanics and every path are executable server tests.
- source_spec: `_bmad-output/implementation-artifacts/spec-equipment-driven-mission-balance.md`
  summary: Repair the two pre-existing full-client ESLint violations outside the mission feature.
  evidence: `yarn lint` reports only `GameClock.tsx:21` (`react-hooks/set-state-in-effect`) and `PrisonPanel.tsx:65` (`react/no-unescaped-entities`); neither file differs from the baseline commit.
