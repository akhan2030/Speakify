"use client";

import LiveClassWeekGrid, {
  type CalendarSlot,
  type StudentSlotBooking,
} from "@/components/live-classes/LiveClassWeekGrid";

export type { CalendarSlot };

type Props = {
  slots: CalendarSlot[];
  remainingIncluded: number;
  usesIncluded: boolean;
  packageIncluded?: number;
  needsOrientation?: boolean;
  myBookings?: StudentSlotBooking[];
  now?: Date;
  submitting?: boolean;
  bookDisabled?: boolean;
  showActions?: boolean;
  onBook?: (slot: CalendarSlot) => void;
};

export default function LiveClassBookingBoard(props: Props) {
  return <LiveClassWeekGrid {...props} />;
}
