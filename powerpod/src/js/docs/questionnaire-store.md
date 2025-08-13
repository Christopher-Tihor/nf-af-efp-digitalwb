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
}
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
