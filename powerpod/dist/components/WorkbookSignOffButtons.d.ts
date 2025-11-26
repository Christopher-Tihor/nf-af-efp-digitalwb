import { LitElement } from 'lit';
export declare class WorkbookSignOffButtons extends LitElement {
    private paSigned;
    private producerSigned;
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
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'workbook-sign-off-buttons': WorkbookSignOffButtons;
    }
}
