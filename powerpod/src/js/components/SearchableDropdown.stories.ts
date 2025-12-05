import type { Meta, StoryObj } from '@storybook/web-components';
import './SearchableDropdown.ts';
import { html } from 'lit';
import { useArgs } from '@storybook/client-api';
import { action } from '@storybook/addon-actions';

const meta: Meta = {
  component: 'searchable-dropdown',
  title: 'Components/SearchableDropdown',
  tags: ['autodocs'],
  argTypes: {
    selectedValue: { control: 'text' },
    fieldLabel: { control: 'text' },
    placeholder: { control: 'text' },
    errorMessage: { control: 'text' },
    helpText: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    clearable: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj;

const sampleOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
  { value: 'honeydew', label: 'Honeydew' },
  { value: 'kiwi', label: 'Kiwi' },
  { value: 'lemon', label: 'Lemon' },
  { value: 'mango', label: 'Mango' },
  { value: 'orange', label: 'Orange' },
  { value: 'papaya', label: 'Papaya' },
  { value: 'quince', label: 'Quince' },
  { value: 'raspberry', label: 'Raspberry' },
  { value: 'strawberry', label: 'Strawberry' },
  { value: 'tangerine', label: 'Tangerine' },
  { value: 'watermelon', label: 'Watermelon' },
];

export const Primary: Story = {
  args: {
    options: sampleOptions,
    selectedValue: '',
    fieldLabel: 'Select a Fruit',
    placeholder: 'Search or select...',
    clearable: true,
  },
  render: function Render(args) {
    const [{ options, selectedValue }, updateArgs] = useArgs();
    return html`
      <searchable-dropdown
        .options=${options}
        .selectedValue=${selectedValue}
        .fieldLabel=${args.fieldLabel}
        .placeholder=${args.placeholder}
        .clearable=${args.clearable}
        @onChangeSearchableDropdown=${(e: CustomEvent) => {
          action('onChangeSearchableDropdown')(e);
          updateArgs({ selectedValue: e.detail.value });
        }}
      ></searchable-dropdown>
    `;
  },
};

export const WithPreselectedValue: Story = {
  args: {
    options: sampleOptions,
    selectedValue: 'mango',
    fieldLabel: 'Favorite Fruit',
    placeholder: 'Search or select...',
  },
  render: function Render(args) {
    const [{ options, selectedValue }, updateArgs] = useArgs();
    return html`
      <searchable-dropdown
        .options=${options}
        .selectedValue=${selectedValue}
        .fieldLabel=${args.fieldLabel}
        .placeholder=${args.placeholder}
        @onChangeSearchableDropdown=${(e: CustomEvent) => {
          action('onChangeSearchableDropdown')(e);
          updateArgs({ selectedValue: e.detail.value });
        }}
      ></searchable-dropdown>
    `;
  },
};

export const Required: Story = {
  args: {
    options: sampleOptions,
    selectedValue: '',
    fieldLabel: 'Required Field',
    placeholder: 'Search or select...',
    required: true,
  },
  render: function Render(args) {
    const [{ options, selectedValue }, updateArgs] = useArgs();
    return html`
      <searchable-dropdown
        .options=${options}
        .selectedValue=${selectedValue}
        .fieldLabel=${args.fieldLabel}
        .placeholder=${args.placeholder}
        .required=${args.required}
        @onChangeSearchableDropdown=${(e: CustomEvent) => {
          action('onChangeSearchableDropdown')(e);
          updateArgs({ selectedValue: e.detail.value });
        }}
      ></searchable-dropdown>
    `;
  },
};

export const WithError: Story = {
  args: {
    options: sampleOptions,
    selectedValue: '',
    fieldLabel: 'Select a Fruit',
    placeholder: 'Search or select...',
    errorMessage: 'This field is required',
    required: true,
  },
  render: function Render(args) {
    const [{ options, selectedValue }, updateArgs] = useArgs();
    return html`
      <searchable-dropdown
        .options=${options}
        .selectedValue=${selectedValue}
        .fieldLabel=${args.fieldLabel}
        .placeholder=${args.placeholder}
        .errorMessage=${args.errorMessage}
        .required=${args.required}
        @onChangeSearchableDropdown=${(e: CustomEvent) => {
          action('onChangeSearchableDropdown')(e);
          updateArgs({ selectedValue: e.detail.value });
        }}
      ></searchable-dropdown>
    `;
  },
};

export const WithHelpText: Story = {
  args: {
    options: sampleOptions,
    selectedValue: '',
    fieldLabel: 'Select a Fruit',
    placeholder: 'Search or select...',
    helpText: 'Type to search through the available options',
  },
  render: function Render(args) {
    const [{ options, selectedValue }, updateArgs] = useArgs();
    return html`
      <searchable-dropdown
        .options=${options}
        .selectedValue=${selectedValue}
        .fieldLabel=${args.fieldLabel}
        .placeholder=${args.placeholder}
        .helpText=${args.helpText}
        @onChangeSearchableDropdown=${(e: CustomEvent) => {
          action('onChangeSearchableDropdown')(e);
          updateArgs({ selectedValue: e.detail.value });
        }}
      ></searchable-dropdown>
    `;
  },
};

export const Disabled: Story = {
  args: {
    options: sampleOptions,
    selectedValue: 'apple',
    fieldLabel: 'Disabled Field',
    placeholder: 'Search or select...',
    disabled: true,
  },
  render: function Render(args) {
    const [{ options, selectedValue }, updateArgs] = useArgs();
    return html`
      <searchable-dropdown
        .options=${options}
        .selectedValue=${selectedValue}
        .fieldLabel=${args.fieldLabel}
        .placeholder=${args.placeholder}
        .disabled=${args.disabled}
        @onChangeSearchableDropdown=${(e: CustomEvent) => {
          action('onChangeSearchableDropdown')(e);
          updateArgs({ selectedValue: e.detail.value });
        }}
      ></searchable-dropdown>
    `;
  },
};

export const ReadOnly: Story = {
  args: {
    options: sampleOptions,
    selectedValue: 'banana',
    fieldLabel: 'Read Only Field',
    placeholder: 'Search or select...',
    readOnly: true,
  },
  render: function Render(args) {
    const [{ options, selectedValue }, updateArgs] = useArgs();
    return html`
      <searchable-dropdown
        .options=${options}
        .selectedValue=${selectedValue}
        .fieldLabel=${args.fieldLabel}
        .placeholder=${args.placeholder}
        .readOnly=${args.readOnly}
        @onChangeSearchableDropdown=${(e: CustomEvent) => {
          action('onChangeSearchableDropdown')(e);
          updateArgs({ selectedValue: e.detail.value });
        }}
      ></searchable-dropdown>
    `;
  },
};

export const NotClearable: Story = {
  args: {
    options: sampleOptions,
    selectedValue: 'cherry',
    fieldLabel: 'Not Clearable',
    placeholder: 'Search or select...',
    clearable: false,
  },
  render: function Render(args) {
    const [{ options, selectedValue }, updateArgs] = useArgs();
    return html`
      <searchable-dropdown
        .options=${options}
        .selectedValue=${selectedValue}
        .fieldLabel=${args.fieldLabel}
        .placeholder=${args.placeholder}
        .clearable=${args.clearable}
        @onChangeSearchableDropdown=${(e: CustomEvent) => {
          action('onChangeSearchableDropdown')(e);
          updateArgs({ selectedValue: e.detail.value });
        }}
      ></searchable-dropdown>
    `;
  },
};

