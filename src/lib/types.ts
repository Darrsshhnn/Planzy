export type Category = "Food" | "Sports" | "Arcade" | "Fair" | "Museum" | "Hangout";

export type TimeSlot = "Morning" | "Afternoon" | "Evening" | "Night";

export type Vote = "in" | "maybe" | "cant";

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  when: string;
  verified: boolean;
  /** Photos the reviewer attached (image paths or data URLs). */
  photos?: string[];
}

export interface Place {
  id: string;
  name: string;
  area: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  rating: number;
  reviewsCount: number;
  category: Category;
  pricePerPerson: number;
  /** Path under /public. Places without a photo render a branded placeholder. */
  image?: string;
  /** Extra photos: shown as the gallery and as recent visitor photos. */
  gallery: string[];
  /** 24h "HH:mm". A close time earlier than open means it closes after midnight. */
  open: string;
  close: string;
  hours: { weekday: string; weekend: string };
  closedOn?: string;
  popular: boolean;
  /** Recently listed on Planzy ("New spot every week"). */
  newThisWeek: boolean;
  /** Least crowded time, from visit data. */
  bestTime: string;
  /** Sub-ratings out of 5, from verified reviews. */
  scores: { cleanliness: number; maintenance: number; value: number; staff: number };
  nearby: boolean;
  tags: string[];
  about: string;
  phone: string;
  live: { crowd: "Quiet" | "Moderate" | "Busy"; updatedMinsAgo: number };
  reviews: Review[];
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  /** Usual outing time, used for the group timing suggestion. */
  prefers?: TimeSlot;
  /** Usual budget per person and travel distance; sent when they accept an invite. */
  budget?: number;
  distance?: number;
}

export interface Area {
  name: string;
  lat: number;
  lng: number;
}

export interface SavedGroup {
  id: string;
  name: string;
  image: string;
  memberIds: string[];
}

export interface RecentOuting {
  id: string;
  groupName: string;
  placeId: string;
  rating: number;
  memberIds: string[];
}

export type ChatMessage =
  | { id: string; kind: "text"; authorId: string; text: string; at: number }
  | { id: string; kind: "place"; authorId: string; placeId: string; at: number }
  | { id: string; kind: "system"; text: string; at: number }
  /** Group notification that needs attention, e.g. the admin going against the vote. */
  | { id: string; kind: "alert"; text: string; at: number }
  | { id: string; kind: "image"; authorId: string; src: string; at: number }
  | { id: string; kind: "location"; authorId: string; label: string; lat?: number; lng?: number; at: number };

export type PlanFlow = "new" | "popular";

/**
 * none: not booked yet. paid: pre-paid online. pay-at-venue: slot held, the group
 * pays on arrival (cash/UPI). walk-in: food places, no booking or payment needed.
 */
export type BookingStatus = "none" | "paid" | "pay-at-venue" | "walk-in";

export interface Booking {
  status: BookingStatus;
  slot: string;
  people: number;
  /** Pay online now, or on reaching the venue. */
  payMode: "now" | "venue";
  method: PaymentMethod;
  amount: number;
  reference?: string;
  paidAt?: number;
}

export type PaymentMethod = "upi" | "card" | "netbanking" | "cash";

/** One member's budget / distance / timing input for a plan. */
export interface MemberPrefs {
  budget: number;
  distance: number;
  timeSlot: TimeSlot;
}

/** invited: waiting for a reply. accepted / declined: replied to the invite. */
export type MemberStatus = "invited" | "accepted" | "declined";

export interface PlanState {
  id: string;
  createdAt: number;
  flow: PlanFlow | null;
  /** The person who created the group. Only they can add people, Decide and book. */
  adminId: string;
  /** Admin plus everyone who accepted. Votes and bookings count these people. */
  memberIds: string[];
  /** Invite status for everyone the admin added (not the admin). */
  invites: Record<string, MemberStatus>;
  /** Budget / distance / timing each member sent; null = they skipped it. */
  memberPrefs: Record<string, MemberPrefs | null>;
  groupName: string;
  categories: Category[];
  date: string;
  /** The admin's own budget / distance / timing (also the group defaults). */
  budget: number;
  distance: number;
  timeSlot: TimeSlot;
  /** Admin skipped the budget / distance / timing screen. */
  prefsSkipped: boolean;
  onlyOpen: boolean;
  shortlist: string[];
  /** placeId -> memberId -> vote */
  votes: Record<string, Record<string, Vote>>;
  messages: ChatMessage[];
  /** The group chat exists (created after Recommendation). */
  created: boolean;
  /** Finished outing, shown under Old chats. */
  archived: boolean;
  decided: boolean;
  /** Admin locked the final place; booking can start. */
  locked: boolean;
  chosenPlaceId: string | null;
  booking: Booking;
}

export interface AppNotification {
  id: string;
  kind: "invite" | "response" | "alert";
  planId: string;
  text: string;
  at: number;
  read: boolean;
}

export interface Profile {
  name: string;
  age: number | null;
  /** Area / city shown under the name, e.g. "Bodakdev, Ahmedabad". */
  location: string;
  /** Image path or a data: URL from a photo the user picked. */
  avatar: string;
  phone: string;
  email: string;
  /** Defaults used when you make or join a plan. */
  preferences: { categories: Category[]; budget: number; distance: number; timeSlot: TimeSlot };
}
