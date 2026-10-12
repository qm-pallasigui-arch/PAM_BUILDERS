---
name: debug-invalid-array-length
description: "Skill to locate and fix invalid array length errors in React components. Concise, reproducible checklist."
scope: workspace
---

Goal
- Quickly identify and fix "Invalid array length" runtime errors caused by non-integer values passed to Array().

Checklist
1. Reproduce error and copy stack trace (browser console).  
2. Open the file and line from stack trace.  
3. Search for `Array(...)` or `...[Array(` patterns near that line.  
4. If the array length may be non-integer or undefined, replace with:  
   `Array.from({ length: Math.floor(Number(value) || 0) })`  
5. Save, verify Vite HMR reloads, and confirm the error is gone in browser console.  
6. Add a short entry to CHANGES.md with date, summary, and files changed.

Decision points
- If fractional stars are desired, implement partial-star rendering instead of flooring.  
- If value can be negative or huge, validate and clamp: `Math.max(0, Math.min(MAX, Math.floor(Number(value))))`.

Quality checks
- Dev server HMR logs file update.  
- Browser console no longer shows RangeError.  
- CHANGES.md updated with an entry describing the fix.

Example prompts
- "Apply this skill to fix an 'Invalid array length' error in Home.tsx."  
- "Create a variant that renders half-stars for fractional ratings."

Notes
- Save SKILL.md under `guidelines/SKILL.md` so teammates can reuse it.
