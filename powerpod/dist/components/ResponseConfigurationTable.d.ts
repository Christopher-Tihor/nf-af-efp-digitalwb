import { LitElement } from 'lit';
export interface ResponseConfiguration {
    id: string;
    name: string;
    responseLabel: {
        value: number;
        formatted: string;
    };
    color: {
        value: number;
        formatted: string;
    };
    description: string;
}
export declare class ResponseConfigurationTable extends LitElement {
    configurations: ResponseConfiguration[];
    questionId: string;
    static styles: import("lit").CSSResult;
    private getColorClass;
    render(): import("lit-html").TemplateResult<1>;
}
declare global {
    interface HTMLElementTagNameMap {
        'response-configuration-table': ResponseConfigurationTable;
    }
}
