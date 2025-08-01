import { LitElement } from 'lit';
interface EFPStep {
    label: string;
    content: string;
    sectionIndex: number;
}
interface EFPSection {
    tab: string;
    title: string;
    items: EFPSectionItem[];
}
interface EFPSectionItem {
    label: string;
    title?: string;
    content?: string;
    complete?: boolean;
    items?: EFPSectionItem[];
}
export declare class EFPBreadcrumbs extends LitElement {
    currentStep: EFPStep | null;
    currentSection: EFPSection | null;
    currentSectionIndex: number;
    currentStepIndex: number;
    flatSteps: EFPStep[];
    sections: EFPSection[];
    static styles: import("lit").CSSResult;
    private buildStepHierarchy;
    private findParentContainer;
    private findStepByPattern;
    private isItemInNestedContainer;
    private generateBreadcrumbs;
    private dispatchNavigationEvent;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'efp-breadcrumbs': EFPBreadcrumbs;
    }
}
export {};
