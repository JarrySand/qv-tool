# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Comprehensive JSDoc documentation for Server Actions and utility functions
- Type definitions for domain models (`src/types/`)
- Event wizard component modularization (`src/components/features/event-wizard/`)
- Constants file for application-wide configuration (`src/constants/index.ts`)
- SECURITY.md for vulnerability reporting guidelines
- Issue and PR templates for GitHub

### Changed

- Refactored `EventWizardForm` into smaller, maintainable components
- Improved code organization with re-export patterns

## [0.1.0] - 2024-11-28

### Added

- **Core Features**
  - Quadratic Voting (QV) event creation and management
  - Multiple authentication modes: Individual URL, Google, LINE, Discord
  - Real-time voting results with interactive charts
  - CSV export for results and raw vote data
  - Internationalization (i18n) support for Japanese and English

- **Event Management**
  - Step-by-step event creation wizard
  - Custom URL slugs for events
  - Configurable credits per voter
  - Event locking after publication
  - Admin dashboard with token management

- **Voting System**
  - QV cost calculation (votes² = credits)
  - Vote editing during voting period
  - Hidden preferences analysis (QV vs traditional voting comparison)
  - Vote distribution visualization

- **Authentication**
  - Individual URL tokens for anonymous voting
  - Google OAuth integration
  - LINE Login integration
  - Discord OAuth with guild gate support

- **UI/UX**
  - Responsive design with Tailwind CSS
  - Dark/Light theme support
  - Accessible components (WCAG 2.1 AA)
  - Real-time result updates

- **Developer Experience**
  - TypeScript strict mode
  - ESLint + Prettier configuration
  - Vitest unit tests
  - Playwright E2E tests
  - GitHub Actions CI/CD pipeline
  - Docker Compose for local development

### Security

- Rate limiting for event creation and voting
- Secure token generation with cryptographic randomness
- Admin token authentication for sensitive operations

---

## Guidelines for Changelog Entries

### Categories

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

### Commit Message to Changelog

When making commits, consider how they will appear in the changelog:

- `feat:` → Added
- `fix:` → Fixed
- `docs:` → Usually not included unless significant
- `refactor:` → Changed (if user-facing)
- `security:` → Security

[Unreleased]: https://github.com/username/qv-tool/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/username/qv-tool/releases/tag/v0.1.0
