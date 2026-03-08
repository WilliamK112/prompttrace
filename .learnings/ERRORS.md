# Errors Log

Capture command failures, exceptions, and integration issues.

---

## [ERR-20260307-001] openclaw gateway restart

**Logged**: 2026-03-07T21:07:00Z
**Priority**: medium
**Status**: pending
**Area**: infra

### Summary
`openclaw gateway restart` failed because the launchctl service isn't installed or running in this environment.

### Error
```
Gateway service not loaded.
Start with: openclaw gateway install
Start with: openclaw gateway
Start with: launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

### Context
Attempted to restart the gateway after enabling the self-improvement skill in config. Command was run from the workspace shell on macOS.

### Suggested Fix
Install or start the gateway daemon first (`openclaw gateway install` or `openclaw gateway start`) before issuing restart, or use the appropriate command for the current runtime setup.

### Metadata
- Reproducible: yes
- Related Files: ~/.openclaw/openclaw.json
- See Also: LRN-20250307-001

---
