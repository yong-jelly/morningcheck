import type { Meta, StoryObj } from "@storybook/react";
import { UserHeader } from "./UserHeader";
import { MemoryRouter } from "react-router";

const meta: Meta<typeof UserHeader> = {
  title: "Widgets/UserHeader",
  component: UserHeader,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="max-w-[430px] mx-auto bg-[#F8FAFC] dark:bg-surface-950 min-h-screen">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockUser = {
  id: "user-1",
  name: "젤리",
  display_name: "젤리젤리",
  avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=jelly",
};

const mockTodayCheckIn = {
  id: "check-1",
  userId: "user-1",
  condition: 8,
  note: "오늘 컨디션 아주 좋아요! 🚀",
  date: new Date().toISOString().split("T")[0],
  createdAt: new Date().toISOString(),
};

const mockHistory = [
  { id: "h1", userId: "user-1", condition: 5, date: "2026-01-06", note: "보통", createdAt: "" },
  { id: "h2", userId: "user-1", condition: 7, date: "2026-01-07", note: "좋음", createdAt: "" },
  { id: "h3", userId: "user-1", condition: 3, date: "2026-01-08", note: "피곤", createdAt: "" },
  { id: "h4", userId: "user-1", condition: 9, date: "2026-01-09", note: "최고", createdAt: "" },
  { id: "h5", userId: "user-1", condition: 6, date: "2026-01-10", note: "무난", createdAt: "" },
];

export const Default: Story = {
  args: {
    user: mockUser,
    todayCheckIn: mockTodayCheckIn,
    checkInHistory: mockHistory,
    weather: { temp: 24, code: 0 },
    isLoading: false,
  },
};

export const NotCheckedIn: Story = {
  args: {
    user: mockUser,
    todayCheckIn: null,
    checkInHistory: mockHistory,
    weather: { temp: 18, code: 3 },
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const BadCondition: Story = {
  args: {
    user: mockUser,
    todayCheckIn: { ...mockTodayCheckIn, condition: 2, note: "너무 힘들어요... 😴" },
    checkInHistory: mockHistory,
    weather: { temp: 2, code: 71 },
    isLoading: false,
  },
};
