/**
 * URL Navigation Utility
 *
 * Provides robust URL-based navigation for the EFP workbook.
 * Uses stable IDs (GUIDs) for chapters/subchapters and named sections.
 *
 * URL Format:
 * - ?section=my-workbook&chapterId=abc-123-def
 * - ?section=my-workbook&step=my-action-plan
 * - ?section=review-submit
 */

import { Logger } from '../../common/logger.js';
import { EFPStep, EFPSection } from './types.js';
import { EFPNavigationUtils } from './navigation-utils.js';

const logger = Logger('components/efp/url-navigation');

// Section name mappings
const SECTION_NAMES: Record<number, string> = {
  0: 'my-workbook',
  1: 'review-submit',
};

const SECTION_INDICES: Record<string, number> = {
  'my-workbook': 0,
  'review-submit': 1,
};

export interface URLNavigationParams {
  section?: string;
  chapterId?: string;
  subchapterId?: string;
  step?: string; // For named steps like 'my-action-plan'
  stepIndex?: number; // Fallback to numeric index
}

export interface NavigationTarget {
  stepIndex: number;
  sectionIndex: number;
  step: EFPStep;
}

/**
 * Parse current URL for navigation parameters
 */
export function parseNavigationURL(): URLNavigationParams {
  const params = new URLSearchParams(window.location.search);

  const result: URLNavigationParams = {};

  if (params.has('section')) {
    result.section = params.get('section') || undefined;
  }

  if (params.has('chapterId')) {
    result.chapterId = params.get('chapterId') || undefined;
  }

  if (params.has('subchapterId')) {
    result.subchapterId = params.get('subchapterId') || undefined;
  }

  if (params.has('step')) {
    result.step = params.get('step') || undefined;
  }

  if (params.has('stepIndex')) {
    const idx = parseInt(params.get('stepIndex') || '', 10);
    if (!isNaN(idx)) {
      result.stepIndex = idx;
    }
  }

  logger.info({
    fn: 'parseNavigationURL',
    message: 'Parsed URL navigation params',
    data: result,
  });

  return result;
}

/**
 * Convert a label to a URL-safe slug
 */
export function labelToSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Update the URL with current navigation state
 * Uses replaceState by default, pushState if addToHistory is true
 */
export function updateNavigationURL(
  stepIndex: number,
  sectionIndex: number,
  flatSteps: EFPStep[],
  addToHistory: boolean = true
): void {
  const step = flatSteps[stepIndex];
  if (!step) {
    logger.warn({
      fn: 'updateNavigationURL',
      message: 'Cannot update URL - step not found',
      data: { stepIndex },
    });
    return;
  }

  const url = new URL(window.location.href);

  // Preserve existing params (like 'id' for workbook)
  const sectionName = SECTION_NAMES[sectionIndex] || 'my-workbook';
  url.searchParams.set('section', sectionName);

  // Clear old navigation params
  url.searchParams.delete('chapterId');
  url.searchParams.delete('subchapterId');
  url.searchParams.delete('step');
  url.searchParams.delete('stepIndex');

  // Set the most specific identifier available
  if (step.subchapterData?.id) {
    url.searchParams.set('subchapterId', step.subchapterData.id);
  } else if (step.chapterId) {
    url.searchParams.set('chapterId', step.chapterId);
  } else if (step.chapterData?.id) {
    url.searchParams.set('chapterId', step.chapterData.id);
  } else {
    // Use slug for steps without IDs (like My Action Plan)
    url.searchParams.set('step', labelToSlug(step.label));
  }

  const newUrl = url.toString();

  if (addToHistory) {
    window.history.pushState({ stepIndex, sectionIndex }, '', newUrl);
  } else {
    window.history.replaceState({ stepIndex, sectionIndex }, '', newUrl);
  }

  logger.info({
    fn: 'updateNavigationURL',
    message: 'Updated URL',
    data: { stepIndex, sectionIndex, stepLabel: step.label, newUrl },
  });
}

/**
 * Resolve URL params to a navigation target
 * Uses fallback chain: chapterId → subchapterId → step slug → stepIndex
 */
export function resolveNavigationFromURL(
  params: URLNavigationParams,
  flatSteps: EFPStep[],
  sections: EFPSection[],
  canAccessReviewAndSubmit: () => boolean
): NavigationTarget | null {
  // If no navigation params, return null (use default)
  if (!params.section && !params.chapterId && !params.subchapterId && !params.step && params.stepIndex === undefined) {
    return null;
  }

  // Resolve section index
  let targetSectionIndex = 0;
  if (params.section) {
    targetSectionIndex = SECTION_INDICES[params.section] ?? 0;
  }

  // Check if trying to access Review & Submit when not allowed
  if (targetSectionIndex === 1 && !canAccessReviewAndSubmit()) {
    logger.warn({
      fn: 'resolveNavigationFromURL',
      message: 'Cannot navigate to Review & Submit - questionnaire incomplete',
    });
    return null;
  }

  // Try to find step by subchapterId first (most specific)
  if (params.subchapterId) {
    const stepIndex = flatSteps.findIndex(
      (s) => s.subchapterData?.id === params.subchapterId
    );
    if (stepIndex !== -1) {
      const step = flatSteps[stepIndex];
      logger.info({
        fn: 'resolveNavigationFromURL',
        message: 'Found step by subchapterId',
        data: { subchapterId: params.subchapterId, stepIndex, label: step.label },
      });
      return { stepIndex, sectionIndex: step.sectionIndex, step };
    }
  }

  // Try to find step by chapterId
  if (params.chapterId) {
    // First try to find a subchapter/step with this chapter ID
    let stepIndex = flatSteps.findIndex(
      (s) => s.chapterId === params.chapterId || s.chapterData?.id === params.chapterId
    );

    if (stepIndex !== -1) {
      const step = flatSteps[stepIndex];
      // If it's a container, find the first selectable step
      if (step.isContainer) {
        const nextSelectable = EFPNavigationUtils.findNextSelectableStep(stepIndex, flatSteps, sections);
        if (nextSelectable !== null) {
          stepIndex = nextSelectable;
        }
      }
      const targetStep = flatSteps[stepIndex];
      logger.info({
        fn: 'resolveNavigationFromURL',
        message: 'Found step by chapterId',
        data: { chapterId: params.chapterId, stepIndex, label: targetStep.label },
      });
      return { stepIndex, sectionIndex: targetStep.sectionIndex, step: targetStep };
    }
  }

  // Try to find step by slug
  if (params.step) {
    const stepIndex = flatSteps.findIndex(
      (s) => labelToSlug(s.label) === params.step
    );
    if (stepIndex !== -1) {
      const step = flatSteps[stepIndex];
      logger.info({
        fn: 'resolveNavigationFromURL',
        message: 'Found step by slug',
        data: { slug: params.step, stepIndex, label: step.label },
      });
      return { stepIndex, sectionIndex: step.sectionIndex, step };
    }
  }

  // Fallback to stepIndex
  if (params.stepIndex !== undefined && params.stepIndex >= 0 && params.stepIndex < flatSteps.length) {
    const step = flatSteps[params.stepIndex];
    logger.info({
      fn: 'resolveNavigationFromURL',
      message: 'Using stepIndex fallback',
      data: { stepIndex: params.stepIndex, label: step.label },
    });
    return { stepIndex: params.stepIndex, sectionIndex: step.sectionIndex, step };
  }

  // If only section is specified, navigate to first step in that section
  if (params.section && targetSectionIndex >= 0) {
    const target = EFPNavigationUtils.navigateToSection(targetSectionIndex, flatSteps, sections);
    if (target) {
      const step = flatSteps[target.stepIndex];
      logger.info({
        fn: 'resolveNavigationFromURL',
        message: 'Navigating to first step in section',
        data: { section: params.section, stepIndex: target.stepIndex, label: step.label },
      });
      return { stepIndex: target.stepIndex, sectionIndex: target.sectionIndex, step };
    }
  }

  logger.warn({
    fn: 'resolveNavigationFromURL',
    message: 'Could not resolve navigation from URL params',
    data: params,
  });

  return null;
}

/**
 * Check if URL has navigation params
 */
export function hasNavigationParams(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has('section') || params.has('chapterId') ||
         params.has('subchapterId') || params.has('step') ||
         params.has('stepIndex');
}

/**
 * Clear navigation params from URL (preserves other params like 'id')
 */
export function clearNavigationParams(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('section');
  url.searchParams.delete('chapterId');
  url.searchParams.delete('subchapterId');
  url.searchParams.delete('step');
  url.searchParams.delete('stepIndex');

  window.history.replaceState({}, '', url.toString());
}

