import shoelace from '../../assets/css/shoelace.css';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js';
import '@shoelace-style/shoelace/dist/components/menu/menu.js';
import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import { LitElement, css, html, unsafeCSS } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';

export interface DropdownOption {
  value: string;
  label: string;
}

@customElement('searchable-dropdown')
class SearchableDropdown extends LitElement {
  @query('#searchInput') searchInput: any;
  @query('#dropdown') dropdown: any;
  @property({ type: String, reflect: true }) id: string = crypto.randomUUID();
  @property({ type: Boolean }) required: boolean = false;
  @property({ type: Array }) options: DropdownOption[] = [];
  @property({ type: String }) selectedValue: string = '';
  @property({ type: String }) fieldLabel: string = '';
  @property({ type: String }) placeholder: string = 'Select an option';
  @property({ type: String }) errorMessage: string = '';
  @property({ type: Boolean }) disabled: boolean = false;
  @property({ type: Boolean }) readOnly: boolean = false;
  @property({ type: Boolean }) clearable: boolean = true;
  @property({ type: String }) helpText: string = '';
  @state() private filteredOptions: DropdownOption[] = [];
  @state() private searchTerm: string = '';
  @state() private isOpen: boolean = false;
  @state() private isClearing: boolean = false;

  static styles = css`
    sl-input::part(base) {
      font-size: 15px;
    }
    sl-input::part(input) {
      font-size: 15px;
      cursor: pointer;
    }
    sl-input::part(suffix) {
      pointer-events: none;
    }
    sl-input {
      --sl-input-height-large: 42px;
    }
    sl-menu-item::part(base) {
      font-size: 15px;
    }
    sl-menu-item::part(label) {
      font-size: 15px;
    }
    sl-menu-item::part(checked-icon) {
      display: flex;
    }
    #errorMessage {
      margin: 0px;
      font-size: 13px;
      color: #e23636;
      padding: 0px;
      position: absolute;
    }
    .field-container {
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .label-text {
      margin-bottom: 4px;
    }
    .required-asterisk {
      color: red;
    }
    .help-text {
      font-size: 13px;
      color: #666;
      margin-top: 4px;
    }
    .dropdown-container {
      position: relative;
    }
    sl-dropdown {
      width: 100%;
      display: block;
    }
    sl-dropdown::part(panel) {
      width: var(--auto-size-available-width);
      min-width: fit-content;
    }
    sl-menu {
      min-width: 100%;
      box-sizing: border-box;
    }
    sl-menu-item {
      white-space: nowrap;
    }
    .no-results {
      padding: var(--sl-spacing-medium);
      text-align: center;
      color: var(--sl-color-neutral-500);
      font-size: var(--sl-font-size-medium);
    }
    .chevron-icon {
      color: var(--sl-input-icon-color);
      transition: var(--sl-transition-medium) transform ease;
      pointer-events: none;
    }
    .chevron-icon.open {
      transform: rotate(-180deg);
    }
    ${unsafeCSS(shoelace)}
  `;

  connectedCallback() {
    super.connectedCallback();
    this.filteredOptions = [...this.options];
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('options')) {
      this.filteredOptions = [...this.options];
    }
  }

  private handleSearchInput(event: Event) {
    const input = event.target as any;
    this.searchTerm = input.value || '';

    if (!this.searchTerm) {
      this.filteredOptions = [...this.options];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredOptions = this.options.filter(option =>
        option.label.toLowerCase().includes(searchLower) ||
        option.value.toLowerCase().includes(searchLower)
      );
    }

    // Ensure dropdown stays open when typing, but not when clearing
    if (!this.isOpen && this.dropdown && !this.isClearing) {
      this.dropdown.show();
    }
  }

  private handleSelect(option: DropdownOption) {
    this.selectedValue = option.value;
    this.searchTerm = option.label;
    if (this.searchInput) {
      this.searchInput.value = option.label;
    }
    this.filteredOptions = [...this.options];
    this.emitEvent();

    // Close dropdown after selection
    if (this.dropdown) {
      this.dropdown.hide();
    }
  }

  private handleClear() {
    this.isClearing = true;
    this.selectedValue = '';
    this.searchTerm = '';
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    this.filteredOptions = [...this.options];
    this.emitEvent();

    // Ensure dropdown is closed
    if (this.dropdown) {
      this.dropdown.hide();
    }

    // Reset the clearing flag after a short delay
    setTimeout(() => {
      this.isClearing = false;
    }, 100);
  }

  private handleDropdownShow() {
    this.isOpen = true;
  }

  private handleDropdownHide() {
    this.isOpen = false;
    // Restore the selected value's label if user didn't select anything
    if (this.selectedValue && this.searchInput) {
      const selectedOption = this.options.find(opt => opt.value === this.selectedValue);
      if (selectedOption) {
        this.searchInput.value = selectedOption.label;
        this.searchTerm = selectedOption.label;
      }
    } else if (!this.selectedValue && this.searchInput) {
      this.searchInput.value = '';
      this.searchTerm = '';
    }
    this.filteredOptions = [...this.options];
  }

  emitEvent() {
    const selectedOption = this.options.find(opt => opt.value === this.selectedValue);
    const customEvent = new CustomEvent('onChangeSearchableDropdown', {
      detail: {
        id: this.id,
        message: 'Searchable dropdown value has changed',
        value: this.selectedValue,
        selectedOption: selectedOption,
        errorMessage: this.errorMessage,
      },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(customEvent);
  }

  firstUpdated() {
    // Set initial display value
    if (this.selectedValue && this.searchInput) {
      const selectedOption = this.options.find(opt => opt.value === this.selectedValue);
      if (selectedOption) {
        this.searchInput.value = selectedOption.label;
        this.searchTerm = selectedOption.label;
      }
    }
  }

  render() {
    const selectedOption = this.options.find(opt => opt.value === this.selectedValue);
    const displayValue = selectedOption ? selectedOption.label : '';

    return html`
      <div class="field-container">
        ${this.fieldLabel
          ? html`
              <div class="label-text">
                <span>
                  ${this.fieldLabel}
                  ${this.required
                    ? html`<span class="required-asterisk">*</span>`
                    : ''}
                </span>
              </div>
            `
          : ''}

        <div class="dropdown-container">
          <sl-dropdown
            id="dropdown"
            hoist
            sync="width"
            distance="4"
            @sl-show=${this.handleDropdownShow}
            @sl-hide=${this.handleDropdownHide}
          >
            <sl-input
              id="searchInput"
              slot="trigger"
              size="large"
              .value=${displayValue}
              .placeholder=${this.placeholder}
              ?disabled=${this.disabled || this.readOnly}
              ?clearable=${this.clearable && !!this.selectedValue}
              @sl-input=${this.handleSearchInput}
              @sl-clear=${this.handleClear}
            >
              <sl-icon
                name="chevron-down"
                slot="suffix"
                class="chevron-icon ${this.isOpen ? 'open' : ''}"
              ></sl-icon>
            </sl-input>

            <sl-menu style="max-height: 400px; overflow: auto;">
              ${this.filteredOptions.length > 0
                ? this.filteredOptions.map(
                    option => html`
                      <sl-menu-item
                        type="checkbox"
                        @click=${() => this.handleSelect(option)}
                        ?checked=${this.selectedValue === option.value}
                      >
                        ${option.label}
                      </sl-menu-item>
                    `
                  )
                : html`<div class="no-results">No results found</div>`}
            </sl-menu>
          </sl-dropdown>
        </div>

        ${this.errorMessage
          ? html`<p id="errorMessage" class="error-message">${this.errorMessage}</p>`
          : ''}

        ${this.helpText
          ? html`<div class="help-text">${this.helpText}</div>`
          : ''}
      </div>
    `;
  }
}

export default SearchableDropdown;

