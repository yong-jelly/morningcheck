import type { Meta, StoryObj } from "@storybook/react";
import { DotMatrixNumber } from "./DotMatrixNumber";

const meta: Meta<typeof DotMatrixNumber> = {
  title: "Shared/DotMatrixNumber",
  component: DotMatrixNumber,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
    },
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 10, step: 1 },
      description: "표시할 숫자 (0-10)",
    },
    color: {
      control: "color",
      description: "활성화된 도트의 색상",
    },
    dotSize: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "도트의 크기 및 간격",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 7,
    color: "white",
    dotSize: "md",
  },
};

export const LargeGreen: Story = {
  args: {
    value: 10,
    color: "#4ADE80",
    dotSize: "lg",
  },
};

export const SmallRed: Story = {
  args: {
    value: 3,
    color: "#FF5F5F",
    dotSize: "sm",
  },
};

export const Interactive: Story = {
  render: (args) => {
    return (
      <div className="flex flex-col items-center gap-8 p-12 bg-zinc-900 rounded-3xl">
        <DotMatrixNumber {...args} />
        <div className="text-white/50 text-sm font-mono">
          Value: {args.value}
        </div>
      </div>
    );
  },
  args: {
    value: 5,
    color: "#F19B4C",
    dotSize: "lg",
  },
};
