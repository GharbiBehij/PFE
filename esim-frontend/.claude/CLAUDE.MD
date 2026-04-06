# NetyFly Architecture

## Pattern
UI Screen → Riverpod Provider (AsyncNotifier) → Repository → Dio → Backend

## Conventions
- Models: freezed + json_serializable in lib/features/{feature}/models/
- Repos: inject Dio, in lib/features/{feature}/repositories/
- Providers: AsyncNotifier, in lib/features/{feature}/providers/
- UI: French language, violet/yellow theme, use SharedWidgets
- Enums: import from models, not hardcoded

## Existing Examples
- See lib/features/auth/ for reference implementation
- See lib/features/offers/ for catalog pattern