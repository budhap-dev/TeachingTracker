# Contributing

Thank you for helping improve Teaching Tracker.

## How to contribute

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your changes locally.
5. Submit a pull request with a clear summary.

## Development workflow

### Frontend

```bash
npm install
npm run dev
```

## Coding guidelines

- Keep code simple and readable.
- Prefer TypeScript types over any.
- Follow the existing project structure.
- Update documentation when adding new features.
- Keep UI changes responsive and mobile-friendly.

## Privacy review step

If a change **adds, removes or repurposes personal data** — a new field on a
form, a new stored record, a new third-party service, a change to who can see
something or how long it is kept — update these in the *same* pull request:

- [docs/PRIVACY-ROPA.md](docs/PRIVACY-ROPA.md) — the processing record
- [docs/PRIVACY-RETENTION.md](docs/PRIVACY-RETENTION.md) — the retention schedule
- [src/components/PrivacyView.tsx](src/components/PrivacyView.tsx) — the public policy, if what it tells families has changed

Adding a new processor (analytics, email, backups, an AI service) means
updating the records **before** it ships: the policy currently tells families
there are none, and that has to stay true.

## Pull request expectations

Please include:

- a short description of the change
- any relevant screenshots if UI changed
- notes on testing performed

## Issues

If you find a bug or want to suggest an improvement, open an issue with enough detail to reproduce the problem.
