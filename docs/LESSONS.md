# Lessons

One line per mistake. Read the entries for an area before working in it. When a mistake repeats, bump its count; at ×2 it also becomes a rule (in DECISIONS, AGENTS.md, or proposed to AI-Master-Instructions). Mark retired entries SUPERSEDED; never delete them.

Format: `- <area> · <mistake> · <root cause> · <rule> · ×<n> (<YYYY-MM-DD>)`

- docs · the charter stated guesses about adventure-manager, Story-Generator and Project-Vulcan as facts, and one claim (earlier projects had no playable loop) was false · written from chat memory before the repos were read · read a named repo's README, HANDOFF and DECISIONS headings before describing it; label anything unread as a guess · ×1 (2026-11-09)
- ci · the first CI run failed at `npm ci` with EBADENGINE (Node 24.19.0 came with npm 11.17.0, the repo pins 11.9.0 with engine-strict) · the master's `ci.yml` template has no npm pin step and the spec copied it; local checks ran through `npm exec --package=npm@11.9.0`, so they could not see it · a workflow that pins npm installs that npm before `npm ci`, as Project-Vulcan's does; propose the step for the master template · ×1 (2026-11-09)
