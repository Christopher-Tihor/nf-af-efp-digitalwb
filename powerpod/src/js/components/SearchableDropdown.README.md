# SearchableDropdown Component

A Lit-based web component that provides a searchable dropdown (autocomplete) with limited options using Shoelace components.

## Features

- **Search functionality**: Type in the input field to filter through available options in real-time
- **Limited options**: Displays a predefined set of options (not infinite scroll)
- **Clearable**: Optional ability to clear the selection with a clear button
- **Validation support**: Built-in error message display
- **Accessibility**: Built on Shoelace components with ARIA support
- **Customizable**: Multiple configuration options for labels, placeholders, help text, etc.
- **Dropdown positioning**: Uses Shoelace's `hoist` attribute to prevent dropdown from being cut off

## Installation

The component is already integrated into the project. Simply import it:

```typescript
import './SearchableDropdown.ts';
```

## Usage

### Basic Example

```html
<searchable-dropdown
  .options=${[
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' }
  ]}
  .selectedValue=${'apple'}
  fieldLabel="Select a Fruit"
  placeholder="Search or select..."
  @onChangeSearchableDropdown=${handleChange}
></searchable-dropdown>
```

### JavaScript/TypeScript

```typescript
import { DropdownOption } from './SearchableDropdown.ts';

const options: DropdownOption[] = [
  { value: 'opt1', label: 'Option 1' },
  { value: 'opt2', label: 'Option 2' },
  { value: 'opt3', label: 'Option 3' }
];

const handleChange = (e: CustomEvent) => {
  console.log('Selected value:', e.detail.value);
  console.log('Selected option:', e.detail.selectedOption);
};
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `id` | `string` | `crypto.randomUUID()` | Unique identifier for the component |
| `options` | `DropdownOption[]` | `[]` | Array of options to display |
| `selectedValue` | `string` | `''` | Currently selected value |
| `fieldLabel` | `string` | `''` | Label text displayed above the dropdown |
| `placeholder` | `string` | `'Select an option'` | Placeholder text when no option is selected |
| `errorMessage` | `string` | `''` | Error message to display below the field |
| `helpText` | `string` | `''` | Help text displayed below the field |
| `required` | `boolean` | `false` | Whether the field is required (shows asterisk) |
| `disabled` | `boolean` | `false` | Whether the dropdown is disabled |
| `readOnly` | `boolean` | `false` | Whether the dropdown is read-only |
| `clearable` | `boolean` | `true` | Whether the selection can be cleared |

## Events

### `onChangeSearchableDropdown`

Fired when the selected value changes.

**Event Detail:**
```typescript
{
  id: string;                    // Component ID
  message: string;               // Event message
  value: string;                 // Selected value
  selectedOption: DropdownOption | undefined; // Full selected option object
  errorMessage: string;          // Current error message
}
```

## DropdownOption Interface

```typescript
interface DropdownOption {
  value: string;  // The value to be used when the option is selected
  label: string;  // The display text for the option
}
```

## Examples in Storybook

The component includes several Storybook stories demonstrating different use cases:

1. **Primary** - Basic usage with search functionality
2. **WithPreselectedValue** - Dropdown with a pre-selected value
3. **Required** - Required field with asterisk indicator
4. **WithError** - Field displaying an error message
5. **WithHelpText** - Field with help text below
6. **Disabled** - Disabled state
7. **ReadOnly** - Read-only state
8. **NotClearable** - Without the clear button

## Styling

The component uses Shoelace's theming system. You can customize the appearance using CSS custom properties or by targeting the component's shadow parts.

## Browser Support

Supports all modern browsers that support Web Components and ES6+.

## Implementation Details

The component uses:
- **sl-input**: For the searchable text input field
- **sl-dropdown**: For the dropdown container with `hoist` attribute to prevent clipping
- **sl-menu** and **sl-menu-item**: For the options list
- **sl-icon**: For the dropdown chevron indicator

## Notes

- The search is case-insensitive and matches both the label and value
- Options are filtered in real-time as you type
- When you click away or blur the input, it restores the selected option's label
- The dropdown opens automatically when you focus on the input or start typing
- The component properly handles keyboard navigation through Shoelace's built-in accessibility features

