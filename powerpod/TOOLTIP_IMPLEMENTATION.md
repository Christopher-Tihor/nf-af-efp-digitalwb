# EFP Entry Form - Tooltip Implementation

## Overview

This document describes the implementation of tooltips for questions in the EFP Entry Form component. The tooltip functionality provides contextual help information for questions when tooltip content is available in the questionnaire data.

## Implementation Details

### 1. Dependencies Added

- **Shoelace Tooltip Component**: Added import for `@shoelace-style/shoelace/dist/components/tooltip/tooltip.js`
- **Shoelace Icon Component**: Already imported, used for the help icon

### 2. Data Structure

Questions in the questionnaire store include a `tooltip` property:

```javascript
{
  id: "question-id",
  name: "Question Name",
  label: "Question Label",
  tooltip: "Helpful information about this question", // Can be null or contain HTML
  // ... other properties
}
```

### 3. Component Changes

#### EFPEntryForm.ts

**Imports Added:**
```typescript
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
```

**CSS Styling Added:**
```css
.question-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  /* ... existing styles */
}

.question-tooltip-icon {
  color: var(--sl-color-neutral-500);
  cursor: help;
  font-size: 1rem;
}

.question-tooltip-icon:hover {
  color: var(--sl-color-primary-600);
}
```

**Template Changes:**
```typescript
private renderQuestion(question: any) {
  return html`
    <div class="question-container">
      <!-- ... existing content ... -->

      <div class="question-label">
        <span>${unsafeHTML(question.label)}</span>
        ${question.tooltip ? html`
          <sl-tooltip placement="top" style="--max-width: 300px;">
            <div slot="content">${unsafeHTML(question.tooltip)}</div>
            <sl-icon
              name="question-circle"
              class="question-tooltip-icon"
              aria-label="Question help"
            ></sl-icon>
          </sl-tooltip>
        ` : ''}
      </div>

      <!-- ... rest of question content ... -->
    </div>
  `;
}
```

## Features

### 1. Conditional Display
- Tooltip icon only appears when `question.tooltip` has content
- No visual clutter for questions without help information

### 2. Rich HTML Content Support
- Supports plain text tooltips
- **Full HTML rendering** using `slot="content"` and `unsafeHTML()`
- Handles CKEditor-formatted content from questionnaire store
- Preserves styling, formatting, lists, and inline elements
- Supports complex HTML structures with nested elements

### 3. Accessibility
- Includes `aria-label="Question help"` for screen readers
- Uses semantic help cursor (`cursor: help`)
- Keyboard accessible through Shoelace's built-in accessibility features

### 4. Visual Design
- Uses Shoelace's `question-circle` icon for consistency
- Hover effect changes color to primary theme color
- Positioned to the right of question labels
- Maximum width constraint (300px) for readability

### 5. Responsive Behavior
- Tooltip placement set to "top" to avoid layout issues
- Shoelace automatically adjusts placement if space is limited

## Usage Examples

### Basic Text Tooltip
```javascript
{
  label: "Are soil tests current?",
  tooltip: "Soil tests should be updated within the last 3 years for accurate nutrient management."
}
```

### HTML Formatted Tooltip
```javascript
{
  label: "Is a nutrient management plan in place?",
  tooltip: "<strong>Requirements:</strong><br/>• Updated within 5 years<br/>• Based on soil tests<br/>• Includes application timing"
}
```

### CKEditor Formatted Tooltip (from Questionnaire Store)
```javascript
{
  label: "Example question with rich formatting",
  tooltip: "<div class=\"ck-content\" data-wrapper=\"true\" dir=\"ltr\" style=\"--ck-image-style-spacing: 1.5em; --ck-inline-image-style-spacing: calc(var(--ck-image-style-spacing) / 2); font-family: Segoe UI; font-size: 11pt;\"><p style=\"margin: 0;\"><span style=\"color:#c82613;\"><i><u>Important information</u></i></span></p><p style=\"margin: 0.5rem 0 0 0;\">This tooltip content was created using the CKEditor in the questionnaire management system.</p></div>"
}
```

### No Tooltip
```javascript
{
  label: "What is your farm size?",
  tooltip: null // No tooltip icon will be displayed
}
```

## Testing

A test file `tooltip-test.html` has been created to demonstrate the tooltip functionality:

1. Open `powerpod/tooltip-test.html` in a web browser
2. Hover over the question mark icons (?) next to question labels
3. Observe different tooltip styles and content formats

## Browser Compatibility

- Uses Shoelace components which support modern browsers
- Graceful degradation for browsers without full CSS support
- No JavaScript required for basic tooltip functionality

## Future Enhancements

Potential improvements that could be added:

1. **Tooltip Positioning**: Dynamic positioning based on screen space
2. **Mobile Support**: Touch-friendly tooltip activation
3. **Theming**: Custom tooltip styling to match EFP branding
4. **Analytics**: Track tooltip usage for UX insights
5. **Internationalization**: Multi-language tooltip support

## Maintenance Notes

- Tooltip content comes from the questionnaire store data
- No additional API calls required
- Styling uses CSS custom properties for easy theming
- Component remains backward compatible with existing questionnaire data
