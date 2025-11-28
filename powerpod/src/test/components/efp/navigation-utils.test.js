import { EFPNavigationUtils } from '../../../js/components/efp/navigation-utils.ts';

// Build a sample sections structure with containers and leaf items
const buildSections = () => ([
  {
    tab: 'My Workbook',
    title: 'Environmental Farm Plan Questionnaire',
    items: [
      {
        label: 'Chapter 1',
        title: 'Chapter 1',
        isContainer: true,
        items: [
          { label: 'Sub 1.1', content: 'content 1.1' },
          { label: 'Sub 1.2', content: 'content 1.2' },
        ],
      },
      { label: 'Standalone', content: 'standalone content' },
    ],
  },
  {
    tab: 'Review & Submit',
    title: 'Declaration & Consent',
    items: [
      {
        label: 'Chapter 2',
        title: 'Chapter 2',
        isContainer: true,
        items: [
          { label: 'Sub 2.1', content: 'content 2.1' },
        ],
      },
    ],
  },
]);

const getLabels = (steps) => steps.map(s => s.label);

describe('EFPNavigationUtils - flattening and navigation', () => {
  test('getFlatStepsFromSections flattens with section headers and containers', () => {
    const sections = buildSections();
    const flat = EFPNavigationUtils.getFlatStepsFromSections(sections);
    const labels = getLabels(flat);

    expect(labels).toEqual([
      'My Workbook', // section header
      'Chapter 1', // container
      'Sub 1.1',
      'Sub 1.2',
      'Standalone',
      'Review & Submit', // section header
      'Chapter 2', // container
      'Sub 2.1',
    ]);

    // containers should be marked via isStepContainer check
    expect(EFPNavigationUtils.isStepContainer(flat[1], sections)).toBe(true); // 'Chapter 1'
    expect(EFPNavigationUtils.isStepContainer(flat[6], sections)).toBe(true); // 'Chapter 2'
  });

  test('findNextSelectableStep skips containers and section headers', () => {
    const sections = buildSections();
    const flat = EFPNavigationUtils.getFlatStepsFromSections(sections);

    const indexOfChapter1 = flat.findIndex(s => s.label === 'Chapter 1');
    const nextFromChapter1 = EFPNavigationUtils.findNextSelectableStep(indexOfChapter1, flat, sections);
    expect(flat[nextFromChapter1].label).toBe('Sub 1.1');

    const indexOfSub12 = flat.findIndex(s => s.label === 'Sub 1.2');
    const nextFromSub12 = EFPNavigationUtils.findNextSelectableStep(indexOfSub12, flat, sections);
    expect(flat[nextFromSub12].label).toBe('Standalone');

    const indexOfStandalone = flat.findIndex(s => s.label === 'Standalone');
    const nextFromStandalone = EFPNavigationUtils.findNextSelectableStep(indexOfStandalone, flat, sections);
    expect(flat[nextFromStandalone].label).toBe('Sub 2.1'); // skips 'Review & Submit' and 'Chapter 2'
  });

  test('findPreviousSelectableStep skips containers and section headers', () => {
    const sections = buildSections();
    const flat = EFPNavigationUtils.getFlatStepsFromSections(sections);

    const indexOfSub21 = flat.findIndex(s => s.label === 'Sub 2.1');
    const prevFromSub21 = EFPNavigationUtils.findPreviousSelectableStep(indexOfSub21, flat, sections);
    expect(flat[prevFromSub21].label).toBe('Standalone');

    const indexOfSub11 = flat.findIndex(s => s.label === 'Sub 1.1');
    const prevFromSub11 = EFPNavigationUtils.findPreviousSelectableStep(indexOfSub11, flat, sections);
    expect(flat[prevFromSub11].label).toBe('Standalone'); // previous selectable before Sub 1.1 is Standalone
  });

  test('navigateToSection picks first selectable step in section', () => {
    const sections = buildSections();
    const flat = EFPNavigationUtils.getFlatStepsFromSections(sections);

    const targetB = EFPNavigationUtils.navigateToSection(0, flat, sections);
    expect(flat[targetB.stepIndex].label).toBe('Sub 1.1');
    expect(targetB.sectionIndex).toBe(0);

    const targetC = EFPNavigationUtils.navigateToSection(1, flat, sections);
    expect(flat[targetC.stepIndex].label).toBe('Sub 2.1');
    expect(targetC.sectionIndex).toBe(1);
  });

  test('next/previous return null at boundaries', () => {
    const sections = buildSections();
    const flat = EFPNavigationUtils.getFlatStepsFromSections(sections);

    const firstSelectable = EFPNavigationUtils.findNextSelectableStep(-1, flat, sections);
    expect(firstSelectable).toBeGreaterThanOrEqual(0);

    const lastIndex = flat.length - 1;
    const lastSelectable = (() => {
      for (let i = lastIndex; i >= 0; i--) {
        if (!EFPNavigationUtils.isStepContainer(flat[i], sections) && !flat[i].label.startsWith('Section ')) return i;
      }
      return -1;
    })();

    expect(EFPNavigationUtils.findNextSelectableStep(lastSelectable, flat, sections)).toBeNull();
    expect(EFPNavigationUtils.findPreviousSelectableStep(0, flat, sections)).toBeNull();
  });
});

