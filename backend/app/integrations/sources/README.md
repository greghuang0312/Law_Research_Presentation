# Source Integrations

Task 4 implementation scope:
- `local-fixture-adapter.mjs` provides deterministic offline retrieval records
- `gov-source-adapter.mjs` handles approved `gov.cn` live retrieval only
- Live access must reuse Task 2 policy, rate-limit, retry, and access logging rules
