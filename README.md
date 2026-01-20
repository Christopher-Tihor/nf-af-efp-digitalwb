# EFP (Environmental Farm Plan)

A Power Pages front-end enhancement for BC's Environmental Farm Plan workbook system. Built for the BC Ministry of Agriculture and Food.

## What This Is

This repo contains **powerpod** – a JavaScript library that extends Microsoft Power Pages with custom UI components, form logic, and Dataverse integrations. It powers the EFP workbook experience where producers complete environmental assessments with their Planning Advisors.

The core workflow: producers log in → fill out workbook chapters → PAs review and sign off → workbooks get submitted.

## Quick Start

```bash
cd powerpod
npm install
npm run dev      # Build with watch mode
npm run build    # Production build
npm test         # Run tests
```

## Local Development

You don't want to upload a new Web File every time you make a change. Instead, serve the bundle locally and redirect the browser to load it from your machine.

### 1. Start the local server

```bash
cd powerpod
npm run dev      # Builds and watches for changes
npm run serve    # Serves dist/ on http://localhost:8080
```

Or run both in separate terminals. The `serve` command uses http-server to host files from `dist/` with caching disabled and CORS enabled.

### 2. Redirect the browser to load local powerpod

Use a browser extension like **Resource Override** (Chrome) or **Requestly** to intercept the request for the production bundle and redirect it to your local build.

**Example redirect rule:**
| From | To |
|------|-----|
| `https://af-efp-dev.powerappsportals.com/powerpod-*.min.js` | `http://localhost:8080/powerpod.js` |

Now when you visit the DEV portal, it loads your local `powerpod.js` instead of the deployed version. Make a change, save, and refresh – no deploy needed.

### 3. Tips

- **Use the non-minified build** – Point to `powerpod.js` (not `.min.js`) for readable stack traces and console logs
- **Watch mode auto-rebuilds** – `npm run dev` recompiles on file save
- **Storybook for components** – Run `npm run storybook` to develop UI components in isolation

### Alternative: Development web page

Instead of using a browser extension, you can create a dedicated test page in Power Pages that loads directly from localhost:

1. In Portal Management, create a new Web Page (e.g., `/efpworkbook-dev/`)
2. In its content snippet or template, use a loader that points to your local server:
   ```javascript
   (function () {
     const src = 'http://127.0.0.1:8080/powerpod.js';
     const script = document.createElement('script');
     script.setAttribute('async', '');
     script.src = src;
     document.head.appendChild(script);
   })();
   ```

Now you have a dedicated URL for testing that always loads your local build. No browser extensions needed – just navigate to `/efpworkbook-dev/` instead of `/efpworkbook/`.

### Alternative: Browser DevTools override

Chrome DevTools has a built-in "Local Overrides" feature:
1. Open DevTools → Sources → Overrides
2. Select a local folder to store overrides
3. Find `powerpod.min.js` in the Network tab, right-click → "Save for overrides"
4. Replace the file content with your local build

This works but you have to manually copy the file each time.

---

> **Developer Guide** – Everything below is a quick-reference for developers joining the project. Last updated: January 2026

---

## Repo Structure

We build a JavaScript bundle (powerpod) that gets injected into Microsoft Power Pages to extend its capabilities beyond what's available out of the box.

```
efp/
├── assets/                          # Static assets for Power Pages portal
│   ├── Content Snippets/            # Global HTML/CSS snippets (injected via Portal Management)
│   │   ├── headbottom.html          # Global styles, fonts, Shoelace includes
│   │   └── EFP_Gov_Style_CSS.html   # BC Gov theme CSS tokens
│   ├── Templates/                   # Liquid templates for portal pages
│   │   ├── efp-home-page-template.html
│   │   └── efp-workbook-template.html
│   ├── PowerPagesStyling/           # Portal theme CSS files
│   └── Web Pages/                   # Page-specific content
│
├── powerpod/                        # Main JavaScript application
│   ├── src/
│   │   ├── js/
│   │   │   ├── app.js               # Entry point - bootstraps everything
│   │   │   ├── powerpod.js          # Core jQuery plugin + route detection
│   │   │   ├── jquery-adapter.js    # jQuery initialization wrapper
│   │   │   ├── common/              # Shared utilities
│   │   │   │   ├── constants.js     # Environment hosts, form types, status codes
│   │   │   │   ├── env.ts           # Environment detection (dev/test/prod)
│   │   │   │   ├── fetch.js         # All Dataverse API calls live here
│   │   │   │   ├── logger.js        # Logging utility
│   │   │   │   ├── options.js       # Runtime configuration
│   │   │   │   ├── utils.js         # General helpers
│   │   │   │   └── ...              # Other utilities
│   │   │   ├── components/          # Lit-based web components
│   │   │   │   ├── EFPEntryForm.ts  # Main workbook form component
│   │   │   │   ├── NavigationSidebar.ts
│   │   │   │   ├── ActionPlanTable.ts
│   │   │   │   ├── efp/             # EFP-specific component utils
│   │   │   │   └── ...
│   │   │   ├── services/            # Business logic services
│   │   │   │   ├── ChapterManagementService.ts
│   │   │   │   ├── WorkbookResponseService.ts
│   │   │   │   └── WorkbookValidationService.ts
│   │   │   ├── state/               # State management
│   │   │   ├── store/               # Vuex-like store pattern
│   │   │   ├── pages/               # Page-specific initialization
│   │   │   └── workbook/            # Workbook feature logic
│   │   ├── assets/                  # CSS, fonts, icons bundled with JS
│   │   └── test/                    # Jest test files
│   ├── dist/                        # Build output
│   │   ├── powerpod.js              # Development build (readable)
│   │   └── powerpod.min.js          # Production build (minified)
│   ├── releases/                    # Versioned release artifacts
│   │   └── powerpod-X.Y.Z.min.js
│   ├── rollup.config.js             # Rollup bundler configuration
│   ├── package.json                 # NPM dependencies & scripts
│   └── jest.config.cjs              # Test configuration
│
└── scripts/
    ├── version-bump.sh              # Bumps version across all files, copies release
    └── pipeline.sh                  # CI validation script
```

---

## Build Tooling

**Runtime:** Node.js (check `.nvmrc` or use latest LTS)
**Package Manager:** NPM (`package-lock.json` present)
**Bundler:** Rollup with Babel (transpiles to ES5 for IE11 compat)

Rollup produces two files:
- `dist/powerpod.js` – UMD bundle, readable (for debugging)
- `dist/powerpod.min.js` – UMD bundle, minified (drops console logs)

---

## How Powerpod Gets Into Power Pages

This is the part that confuses everyone at first. Here's the flow:

1. **Content Snippets** – In Portal Management, there's a global "Head/Bottom" snippet that loads the powerpod script. See `assets/Content Snippets/headbottom.html`.

2. **CDN Loading** – The script is loaded from jsDelivr CDN, which serves files directly from this GitHub repo. The loader in the content snippet looks like:
   ```javascript
   (function () {
     const src =
       'https://cdn.jsdelivr.net/gh/bcgov/nf-af-efp-digitalwb@dev/powerpod/releases/powerpod-4.9.1.min.js';
     const script = document.createElement('script');
     script.setAttribute('async', '');
     script.src = src;
     document.head.appendChild(script);
   })();
   ```

   The URL format is: `cdn.jsdelivr.net/gh/{org}/{repo}@{branch}/{path}`

   To deploy a new version, just push to the branch referenced in the URL (e.g., `dev` or `main`). jsDelivr will serve the updated file within minutes.

3. **Page Templates** – Liquid templates (like `efp-workbook-template.html`) define the page structure. They include containers that powerpod components render into (e.g., `.efpEntryFormContainer`).

4. **Auto-initialization** – When the page loads, powerpod detects the current URL path, determines which form/page type it is (Workbook, Application, Claim, etc.), and initializes the appropriate functionality.

### Updating the Portal

1. Run `scripts/version-bump.sh` to increment version and copy build to `releases/`
2. Commit and push to the branch referenced in the CDN URL
3. Update the version number in the Content Snippet if using a versioned filename

For production, you may want to use a specific version tag instead of a branch to avoid unexpected updates.

---

## Environment Detection

The app auto-detects which environment it's running in based on the hostname:

| Environment | Hosts |
|-------------|-------|
| DEV | `af-pods-dev.powerappsportals.com`, `af-efp-dev.powerappsportals.com` |
| TEST | `af-pods-test.powerappsportals.com`, `af-efp-test.powerappsportals.com` |
| PROD | `af-pods.powerappsportals.com` |

See `powerpod/src/js/common/constants.js` for the full host list.

Log levels vary by environment:
- **DEV:** Everything logged
- **TEST:** Warnings and errors only  
- **PROD:** Errors only

---

## Environment Variables & Portal Settings

### Dataverse Environment Variables

The app fetches environment variables from Dataverse at runtime via the `/_api/environmentvariabledefinitions` endpoint. These are used for configuration that varies between environments.

All custom env vars are prefixed with `quartech_` in the schema name.

### Portal Site Settings

Power Pages uses Site Settings for configuration. Key ones to know:
- Authentication settings (BCSC integration)
- Content snippet references
- Custom entity permissions

### API Endpoints

All Dataverse API calls are centralized in `powerpod/src/js/common/fetch.js`. The `ENDPOINT_URL` object defines every endpoint used:

```javascript
ENDPOINT_URL = {
  get_env_vars_data: "/_api/environmentvariabledefinitions?...",
  get_workbook_data_by_id: (id) => `/_api/quartech_workbooks(${id})`,
  get_chapters_data: "/_api/quartech_chapters?$filter=statecode eq 0",
  // ... etc
}
```

If you're adding a new feature that needs data from Dataverse, add the endpoint here and create a corresponding fetch function.

---

## Branching Strategy

We keep it simple:

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code. Deployments to PROD come from here. |
| `dev` | Active development. This is the default branch for PRs. |
| `release/*` | Release branches for stabilization before merging to main. |
| `feature/*` | Individual feature work. Branch off `dev`, merge back to `dev`. |

### Typical Workflow

1. Create `feature/my-thing` from `dev`
2. Do your work, push commits
3. Open PR against `dev`
4. After review + merge, the updated `dev` gets deployed to DEV environment
5. When ready for release, create `release/X.Y.Z` from `dev`
6. Test in TEST environment, fix any issues directly on release branch
7. Merge to `main` for production deploy

### Versioning

We use semver-ish versioning. The `scripts/version-bump.sh` script increments the patch version and updates:
- `powerpod/package.json`
- `powerpod/rollup.config.js` (license banner)
- `powerpod/src/js/powerpod.js` (runtime version)

Then it copies the minified build to the releases folder.

---

## Where to Find Things

Quick reference for common tasks:

| If you need to... | Look here |
|-------------------|-----------|
| Add a new Dataverse API call | `powerpod/src/js/common/fetch.js` |
| Change environment detection | `powerpod/src/js/common/constants.js` |
| Modify the workbook form UI | `powerpod/src/js/components/EFPEntryForm.ts` |
| Update navigation sidebar | `powerpod/src/js/components/NavigationSidebar.ts` |
| Add/modify workbook questions | `powerpod/src/js/components/QuestionRenderer.ts` |
| Change chapter navigation logic | `powerpod/src/js/services/ChapterManagementService.ts` |
| Update response saving behavior | `powerpod/src/js/services/WorkbookResponseService.ts` |
| Add validation rules | `powerpod/src/js/services/WorkbookValidationService.ts` |
| Modify state management | `powerpod/src/js/store/` directory |
| Update global portal styles | `assets/Content Snippets/headbottom.html` |
| Change page templates | `assets/Templates/` directory |
| Configure allowed paths/hosts | `powerpod/src/js/common/options.js` |
| Add/update program configuration | See `powerpod/README.md` for JSON config format |
| Write tests | `powerpod/src/test/` directory |
| Debug in Storybook | `powerpod/src/js/components/*.stories.ts` |
| Review UI customizations | [`docs/CUSTOMIZATION_INVENTORY.md`](docs/CUSTOMIZATION_INVENTORY.md) |

---

## Page/Feature Mapping

| Portal Path | Feature | Entry Point |
|-------------|---------|-------------|
| `/` or `/home-dev/` | Home page | Auto-detected, loads home content |
| `/efpworkbook/` | Workbook form | `initWorkbook()` in `workbook/workbook.js` |
| `/my-efp-workbooks/` | Workbook list | `initMyEfpWorkbooks()` in `pages/myEfpWorkbooks.js` |
| `/application/` | Grant application | Application form logic (legacy) |
| `/claim/` | Claim submission | Claim form logic (legacy) |

Path detection happens in `powerpod/src/js/powerpod.js` and uses the path arrays defined in `constants.js`.

---

## Quick Tips

- **Console logging:** Use the `Logger` utility (`import { Logger } from './common/logger.js'`). It respects environment log levels.
- **jQuery is available:** Power Pages includes jQuery. Powerpod piggybacks on it via `$.fn.powerpod()`.
- **Shoelace components:** We use Shoelace for UI components (dialogs, buttons, etc.). It's loaded via CDN in the head snippet.
- **Lit for web components:** Custom components use Lit. Check existing components for patterns.

---

## Common Gotchas

1. **CORS issues on localhost:** The fetch module automatically prefixes requests with the DEV portal URL when running locally, but you still need proper browser setup (or use the actual portal).

2. **Caching:** API responses are cached by default. Use `skipCache: true` in fetch calls if you need fresh data.

3. **Request Verification Token:** POST/PATCH/DELETE requests need the `__RequestVerificationToken` header. The fetch module handles this when you set `addRequestVerificationToken: true`.

4. **Path matching:** The app only runs on allowed paths. If your new page isn't working, check `options.js` for the `allowedPaths` array.

5. **Version mismatch:** After deploying, users might have cached old versions. The version is in the license banner at the top of the bundle.

---

*Questions? Check the powerpod README.md for field configuration docs, or ping the team.*
