---
name: CountyPlan duplicate render
description: App.jsx had CountyPlan rendered twice under the same tab condition.
---

## Rule
App.jsx must render CountyPlan exactly once — with all props: `rows, selectedCounty, setSelectedCounty, competitorProviderType, setCompetitorProviderType, mapLayer, setMapLayer`.

## Why
Lines 301-302 of App.jsx duplicated the CountyPlan render. The first call was missing `competitorProviderType`/`setCompetitorProviderType`. This caused two instances to mount, doubling computation and sending stale props to one.

## How to apply
Fixed by merging into a single line with the full prop set.
