import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';
import '@shoelace-style/shoelace/dist/components/menu/menu.js';
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import { LitElement } from 'lit';
export interface DropdownOption {
    value: string;
    label: string;
}
declare class SearchableDropdown extends LitElement {
    searchInput: any;
    dropdown: any;
    id: string;
    required: boolean;
    options: DropdownOption[];
    selectedValue: string;
    fieldLabel: string;
    placeholder: string;
    errorMessage: string;
    disabled: boolean;
    readOnly: boolean;
    clearable: boolean;
    helpText: string;
    private filteredOptions;
    private searchTerm;
    private isOpen;
    private isClearing;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    updated(changedProperties: Map<string, any>): void;
    private handleSearchInput;
    private handleSelect;
    private handleClear;
    private handleDropdownShow;
    private handleDropdownHide;
    emitEvent(): void;
    firstUpdated(): void;
    render(): import("lit-html").TemplateResult<1>;
}
export default SearchableDropdown;
