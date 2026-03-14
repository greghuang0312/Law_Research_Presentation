# LegalOne-R1 Integration

Task 3 implementation scope:
- Load pinned model configuration from `backend/config/legalone-r1.config.json`
- Enforce source-tag validation: `authorized` / `manual` / `imported`
- Block generation when `docs/compliance/legalone-r1-license-review.json` is not approved
- Provide a dry-run adapter output so the pipeline can be tested before real model transport is wired in
