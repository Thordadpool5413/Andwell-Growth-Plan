---
name: MaineMap providerProviderType bug
description: MaineMap.jsx had a reference to an undefined function that crashed CountyPlan on every render.
---

## Rule
In `MaineMap.jsx`, provider type filtering must use `providerTypeFilter` directly — never call it as a function.

## Why
Line 150 originally called `providerProviderType(providerTypeFilter)` which is not defined anywhere. This caused a `ReferenceError` every time CountyPlan mounted, crashing the whole tab. The variable `visibleProviders` is computed but not yet rendered in the JSX — but the ReferenceError still fires during the useMemo/computation phase.

## How to apply
Correct filter pattern:
```js
namedProviderRows.filter((provider) => {
  if (!providerTypeFilter || providerTypeFilter === "all") return true;
  return providerTypeFilter === provider.service;
});
```
