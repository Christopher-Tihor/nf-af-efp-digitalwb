# Questionnaire Store Documentation

## Overview

The questionnaire store provides a single source of truth for Section B questionnaire data in the Environmental Farm Plan (EFP) application. It uses the same pattern as the existing fields store, with mutations, actions, and helper functions.

## Architecture

### Store Structure

The questionnaire data is stored in `state.questionnaire` with the following structure:

```javascript
{
  questionnaire: {
    title: "Environmental Farm Plan Questionnaire",
    chapters: [
      [
        {
          id: "chapter-id",
          name: "Chapter Name",
          label: "Chapter Label",
          order: 1,
          complete: false,
          description: "Chapter description",
          tooltip: null,
          imageUrl: null,
          questions: [
            {
              id: "question-id",
              name: "Question Name",
              label: "Question Label",
              order: 1,
              questionType: 100000001,
              textAboveQuestion: null,
              textBelowQuestion: "Question details",
              tooltip: null,
              responseOptionColor: null,
              response: null,
              responseData: null,
              complete: false,
              hasResponse: false
            }
          ],
          subchapters: [
            // Nested subchapter structure
          ]
        }
      ]
    ]
  }
}
```

### Store Components

1. **State** (`powerpod/src/js/store/state.js`)
   - Contains the `questionnaire: {}` property

2. **Mutations** (`powerpod/src/js/store/mutations.js`)
   - `setQuestionnaireData`: Set the entire questionnaire data
   - `updateQuestionnaireChapter`: Update a specific chapter
   - `updateQuestionnaireQuestion`: Update a specific question

3. **Actions** (`powerpod/src/js/store/actions.js`)
   - `setQuestionnaireData`: Dispatch to set questionnaire data
   - `updateQuestionnaireChapter`: Dispatch to update a chapter
   - `updateQuestionnaireQuestion`: Dispatch to update a question

4. **Helper Functions** (`powerpod/src/js/common/questionnaire.js`)
   - Utility functions for working with questionnaire data

## Usage

### Loading Questionnaire Data

```javascript
import { loadQuestionnaireIntoStore, loadQuestionnaireWithResponses } from '../common/questionnaire.js';

// Load nested chapter structure into store (without responses)
const nestedStructure = getChaptersWithNestedQuestionsAndSubchapters();
loadQuestionnaireIntoStore(nestedStructure);

// Load questionnaire with response data (recommended)
const workbookId = getWorkbookId();
await loadQuestionnaireWithResponses(nestedStructure, workbookId);
```

### Getting Questionnaire Data

```javascript
import { getQuestionnaireFromStore } from '../common/questionnaire.js';

const questionnaire = getQuestionnaireFromStore();
if (questionnaire) {
  console.log('Questionnaire loaded:', questionnaire.title);
}
```

### Getting Specific Chapters or Questions

```javascript
import { getChapterFromStore, getQuestionFromStore } from '../common/questionnaire.js';

// Get a specific chapter
const chapter = getChapterFromStore('chapter-id');

// Get a specific question
const question = getQuestionFromStore('question-id');
```

### Updating Question Responses

```javascript
import { updateQuestionResponse } from '../common/questionnaire.js';

// Update a question response (simple)
updateQuestionResponse('question-id', 'response-value', true);

// Update a question response with full response data (recommended)
const responseData = {
  quartech_workbookresponseid: "response-id",
  quartech_response: "response-value",
  quartech_notes: "Additional notes",
  _quartech_question_value: "question-id",
  _quartech_workbook_value: "workbook-id",
  createdon: new Date().toISOString(),
  modifiedon: new Date().toISOString()
};
updateQuestionResponse('question-id', 'response-value', true, responseData);
```

### Automatic Completion Logic

The questionnaire store now uses intelligent completion rules that automatically calculate chapter completion status:

```javascript
import {
  updateQuestionnaireCompletion,
  calculateChapterCompletion
} from '../common/questionnaire.js';

// Automatically update all chapter completion based on rules
updateQuestionnaireCompletion();

// Calculate completion for a specific chapter
const chapter = getChapterFromStore('chapter-id');
const shouldBeComplete = calculateChapterCompletion(chapter);
```

#### Completion Rules

1. **Empty Chapters**: If a chapter has no questions and no subchapters → marked complete
2. **Questions-Only**: If a chapter has only questions → complete when all questions are answered
3. **Subchapters-Only**: If a chapter has only subchapters → complete when all subchapters are complete
4. **Mixed Content**: If a chapter has both questions and subchapters → complete when ALL questions AND ALL subchapters are complete

#### Automatic Updates

Completion status is automatically recalculated when:
- Questionnaire data is loaded into the store
- Question responses are updated
- The `updateQuestionnaireCompletion()` function is called

### Manual Chapter Completion (Legacy)

```javascript
import { updateChapterCompletion } from '../common/questionnaire.js';

// Manually mark a chapter as complete (not recommended - use automatic logic)
updateChapterCompletion('chapter-id', true);
```

### Getting Statistics

```javascript
import { getQuestionnaireStats } from '../common/questionnaire.js';

const stats = getQuestionnaireStats();
console.log(`Completion: ${stats.completionPercentage}%`);
console.log(`Answered: ${stats.answeredQuestions}/${stats.totalQuestions}`);
```

## Integration Points

### Automatic Response Synchronization

The `workbookResponseHelper.js` has been updated to automatically synchronize with the questionnaire store:

```javascript
// All response operations now update both POWERPOD and questionnaire store
import { createResponse, updateResponse, deleteResponse } from '../common/workbookResponseHelper.js';

// Creating a response updates both systems
const result = await createResponse(workbookId, questionId, "response value");
// ✅ Updates POWERPOD.workbookQuestionsAndResponses
// ✅ Updates questionnaire store automatically

// Updating a response syncs both systems
await updateResponse(responseId, "new response value");
// ✅ Updates POWERPOD.workbookQuestionsAndResponses
// ✅ Updates questionnaire store automatically

// Deleting a response removes from both systems
await deleteResponse(responseId);
// ✅ Removes from POWERPOD.workbookQuestionsAndResponses
// ✅ Removes from questionnaire store automatically
```

### Workbook Initialization

The questionnaire store is automatically populated with **all existing response data** during workbook initialization:

```javascript
// In powerpod/src/js/workbook/workbook.js
import { loadQuestionnaireWithResponses } from '../common/questionnaire.js';

// After building nested structure
const nestedStructure = getChaptersWithNestedQuestionsAndSubchapters();
const workbookId = getWorkbookId();

// Load questionnaire with ALL existing responses
if (workbookId) {
  await loadQuestionnaireWithResponses(nestedStructure, workbookId);
  // This automatically loads all existing workbook responses and merges them with questions
} else {
  // Fallback to loading without responses
  loadQuestionnaireIntoStore(nestedStructure);
}
```

### Response Loading Process

1. **Fresh Response Data**: Always loads the latest response data from the API
2. **Complete Merge**: All existing responses are merged with their corresponding questions
3. **Response Statistics**: Calculates completion percentages and statistics
4. **Memory Integration**: Updates both questionnaire store and existing POWERPOD structures

### EFP Entry Form

The EFP Entry Form component uses the questionnaire store:

```javascript
// In powerpod/src/js/components/EFPEntryForm.ts
import { getQuestionnaireFromStore, updateQuestionResponse } from '../common/questionnaire.js';

// Get chapters from store instead of property
private getQuestionnaireChapters(): any[] {
  const questionnaire = getQuestionnaireFromStore();
  if (questionnaire?.chapters?.length > 0) {
    return questionnaire.chapters[0] || [];
  }
  return this.nestedChapterStructure; // fallback
}

// Update responses in store with full response data
private async handleRatingChanged(event: CustomEvent) {
  const { questionId, value } = event.detail;

  // Save to API and get response data
  const responseData = await this.saveRatingResponse(questionId, value);

  // Update store with full response data
  updateQuestionResponse(questionId, value, true, responseData);
  // ✅ Completion status automatically recalculated
  // ✅ Navigation icons automatically updated
}
```

### Navigation Integration

The EFP navigation now uses the questionnaire store to determine icon display:

```javascript
// Navigation icons are automatically determined by completion status
// ✅ Complete chapters/questions → check-circle (green)
// ✏️ Incomplete chapters/questions → pencil (orange/gray)
// 🎯 Icons now show at ALL levels: top-level parents, subchapters, and section tabs

// In EFPEntryForm.ts
private getCompletionFromStore(item: any): boolean {
  // Gets completion status from questionnaire store
  if (item.chapterId) {
    const chapter = getChapterFromStore(item.chapterId);
    return chapter?.complete || false;
  }

  if (item.questionId) {
    const question = getQuestionFromStore(item.questionId);
    return question?.complete || false;
  }

  // Fallback to item's current status
  return item.complete || false;
}

// Section tabs also use questionnaire store
private getSectionCompletionFromStore(section: any): boolean {
  // For Section B, calculates completion from questionnaire store
  // Section is complete when ALL questions are answered
}

// Top-level parent chapters now show completion icons
// Updated rendering with icons in sl-details summary
<sl-details data-container-title="${item.title}">
  <div slot="summary" style="display: flex; align-items: center; gap: 8px;">
    <sl-icon name=${isComplete ? 'check-circle' : 'pencil'}
             style="color: ${isComplete ? 'var(--sl-color-success-600)' : 'var(--sl-color-warning-600)'}">
    </sl-icon>
    <span>${item.title}</span>
  </div>
  <!-- subchapters rendered here -->
</sl-details>

// Navigation state management updated to work with custom summary slots
private updateNavigationState(currentLabel: string) {
  const allDetails = this.shadowRoot?.querySelectorAll('sl-details');
  const containersToOpen = EFPNavigationUtils.findContainersForItem(currentLabel, this.sections);

  allDetails.forEach(detail => {
    // Check data attribute first, then fallback to other methods
    const containerTitle = detail.getAttribute('data-container-title');
    const summary = detail.getAttribute('summary');
    const customSummarySpan = detail.querySelector('[slot="summary"] span');
    const summaryText = containerTitle || summary || customSummarySpan?.textContent;

    detail.open = summaryText && containersToOpen.includes(summaryText);
  });
}
```

#### Navigation Icon Levels

Icons are now displayed at **all navigation levels**:

1. **Top-level Parent Chapters** (e.g., "Chapter 2. Farmstead")
   - ✅ Show completion icons in the collapsible header
   - Icon reflects completion of all subchapters and questions within

2. **Subchapters** (e.g., "2.1 Buildings And Roads")
   - ✅ Show completion icons next to subchapter names
   - Icon reflects completion of questions within the subchapter

3. **Section Tabs** (e.g., "Section B")
   - ✅ Show completion icons in the tab header
   - Icon reflects completion of entire section

#### Unified Navigation Rendering

All navigation items are now rendered consistently based on their content, regardless of hierarchy level:

| Content Type | Behavior | Rendering | Example |
|--------------|----------|-----------|---------|
| **Questions Only** | Clickable only | `<div @click>` | Simple subchapter with questions |
| **Subchapters Only** | Expandable only | `<sl-details>` | Chapter container with subchapters |
| **Both Questions + Subchapters** | Clickable AND expandable | `<sl-details>` with clickable summary | Mixed chapter/subchapter |
| **Empty** | Container only | `<sl-details>` (non-interactive) | Placeholder containers |

#### Mixed Items (Questions + Subchapters)

Items with both questions and subchapters render as **clickable AND expandable in one line**:

```html
<sl-details data-container-title="Chapter 3.4 Mortality Disposal">
  <div
    slot="summary"
    style="cursor: pointer; ..."
    @click=${(e) => {
      e.stopPropagation(); // Prevent expansion
      onItemClick(item);   // Navigate to questions
    }}
  >
    <sl-icon name="pencil"></sl-icon>
    <span>Chapter 3.4 Mortality Disposal</span>
  </div>
  <!-- Subchapters rendered here when expanded -->
</sl-details>
```

**User Experience**:
- **Click the title** → Navigate to item's questions
- **Click the expand arrow** → Show/hide subchapters
- **Same visual styling** → Consistent across all hierarchy levels

### Direct Store Usage for Navigation

The EFP navigation now uses questionnaire store data directly instead of transformation layers:

```javascript
// Before: Used generateSectionBItems transformation
items: EFPSectionGenerator.generateSectionBItems(this.getQuestionnaireChapters())

// After: Direct store usage
items: this.getSectionBItemsFromStore()

// Direct store access with loading state
private getSectionBItemsFromStore(): EFPSectionItem[] {
  const questionnaire = getQuestionnaireFromStore();

  // Show loading state if store not loaded (no fallback)
  if (!questionnaire?.chapters?.length) {
    return [{
      label: 'Loading Environmental Farm Plan...',
      content: '<h3>Loading...</h3><p>Waiting for questionnaire store...</p>',
      complete: false
    }];
  }

  const chapters = questionnaire.chapters[0] || [];

  return chapters.map(chapter => ({
    label: `Chapter ${Math.floor(chapter.order || 0)}`,
    complete: chapter.complete, // ✅ Direct from store
    chapterId: chapter.id,      // ✅ Store chapter ID for lookups
    items: chapter.subchapters?.map(subchapter => ({
      label: formatTitle(subchapter.name),
      complete: subchapter.complete, // ✅ Direct from store
      chapterId: subchapter.id       // ✅ Store chapter ID for lookups
    }))
  }));
}
```

#### Benefits of Direct Store Usage

1. **No Transformation Layer**: Eliminates `generateSectionBItems` complexity
2. **No Fallback Logic**: Waits for store to load instead of using fallbacks
3. **Loading State**: Shows proper loading UI while waiting for store
4. **Real-time Completion**: Uses live completion status from store
5. **Direct Lookups**: Chapter IDs available for `getChapterFromStore()` calls
6. **Simpler Data Flow**: Store → Navigation (no intermediate transformations)
7. **Automatic Updates**: Navigation reflects store changes immediately
8. **Reactive Updates**: Component re-renders when store becomes available

### Enhanced Chapter Title Formatting

The `EFPTextUtils.formatChapterTitle` function has been updated to handle chapter objects and format them based on their type:

```javascript
// Updated function signature
static formatChapterTitle(chapterOrName: any): string

// Usage examples
const parentChapterWithoutNumber = {
  name: 'NUTRIENT APPLICATION',
  order: 6
};
const formattedParent1 = EFPTextUtils.formatChapterTitle(parentChapterWithoutNumber);
// Result: "Chapter 6: Nutrient Application"

const parentChapterWithNumber = {
  name: '2. FARMSTEAD',
  order: 2
};
const formattedParent2 = EFPTextUtils.formatChapterTitle(parentChapterWithNumber);
// Result: "Chapter 2. Farmstead" (no duplication)

const subchapter = {
  name: 'CHAPTER 6 NUTRIENT APPLICATION',
  order: 6.1
};
const formattedSub = EFPTextUtils.formatChapterTitle(subchapter);
// Result: "6.1 Nutrient Application"

// Backward compatibility with strings
const legacyFormatted = EFPTextUtils.formatChapterTitle('CHAPTER 2 BUILDINGS');
// Result: "Chapter 2: Buildings"
```

#### Formatting Rules

1. **Parent Chapters** (order without decimal or ending in .0):
   - **With number in name**: Prepend "Chapter" only
     - Example: `{ name: "2. FARMSTEAD", order: 2 }` → "Chapter 2. Farmstead"
   - **Without number in name**: Prepend "Chapter" + number + ":"
     - Example: `{ name: "NUTRIENT APPLICATION", order: 6 }` → "Chapter 6: Nutrient Application"

2. **Subchapters** (order with decimal):
   - Prepend order number directly
   - Example: `{ name: "BUILDINGS AND ROADS", order: 6.1 }` → "6.1 Buildings And Roads"

3. **String Input** (backward compatibility):
   - Uses legacy formatting logic
   - Handles existing "CHAPTER X" patterns

#### Benefits

- **Consistent Formatting**: All chapter titles follow the same rules
- **Object-Based**: Works directly with chapter objects from store
- **Automatic Prefixing**: No manual string manipulation needed
- **Backward Compatible**: Existing string usage still works
```

## Benefits

1. **Single Source of Truth**: All questionnaire data and responses are centralized in the store
2. **Consistent State Management**: Uses the same pattern as fields store
3. **Real-time Updates**: Changes are immediately reflected across components
4. **Integrated Response Data**: Response data is stored alongside questions for easy access
5. **Automatic Synchronization**: workbookResponseHelper.js automatically updates questionnaire store
6. **Bidirectional Updates**: Changes in either POWERPOD or questionnaire store sync to both
7. **Easy Testing**: Helper functions make it easy to test questionnaire logic
8. **Performance**: Reduces redundant API calls and data processing
9. **Backward Compatibility**: Works with existing POWERPOD response structures

## Migration Notes

- The existing `nestedChapterStructure` property is still supported as a fallback
- Components gradually transition to use the store instead of direct properties
- The store is automatically populated during workbook initialization
- Existing functionality continues to work while new features use the store

## Examples

See `powerpod/src/js/examples/questionnaireStoreUsage.js` for complete working examples of all questionnaire store functionality.

## API Reference

### Helper Functions

- `loadQuestionnaireIntoStore(nestedStructure, forceRefresh, responseData)`: Load data into store
- `loadQuestionnaireWithResponses(nestedStructure, workbookId, forceRefresh)`: Load data with ALL responses
- `refreshQuestionnaireResponses(workbookId)`: Refresh store with latest response data
- `getQuestionnaireFromStore()`: Get questionnaire data from store
- `getChapterFromStore(chapterId)`: Get specific chapter
- `getQuestionFromStore(questionId)`: Get specific question
- `calculateChapterCompletion(chapter)`: Calculate if chapter should be complete based on rules
- `updateQuestionnaireCompletion()`: Update all chapter completion status automatically
- `updateChapterCompletion(chapterId, complete)`: Manually update chapter completion (legacy)
- `updateQuestionResponse(questionId, response, complete, responseData)`: Update question response
- `getQuestionsForChapter(chapterId)`: Get all questions for a chapter
- `getQuestionnaireStats()`: Get completion statistics
- `isQuestionnaireLoaded()`: Check if questionnaire is loaded

### Store Actions

- `setQuestionnaireData({ questionnaire })`: Set entire questionnaire
- `updateQuestionnaireChapter({ chapterId, updateData })`: Update chapter
- `updateQuestionnaireQuestion({ questionId, updateData })`: Update question
