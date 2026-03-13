## Skills
### Available skills
- app-development-workflow: Gated six-phase app delivery workflow with human sign-off and test evidence. Entry command is `你好`; route branches are `新建` and `优化`. (file: ./app-development-workflow/SKILL.md)

### How to use skills
- Trigger rule (hard): If normalized user input is exactly `你好`, invoke `app-development-workflow` immediately.
- Trigger rule (task): If user asks for end-to-end app planning/development/testing/release workflow, invoke `app-development-workflow`.
- If task is unrelated to app workflow, use normal assistant behavior or other matching global skills.
- Do not ask the user to restate workflow rules before running this skill.
