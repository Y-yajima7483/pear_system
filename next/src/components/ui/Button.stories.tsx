import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'alert', 'success', 'warning', 'info', 'pear', 'border'],
    },
    type: {
      control: 'select',
      options: ['button', 'submit'],
    },
    outline: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    children: 'ボタン',
    type: 'button',
    color: 'primary',
    outline: false,
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { color: 'primary', children: 'Primary' },
};

export const Alert: Story = {
  args: { color: 'alert', children: 'Alert' },
};

export const Success: Story = {
  args: { color: 'success', children: 'Success' },
};

export const Warning: Story = {
  args: { color: 'warning', children: 'Warning' },
};

export const Info: Story = {
  args: { color: 'info', children: 'Info' },
};

export const Pear: Story = {
  args: { color: 'pear', children: 'Pear' },
};

export const Border: Story = {
  args: { color: 'border', children: 'Border' },
};

export const Outline: Story = {
  args: { color: 'primary', outline: true, children: 'Outline' },
};

export const Disabled: Story = {
  args: { color: 'primary', disabled: true, children: 'Disabled' },
};

export const OutlineDisabled: Story = {
  args: { color: 'primary', outline: true, disabled: true, children: 'Outline Disabled' },
};
