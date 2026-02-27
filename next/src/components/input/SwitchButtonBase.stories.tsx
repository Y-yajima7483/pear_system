import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import SwitchButtonBase from './SwitchButtonBase';

const meta = {
  title: 'Input/SwitchButtonBase',
  component: SwitchButtonBase,
  tags: ['autodocs'],
  args: {
    name: 'example',
    label: 'スイッチ',
  },
} satisfies Meta<typeof SwitchButtonBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(false);
    return (
      <SwitchButtonBase
        {...args}
        checked={checked}
        onChange={(v) => setChecked(v)}
      />
    );
  },
  args: {
    label: '通知を有効にする',
  },
};

export const CheckedByDefault: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(true);
    return (
      <SwitchButtonBase
        {...args}
        checked={checked}
        onChange={(v) => setChecked(v)}
      />
    );
  },
  args: {
    label: 'メール通知',
  },
};

export const WithoutLabel: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(false);
    return (
      <SwitchButtonBase
        {...args}
        checked={checked}
        onChange={(v) => setChecked(v)}
      />
    );
  },
  args: {
    label: undefined,
  },
};

export const Disabled: Story = {
  args: {
    label: '変更不可',
    checked: false,
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: '変更不可（ON）',
    checked: true,
    disabled: true,
  },
};

export const WithError: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(false);
    return (
      <SwitchButtonBase
        {...args}
        checked={checked}
        onChange={(v) => setChecked(v)}
      />
    );
  },
  args: {
    label: '利用規約に同意する',
    errorMessage: '同意が必要です',
  },
};
