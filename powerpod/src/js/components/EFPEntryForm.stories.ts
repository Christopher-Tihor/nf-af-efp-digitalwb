import type { Meta, StoryObj } from '@storybook/web-components';
import './EFPEntryForm.ts';

import { html } from 'lit';
import { useArgs } from '@storybook/client-api';

const meta: Meta = {
  component: 'efp-entry-form',
};

export default meta;
type Story = StoryObj;

export const Primary: Story = {
  args: {
    // selectedValue: 'Other Costs',
  },
  render: function Render(args) {
    const [{}, updateArgs] = useArgs();
    return html`<efp-entry-form></efp-entry-form>`;
  },
};
