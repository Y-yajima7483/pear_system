import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import SelectBoxBase from './SelectBoxBase';

const sampleOptions = [
  { label: 'りんご', value: 'apple' },
  { label: 'みかん', value: 'orange' },
  { label: 'ぶどう', value: 'grape' },
  { label: '梨', value: 'pear' },
  { label: 'もも', value: 'peach' },
];

const numberOptions = [
  { label: '1個', value: 1 },
  { label: '5個', value: 5 },
  { label: '10個', value: 10 },
  { label: '20個', value: 20 },
];

const meta = {
  title: 'Input/SelectBoxBase',
  component: SelectBoxBase,
  tags: ['autodocs'],
  args: {
    name: 'example',
    inputLabel: '選択してください',
    option: sampleOptions,
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '250px', width: '300px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SelectBoxBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    inputLabel: '果物を選択',
  },
};

export const WithPreselectedValue: Story = {
  args: {
    inputLabel: '果物を選択',
    value: 'pear',
  },
};

export const WithError: Story = {
  args: {
    inputLabel: '果物を選択',
    errorMessage: '選択は必須です',
  },
};

export const DisabledRemove: Story = {
  args: {
    inputLabel: '果物を選択',
    value: 'apple',
    disabledRemove: true,
  },
};

export const NumberValues: Story = {
  args: {
    inputLabel: '数量を選択',
    option: numberOptions,
  },
};

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | number | null>(null);
    return (
      <div>
        <SelectBoxBase
          {...args}
          value={value}
          onChange={(v) => setValue(v)}
        />
        <p style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
          選択値: {value ?? '未選択'}
        </p>
      </div>
    );
  },
  args: {
    inputLabel: '制御されたセレクト',
    option: sampleOptions,
  },
};
