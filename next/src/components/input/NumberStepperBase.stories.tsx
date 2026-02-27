import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import NumberStepperBase from './NumberStepperBase';

const meta = {
  title: 'Input/NumberStepperBase',
  component: NumberStepperBase,
  tags: ['autodocs'],
  args: {
    name: 'example',
    label: '数量',
    value: 0,
    step: 1,
  },
} satisfies Meta<typeof NumberStepperBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value ?? 0);
    return (
      <NumberStepperBase
        {...args}
        value={value}
        onChange={(v) => setValue(v)}
      />
    );
  },
  args: {
    label: '数量',
    value: 0,
  },
};

export const WithUnit: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value ?? 5);
    return (
      <NumberStepperBase
        {...args}
        value={value}
        onChange={(v) => setValue(v)}
      />
    );
  },
  args: {
    label: '重量',
    value: 5,
    unit: 'kg',
  },
};

export const WithMinMax: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value ?? 1);
    return (
      <NumberStepperBase
        {...args}
        value={value}
        onChange={(v) => setValue(v)}
      />
    );
  },
  args: {
    label: '個数',
    value: 1,
    min: 0,
    max: 10,
    unit: '個',
  },
};

export const WithStep: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value ?? 0);
    return (
      <NumberStepperBase
        {...args}
        value={value}
        onChange={(v) => setValue(v)}
      />
    );
  },
  args: {
    label: '温度',
    value: 0,
    step: 5,
    unit: '℃',
  },
};

export const Required: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value ?? 0);
    return (
      <NumberStepperBase
        {...args}
        value={value}
        onChange={(v) => setValue(v)}
      />
    );
  },
  args: {
    label: '必須項目',
    required: true,
  },
};

export const Disabled: Story = {
  args: {
    label: '無効',
    value: 3,
    disabled: true,
    unit: '個',
  },
};

export const WithError: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value ?? 0);
    return (
      <NumberStepperBase
        {...args}
        value={value}
        onChange={(v) => setValue(v)}
      />
    );
  },
  args: {
    label: '数量',
    value: 0,
    errorMessage: '1以上を指定してください',
  },
};
