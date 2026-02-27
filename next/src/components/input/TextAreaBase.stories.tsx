import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import TextAreaBase from './TextAreaBase';

const meta = {
  title: 'Input/TextAreaBase',
  component: TextAreaBase,
  tags: ['autodocs'],
  args: {
    name: 'example',
    inputLabel: 'テキストエリア',
    rows: 4,
    resize: 'vertical',
  },
} satisfies Meta<typeof TextAreaBase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    inputLabel: 'コメント',
  },
};

export const WithDefaultValue: Story = {
  args: {
    inputLabel: '備考',
    defaultValue: 'デフォルトのテキストが入っています。\n改行も含まれます。',
  },
};

export const WithError: Story = {
  args: {
    inputLabel: '説明',
    errorMessage: '説明を入力してください',
  },
};

export const WithMaxLength: Story = {
  args: {
    inputLabel: 'メモ（100文字まで）',
    maxLength: 100,
  },
};

export const CustomRows: Story = {
  args: {
    inputLabel: '詳細説明',
    rows: 8,
  },
};

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState('');
    return (
      <TextAreaBase
        {...args}
        value={value}
        onChange={(v) => setValue(v)}
      />
    );
  },
  args: {
    inputLabel: '制御されたテキストエリア',
  },
};
