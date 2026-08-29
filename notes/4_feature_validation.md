# how to validate the fature

Focus on high level stuff: like if the spec was well implemented


## correct errors. 
Ask for spec to be updated first


## validation.md

Some checks will also require manual verification in .md. Check boxes with agent after verifing

```md
## Responsive (manual)

- [ ] Home page and at least one stub route checked at ~375px, ~768px, ~1280px: no horizontal scroll, content reflows, nothing clipped.
- [ ] Interactive targets are ≥44px; no hover-only affordances in the shell.
- [x] Layout changes are additive at wider widths (`min-width` / `theme.breakpoints.up`) — no `max-width`/"down" overrides in the base layout. _(Shell uses only `{ xs, sm }` responsive props and `sm:` Tailwind variants; `max-width` appears only as the `html,body` overflow guard.)_
```
