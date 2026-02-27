import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import DatePickerBase from './DatePickerBase';

const meta = {
  title: 'Input/DatePickerBase',
  component: DatePickerBase,
  tags: ['autodocs'],
  args: {
    name: 'example',
    inputLabel: '日付を選択',
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '400px', width: '300px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DatePickerBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<Date | null>(null);
    return (
      <DatePickerBase
        {...args}
        value={value}
        onChange={(v) => setValue(v)}
      />
    );
  },
  args: {
    inputLabel: '配送日',
  },
};

export const WithPreselectedDate: Story = {
  render: (args) => {
    const [value, setValue] = useState<Date | null>(new Date());
    return (
      <DatePickerBase
        {...args}
        value={value}
        onChange={(v) => setValue(v)}
      />
    );
  },
  args: {
    inputLabel: '予約日',
  },
};

export const WithError: Story = {
  render: (args) => {
    const [value, setValue] = useState<Date | null>(null);
    return (
      <DatePickerBase
        {...args}
        value={value}
        onChange={(v) => setValue(v)}
      />
    );
  },
  args: {
    inputLabel: '出荷日',
    errorMessage: '日付を選択してください',
  },
};

export const Disabled: Story = {
  args: {
    inputLabel: '確定日',
    value: new Date(2025, 0, 15),
    disabled: true,
  },
};
