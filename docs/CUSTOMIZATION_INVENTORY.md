# EFP Customization Inventory

This document catalogs all UI customizations in the EFP (Environmental Farm Plan) Power Pages application.

---

## 1. Inline Action Buttons on Workbook List

### Purpose
Provides inline Edit/View/Delete action buttons in entity list tables for workbook management, styled to match BC Gov design system.

### Files Involved
| File | Description |
|------|-------------|
| `assets/PowerPagesStyling/portaltheme.css` | Lines 1951-2026 - Action dropdown styling |
| `assets/Web Pages/efp-workbook-list.html` | Entity list page with role-based views |

### Selectors/Hooks
```css
/* Action dropdown trigger button */
.dropdown.action .btn { ... }

/* Action dropdown menu items - icon buttons */
.dropdown.action .dropdown-menu .dropdown-item { ... }

/* Action dropdown menu styling - horizontal layout */
.dropdown.action .dropdown-menu { display: flex !important; flex-direction: row !important; }
```

### CSS Token Mapping
| Token | Value | Usage |
|-------|-------|-------|
| `--bcgov-blue` | `#003366` | Button background |
| `--bcgov-blue-70` | `#1a5a96` | Hover state |
| `--bcgov-focus` | `#3399ff` | Focus outline |

### Dependencies
- Bootstrap 5 dropdown component
- Font Awesome icons (fa, fa-solid)
- Power Pages entity list framework

### Known Limitations
- Buttons render horizontally in a row within dropdown menu
- Fixed 2rem × 2rem icon button size
- Requires Power Pages entity list configuration in portal management

### Testing Notes
- Verify role-based visibility (Producer View vs Planning Advisor View)
- Test keyboard navigation (Tab, Enter, Space)
- Validate focus ring appearance (3px solid #3399ff)
- Test on mobile viewport widths

---

## 2. Rating Control with "?" Option and Color Palette

### Purpose
Provides a visual rating selection UI for workbook questions with:
- **Point Rating**: 4-point scale (1-4) with N/A and "?" (Unknown) options
- **Yes/No/NA**: Binary selection with N/A and "?" options
- Consistent card-based layout with semantic color coding

### Files Involved
| File | Description |
|------|-------------|
| `powerpod/src/js/components/RatingQuestion.ts` | Main Lit component (722 lines) |
| `powerpod/src/js/components/QuestionRenderer.ts` | Renders rating questions (420 lines) |

### Component Interface
```typescript
@customElement('rating-question')
export class RatingQuestion extends LitElement {
  @property({ type: String }) questionId = '';
  @property({ type: String }) questionType = ''; // 'Yes/No/NA' | 'Point Rating'
  @property({ type: Array }) options: RatingOption[] = [];
  @property({ type: String }) selectedValue = '';
  @property({ type: Object }) ratingMetadata: RatingMetadata = {};
  @property({ type: Boolean }) disabled = false;
}
```

### Color Palette Mapping (Blue-to-Red Sequential Scale)
| Rating | CSS Class | Background | Text |
|--------|-----------|------------|------|
| Rating 1 | `.rating-1` | `#12436D` | white |
| Rating 2 | `.rating-2` | `#28A197` | white |
| Rating 3 | `.rating-3` | `#F46A25` | white |
| Rating 4 | `.rating-4` | `#D4351C` | white |
| N/A | `.na` | `#e0e0e0` | #333 |
| Unknown (?) | `.unknown` | `#e0e0e0` | #333 |

### Yes/No Color Mapping
| Option | CSS Class | Background | Text |
|--------|-----------|------------|------|
| Yes | `.yes` | `#12436D` | white |
| No | `.no` | `#D4351C` | white |
| N/A | `.na` | `#e0e0e0` | #333 |
| Unknown (?) | `.unknown` | `#e0e0e0` | #333 |

### Selectors/Hooks
```css
/* Card layout for all options */
.rating-card { flex: 1 1 0; min-width: 140px; border: 2px solid #333; ... }
.rating-card-header { font-weight: 700; border-radius: 8px 8px 0 0; }
.rating-card-description { font-size: 0.85rem; line-height: 1.4; }

/* Selected state with gold ring */
.rating-card.selected {
  box-shadow: 0 0 0 4px #FFD700, 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Checkmark badge */
.rating-card.selected::before {
  content: '✓';
  background-color: #FFD700;
  border-radius: 50%;
}
```

### Dependencies
- Lit 3.x (LitElement, html, css)
- Shoelace components (used elsewhere in form)
- BC Sans / Roboto Slab fonts

### Known Limitations
- Rating descriptions support HTML but inline font styles are stripped
- Mobile responsive breakpoint at 992px (cards stack vertically)
- Card min-width of 140px may cause horizontal scroll on very narrow screens

### Testing Notes
- Verify `rating-changed` event dispatches with { questionId, value }
- Test keyboard accessibility (card click should work with Enter/Space)
- Validate selected state checkmark position on different card sizes
- Test with and without rating descriptions (metadata)

---

## 3. Tooltip Sizing and Styling

### Purpose
Provides consistent tooltip styling across the application with proper sizing, positioning, and BC Gov color scheme.

### Files Involved
| File | Description |
|------|-------------|
| `assets/PowerPagesStyling/portaltheme.css` | Lines 1927-1949 - Tooltip overrides |

### Selectors/Hooks
```css
/* Tooltip container */
.tooltip { font-size: 0.875rem; }

/* Tooltip inner content */
.tooltip-inner {
  max-width: 300px;
  padding: 8px 12px;
  background-color: #333;
  border-radius: 4px;
}

/* Tooltip arrow */
.tooltip .tooltip-arrow::before { border-top-color: #333; }
```

### CSS Token Mapping
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#333` | Tooltip background |
| Text | `white` | Tooltip text |
| Max Width | `300px` | Content constraint |
| Padding | `8px 12px` | Inner spacing |

### Dependencies
- Bootstrap 5 tooltip component
- Popper.js (via Bootstrap)

### Known Limitations
- Fixed max-width may truncate long content
- Arrow color must match background manually

### Testing Notes
- Verify tooltip appears on hover and focus
- Test positioning (top, bottom, left, right)
- Validate text wrapping within max-width

---

## 4. Header Simplification

### Purpose
Simplified header layout removing unnecessary elements and focusing on essential navigation for the EFP workbook experience.

### Files Involved
| File | Description |
|------|-------------|
| `assets/Web Templates/Header.html` | Main header template |
| `assets/PowerPagesStyling/portaltheme.css` | Header styling overrides |

### Selectors/Hooks
```css
/* Main header container */
.navbar-brand { ... }

/* Navigation items */
.navbar-nav .nav-link { ... }

/* Mobile menu toggle */
.navbar-toggler { ... }
```

### Dependencies
- Bootstrap 5 navbar component
- Power Pages Liquid templating

### Known Limitations
- Header is shared across all portal pages
- Changes affect entire site navigation

### Testing Notes
- Verify responsive behavior at mobile breakpoints
- Test navigation links functionality
- Validate accessibility (skip links, ARIA labels)

---

## 5. Review & Submit Navigation

### Purpose
Provides a dedicated navigation flow for the Review & Submit section of the workbook, allowing users to review all sections before final submission.

### Files Involved
| File | Description |
|------|-------------|
| `powerpod/src/js/components/ReviewSubmit.ts` | Review & Submit component |
| `powerpod/src/js/components/WorkbookNavigation.ts` | Navigation component |

### Component Interface
```typescript
// Navigation to Review & Submit section
interface ReviewSubmitNavigation {
  currentSection: string;
  completedSections: string[];
  canSubmit: boolean;
}
```

### Selectors/Hooks
```css
/* Review section container */
.review-submit-section { ... }

/* Section summary cards */
.section-summary-card { ... }

/* Submit button */
.submit-workbook-btn { ... }
```

### Dependencies
- Workbook section completion tracking
- Form validation state

### Known Limitations
- Requires all mandatory sections to be completed
- Submission is final (no edit after submit in some workflows)

### Testing Notes
- Verify section completion indicators
- Test navigation between review and edit modes
- Validate submit button enable/disable logic

---

## 6. Dropdown Contrast Fix

### Purpose
Ensures dropdown menus have sufficient color contrast for accessibility compliance (WCAG 2.1 AA).

### Files Involved
| File | Description |
|------|-------------|
| `assets/PowerPagesStyling/portaltheme.css` | Dropdown styling overrides |

### Selectors/Hooks
```css
/* Dropdown menu container */
.dropdown-menu {
  background-color: #fff;
  border: 1px solid #ccc;
}

/* Dropdown items */
.dropdown-item {
  color: #333;
}

/* Dropdown item hover/focus */
.dropdown-item:hover,
.dropdown-item:focus {
  background-color: #f5f5f5;
  color: #003366;
}
```

### CSS Token Mapping
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#fff` | Menu background |
| Border | `#ccc` | Menu border |
| Text | `#333` | Item text |
| Hover BG | `#f5f5f5` | Item hover state |
| Hover Text | `#003366` | BC Gov blue on hover |

### Dependencies
- Bootstrap 5 dropdown component

### Known Limitations
- Overrides Bootstrap defaults globally

### Testing Notes
- Verify contrast ratio meets WCAG 2.1 AA (4.5:1 for text)
- Test with browser accessibility tools
- Validate focus visibility

---

## 7. Action Plan Labels

### Purpose
Provides styled labels for action plan items in the workbook, indicating status and priority.

### Files Involved
| File | Description |
|------|-------------|
| `powerpod/src/js/components/ActionPlanItem.ts` | Action plan item component |
| `powerpod/src/js/components/ActionPlanList.ts` | Action plan list component |

### Component Interface
```typescript
interface ActionPlanItem {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
}
```

### Selectors/Hooks
```css
/* Status labels */
.action-status-pending { background-color: #f0ad4e; }
.action-status-in-progress { background-color: #5bc0de; }
.action-status-completed { background-color: #5cb85c; }

/* Priority labels */
.action-priority-low { border-left: 4px solid #5cb85c; }
.action-priority-medium { border-left: 4px solid #f0ad4e; }
.action-priority-high { border-left: 4px solid #d9534f; }
```

### Dependencies
- Action plan data model
- Workbook section integration

### Known Limitations
- Status colors are fixed (not themeable)
- Priority indicator is left border only

### Testing Notes
- Verify label visibility on different backgrounds
- Test status transitions
- Validate priority visual hierarchy

---

## Appendix A: CSS Custom Properties (Design Tokens)

### BC Gov Color Palette
```css
:root {
  /* Primary Colors */
  --bcgov-blue: #003366;
  --bcgov-blue-70: #1a5a96;
  --bcgov-gold: #FCBA19;
  --bcgov-focus: #3399ff;

  /* Semantic Colors */
  --bcgov-success: #2e8540;
  --bcgov-warning: #f0ad4e;
  --bcgov-error: #d9534f;
  --bcgov-info: #5bc0de;

  /* Neutral Colors */
  --bcgov-gray-dark: #333;
  --bcgov-gray-medium: #666;
  --bcgov-gray-light: #ccc;
  --bcgov-gray-lighter: #f5f5f5;
  --bcgov-white: #fff;

  /* Rating Scale Colors */
  --rating-1: #12436D;
  --rating-2: #28A197;
  --rating-3: #F46A25;
  --rating-4: #D4351C;
  --rating-na: #e0e0e0;
  --rating-unknown: #e0e0e0;

  /* Selection Highlight */
  --selection-ring: #FFD700;
}
```

### Typography
```css
:root {
  --font-primary: 'BC Sans', 'Noto Sans', Arial, sans-serif;
  --font-heading: 'Roboto Slab', serif;

  --font-size-xs: 0.75rem;   /* 12px */
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-base: 1rem;    /* 16px */
  --font-size-lg: 1.125rem;  /* 18px */
  --font-size-xl: 1.25rem;   /* 20px */
  --font-size-2xl: 1.5rem;   /* 24px */
}
```

### Spacing
```css
:root {
  --spacing-xs: 0.25rem;  /* 4px */
  --spacing-sm: 0.5rem;   /* 8px */
  --spacing-md: 1rem;     /* 16px */
  --spacing-lg: 1.5rem;   /* 24px */
  --spacing-xl: 2rem;     /* 32px */
}
```

---

## Appendix B: Custom Web Components Registry

| Component Tag | File | Purpose |
|---------------|------|---------|
| `<rating-question>` | `RatingQuestion.ts` | Rating selection UI |
| `<question-renderer>` | `QuestionRenderer.ts` | Question display wrapper |
| `<workbook-navigation>` | `WorkbookNavigation.ts` | Section navigation |
| `<action-plan-item>` | `ActionPlanItem.ts` | Action plan entry |
| `<action-plan-list>` | `ActionPlanList.ts` | Action plan container |
| `<review-submit>` | `ReviewSubmit.ts` | Review & submit section |

---

## Appendix C: Power Pages Entity List Customizations

### Entity List Views
| View Name | Entity | Purpose |
|-----------|--------|---------|
| Producer View | efp_workbook | Workbooks owned by current user |
| Planning Advisor View | efp_workbook | Workbooks for advisor's clients |

### Entity List Actions
| Action | Icon | Permission |
|--------|------|------------|
| Edit | `fa-pencil` | Owner or Advisor |
| View | `fa-eye` | Owner or Advisor |
| Delete | `fa-trash` | Owner only |

---

## Appendix D: Accessibility Compliance

### WCAG 2.1 AA Requirements Met
- ✅ Color contrast ratio ≥ 4.5:1 for normal text
- ✅ Color contrast ratio ≥ 3:1 for large text
- ✅ Focus indicators visible (3px solid outline)
- ✅ Keyboard navigation supported
- ✅ Screen reader compatible (ARIA labels)

### Focus Management
```css
/* Global focus style */
*:focus-visible {
  outline: 3px solid var(--bcgov-focus);
  outline-offset: 2px;
}

/* Button focus */
.btn:focus-visible {
  box-shadow: 0 0 0 3px var(--bcgov-focus);
}
```

---

## Appendix E: Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Supported |
| Firefox | 88+ | ✅ Supported |
| Safari | 14+ | ✅ Supported |
| Edge | 90+ | ✅ Supported |
| IE 11 | - | ❌ Not Supported |

---

## Appendix F: File Reference Index

### CSS Files
| File | Lines | Description |
|------|-------|-------------|
| `assets/PowerPagesStyling/portaltheme.css` | ~2100 | Main portal theme |
| `powerpod/src/js/components/*.ts` | - | Component-scoped styles |

### HTML Templates
| File | Description |
|------|-------------|
| `assets/Web Templates/Header.html` | Site header |
| `assets/Web Pages/efp-workbook-list.html` | Workbook list page |

### TypeScript Components
| File | Lines | Description |
|------|-------|-------------|
| `powerpod/src/js/components/RatingQuestion.ts` | 722 | Rating control |
| `powerpod/src/js/components/QuestionRenderer.ts` | 420 | Question wrapper |

---

*Document generated: 2025-01-20*
*Last updated: 2025-01-20*

