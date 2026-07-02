# BFI GitHub organization plan

BFI should be organized around three verticals:

1. **BFI AI Finance**
2. **BFI T1D**
3. **BR3N Creative**

Every repo should have one vertical owner. Avoid creating separate repos that do not map to one of these verticals.

## Simple target layout

```text
brendanbowers1-bit/
  bfi-ai-finance
  bfi-t1d
  br3n-creative
```

This is the cleanest long-term structure.

## Transitional layout

If existing work needs separate repos during migration:

```text
BFI AI Finance
  bfi-ai-finance              # primary vertical repo
  bfi-finance-lab             # governed finance research phases
  bfi-ai-lab                  # AI experiments if kept separate
  bowers-frontier-institute   # public website until moved or intentionally retained

BFI T1D
  bfi-t1d                     # primary vertical repo
  bfi-t1d-lab                 # legacy/specialized T1D work if retained

BR3N Creative
  br3n-creative               # primary creative vertical repo
```

## Repo naming rules

- Use lowercase kebab-case.
- Prefer one primary repo per vertical.
- Add additional repos only when there is a real boundary:
  - different deployment lifecycle
  - governed research history
  - distinct product/runtime
  - private data boundary

## Data rule

Repos hold code and governance history. Heavy data lives under:

```text
/Volumes/BFI/DATA/<vertical-id>/
```

Cloud object storage can mirror selected non-private folders later.

## Suggested migration order

1. Create or confirm the three primary repos:
   - `bfi-ai-finance`
   - `bfi-t1d`
   - `br3n-creative`
2. Put every active project under one of those verticals.
3. Move or archive old standalone lab repos only after their phase history is preserved.
4. Keep the website repo under BFI AI Finance unless you decide it should become a neutral institute repo later.
