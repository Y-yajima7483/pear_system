import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import TextFieldBase from './TextFieldBase';

const meta = {
  title: 'Input/TextFieldBase',
  component: TextFieldBase,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number'],
    },
  },
  args: {
    name: 'example',
    inputLabel: 'ラベル',
    type: 'text',
  },
} satisfies Meta<typeof TextFieldBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  args: {
    type: 'text',
    inputLabel: 'テキスト入力',
  },
};

export const Number: Story = {
  args: {
    type: 'number',
    inputLabel: '数値入力',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    inputLabel: 'パスワード',
  },
};

export const WithSuffix: Story = {
  args: {
    type: 'number',
    inputLabel: '価格',
    suffix: '円',
  },
};

export const WithError: Story = {
  args: {
    type: 'text',
    inputLabel: '必須項目',
    errorMessage: 'この項目は必須です',
  },
};

export const WithDefaultValue: Story = {
  args: {
    type: 'text',
    inputLabel: '名前',
    defaultValue: '山田太郎',
  },
};

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState('制御された値');
    return (
      <TextFieldBase
        {...args}
        value={value}
        onChange={(v) => setValue(v)}
      />
    );
  },
  args: {
    type: 'text',
    inputLabel: '制御されたフィールド',
  },
};
