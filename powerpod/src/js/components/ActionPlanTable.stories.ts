import type { Meta, StoryObj } from '@storybook/web-components';
import './ActionPlanTable.ts';
import { html } from 'lit';

const meta: Meta = {
  component: 'action-plan-table',
  title: 'Components/ActionPlanTable',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Primary: Story = {
  render: () => html`<action-plan-table></action-plan-table>`,
};

