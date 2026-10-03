# AgenticBots skills

Proprietary operating playbooks, one folder per skill, deployed to Bot
profiles by `lifecycle.sh deploy-bot`. `src/config/skills.ts` is the manifest
(name, version, which Bot types may receive each skill); a unit test fails if
the two drift. Bump `version` in BOTH places when a playbook changes — the
operator console then shows which Bots run an older version.

Clients never see this library.
