import { LitElement } from 'lit';
export declare class WorkbookSignOffButtons extends LitElement {
    private paSignOffDate;
    private producerSignOffDate;
    private isLoading;
    private showPAButton;
    private showProducerButton;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    private checkUserRoles;
    private loadSignOffData;
    private handlePASignOff;
    private handleProducerSignOff;
    private handleSignOff;
    private formatDate;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'workbook-sign-off-buttons': WorkbookSignOffButtons;
    }
}
