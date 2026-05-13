# Code Research: Voice MD Plugin

**Branch**: `release-fixes` (ahead of `master` with Obsidian review fixes)
**Version**: 1.2.6
**Date**: 2026-05-13

---

## 1. Build & Compilation Issues

### 1.1 TypeScript Deprecation Warnings (BLOCKING)

`tsconfig.json` uses deprecated options that prevent production builds:

```
tsconfig.json(3,5): error TS5101: Option 'baseUrl' is deprecated (TS 7.0)
tsconfig.json(10,25): error TS5107: Option 'moduleResolution=node10' is deprecated (TS 7.0)
```

**Root cause**: TypeScript 6.x deprecates `baseUrl` and `moduleResolution: "node"` (node10).

**Fix**: Update `tsconfig.json`:
- Replace `"baseUrl": "."` — remove it (not needed, no path aliases in use)
- Replace `"moduleResolution": "node"` with `"moduleResolution": "bundler"`
- Replace `"module": "ESNext"` stays (correct for esbuild bundling)

### 1.2 ESLint Errors (5 errors, 0 warnings)

**File: `src/audio/recorder.ts:78,80`** — `preserve-caught-error` rule
```ts
// Line 78: re-throws without preserving original cause
throw new Error('PERMISSION_DENIED');
throw new Error('NO_MICROPHONE');
```
Fix: Pass original error as `cause`:
```ts
throw new Error('PERMISSION_DENIED', { cause: error });
throw new Error('NO_MICROPHONE', { cause: error });
```

**File: `src/commands/voice-command.ts:155`** — unsafe `moment()` usage
```ts
const timestamp = moment().format('YYYY-MM-DD-HHmmss');
```
The `moment` import from `obsidian` resolves as `any` type under strict type checking.
Fix: Use `Date` built-in or cast appropriately:
```ts
const now = new Date();
const timestamp = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
  '-',
  String(now.getHours()).padStart(2, '0'),
  String(now.getMinutes()).padStart(2, '0'),
  String(now.getSeconds()).padStart(2, '0')
].join('');
```

---

## 2. Architecture Analysis

### 2.1 Module Dependency Graph

```
main.ts
  ├── src/commands/voice-command.ts
  │     ├── src/audio/audio-modal.ts
  │     │     └── src/audio/recorder.ts
  │     ├── src/api/openai-client.ts
  │     │     └── src/utils/error-handler.ts
  │     └── src/utils/error-handler.ts
  └── src/types.ts
```

### 2.2 Coupling Observations

- **VoiceCommand** receives `Plugin` typed as generic `Plugin` — this is fine, it only uses it for `Plugin.saveData()` via the modal's post-processing checkbox persistence. Could be narrowed to a settings interface.
- **RecordingModal** directly mutates global settings (`this.settings.enablePostProcessing = ...`) and calls `this.plugin.saveData()`. This couples modal UI to persistence, which is a side-effect in the view layer. Not critical for a plugin of this size.
- **OpenAIClient** creates a new instance per recording (`new OpenAIClient(this.settings.openaiApiKey)` in `voice-command.ts:60`). This means each transcription creates a fresh HTTP client. Acceptable for infrequent use, but a single instance on the plugin would be cleaner.

### 2.3 Pattern Assessment

| Pattern | Status | Notes |
|---------|--------|-------|
| Single responsibility | Good | Each module has one clear job |
| DRY | Good | Error handling centralized in `ErrorHandler` |
| KISS | Good | No unnecessary abstractions |
| YAGNI | Mostly good | `testConnection()` and `createSilentAudioBlob()` in `openai-client.ts` are never called — dead code |
| Error handling | Good | Typed error hierarchy with `VoiceMDError` |

---

## 3. Dead Code

### 3.1 `OpenAIClient.testConnection()` — unused
`openai-client.ts:126-135` — `testConnection()` method and its helper `createSilentAudioBlob()` (lines 140-176) are never invoked anywhere in the codebase.

**Recommendation**: Remove both methods. If needed later, add back then (YAGNI).

### 3.2 `RecordingState.isPaused` — never set to true
`types.ts:17` — `isPaused` is initialized as `false` and reset to `false` in cleanup, but nothing ever sets it to `true`. Pause functionality is not implemented.

**Recommendation**: Remove `isPaused` from the interface until pause is actually needed.

---

## 4. Security Observations

### 4.1 API Key in Settings (acceptable for Obsidian plugins)
API key stored via Obsidian's `loadData()`/`saveData()` which persists to `.obsidian/plugins/voice-md/data.json` as plaintext. This is standard for Obsidian plugins — no vault-level secret store exists.

### 4.2 `dangerouslyAllowBrowser: true` — necessary
`openai-client.ts:14` — Required because Obsidian runs in an Electron/browser context. The API key is user-provided and not exposed to third parties.

### 4.3 No input sanitization on post-processing prompt
`openai-client.ts:92-96` — User's custom prompt is passed directly to the chat completions API. Since this is the user's own prompt and API key, there's no injection risk, but worth noting.

---

## 5. Obsidian Plugin Compliance Check

| Requirement | Status | Notes |
|-------------|--------|-------|
| `isDesktopOnly: false` | Pass | Mobile compatible |
| No Node.js/Electron APIs | Pass | Uses web-standard APIs only |
| Sentence case UI text | Pass | ESLint rule enforced |
| `minAppVersion` set | Pass | 0.15.0 |
| No external network beyond API | Pass | Only OpenAI API calls |
| Clean build output | Fail | TypeScript deprecation errors block `npm run build` |
| Linting passes | Fail | 5 ESLint errors |

---

## 6. Dependency Analysis

### 6.1 Production Dependencies
- `openai: ^6.37.0` — Major version 6.x of OpenAI SDK. Current and maintained.

### 6.2 Dev Dependencies
- `typescript: ^6.0.3` — TS 6 is what triggers the deprecation warnings in tsconfig
- `esbuild: ^0.28.0` — Current
- `eslint: ^10.3.0` — Current
- `obsidian: ^1.12.3` — Obsidian API types

### 6.3 Lock File State
Both `package-lock.json` and `yarn.lock` are present and modified on this branch. Should commit both or pick one package manager.

---

## 7. Summary of Actionable Items (Priority Order)

1. **Fix TypeScript build** — Update `tsconfig.json` (remove `baseUrl`, update `moduleResolution`)
2. **Fix ESLint errors** — Preserve caught errors in `recorder.ts`, fix `moment` typing in `voice-command.ts`
3. **Remove dead code** — `testConnection()`, `createSilentAudioBlob()`, `isPaused` field
4. **Pick one package manager** — Either `package-lock.json` or `yarn.lock`, not both
5. **Verify build passes** — `npm run build && npm run lint` must be clean before release
