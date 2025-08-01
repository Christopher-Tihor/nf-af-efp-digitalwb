// Type definitions for EFP Entry Form components

export interface EFPStep {
  label: string;
  content: string;
  complete?: boolean;
  sectionIndex: number;
  chapterData?: any;
  subchapterData?: any;
  isContainer?: boolean;
}

export interface EFPSection {
  tab: string;
  title: string;
  items: EFPSectionItem[];
}

export interface EFPSectionItem {
  label: string;
  content?: string;
  complete?: boolean;
  items?: EFPSectionItem[];
  title?: string;
  isContainer?: boolean;
  chapterData?: any;
  subchapterData?: any;
}

export interface EFPActiveContent {
  title: string;
  content: string;
}

export interface EFPNavigationState {
  currentSectionIndex: number;
  currentStepIndex: number;
  isNavigating: boolean;
}

export interface EFPSelectableStep {
  step: EFPStep;
  index: number;
}

export interface EFPChapterData {
  name: string;
  description?: string;
  questions?: any[];
  subchapters?: any[];
}

export interface EFPQuestion {
  id: string;
  text: string;
  type: string;
  options?: string[];
  required?: boolean;
}
