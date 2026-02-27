import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import TimeSelectBase from './TimeSelectBase';

const meta = {
  title: 'Input/TimeSelectBase',
  component: TimeSelectBase,
  tags: ['autodocs'],
  args: {
    name: 'example',
    inputLabel: '時刻を選択',
    min: '07:00',
    max: '21:00',
  },
} satisfies Meta<typeof TimeSelectBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <TimeSelectBase
        {...args}
        value={value}
        onChange={(v) => setValue(v)}
      />
    );
  },
  args: {
    inputLabel: '受取時間',
  },
};

export const WithPreselectedTime: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | null>('10:00');
    return (
      <TimeSelectBase
        {...args}
        value={value}
        onChange={(v) => setValue(v)}
      />
    );
  },
  args: {
    inputLabel: '配送時間',
  },
};

export const WithError: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <TimeSelectBase
        {...args}
        value={value}
        onChange={(v) => setValue(v)}
      />
    );
  },
  args: {
    inputLabel: '到着時刻',
    errorMessage: '時刻を選択してください',
  },
};

export const NarrowRange: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | null>(null);
    return (
      <TimeSelectBase
        {...args}
        value={value}
        onChange={(v) => setValue(v)}
      />
    );
  },
  args: {
    inputLabel: '午前のみ',
    min: '09:00',
    max: '12:00',
  },
};
