---
name: estimate-production
description: Estimate production time, material, and an example business quote for a staged STL using the approved Cura profile.
---

# Estimate STL production

When a user asks for a Cura estimate or quote for a staged STL:

1. Call `analyze_stl` with the filename only. Never pass an arbitrary path.
2. If analysis succeeds, call `slice_stl` with the same filename, the returned
   `analysis_id`, the approved `cura-ultimaker2plus-generic-pla-normal` profile, and the
   requested quantity (default to one when unspecified).
3. Report mesh dimensions separately from Cura time and filament metrics.
   Cura reports seconds and filament volume; grams are
   derived using the configured PLA density shown by the tool.
4. Label material, time, cost, price, and gross contribution as estimates.
   State the business configuration used and that the existing example values
   must be replaced with this farm's settings before quoting customers.
5. Mention Cura warnings or errors returned by the tool. Do not present the
   estimate as validated printer-ready G-code or a hardware-tested profile.
6. If the slice or quote fails, explain the returned error and do not invent
   missing metrics or prices.
