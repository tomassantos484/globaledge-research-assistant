# globaledge-research-assistant

## Frontend regression checks

```sh
pnpm --filter @workspace/globaledge-brokerage run test:regression
```

Builds the production frontend and checks responsive layout, readable text,
local fonts, and reduced motion using isolated, explicitly labeled fixtures.
See [setup, coverage, and failure evidence](artifacts/globaledge-brokerage/tests/README.md).