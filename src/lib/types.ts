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

export interface PlanState {
  flow: PlanFlow | null;
  /** The person who created the group. Only they can Decide and pay. */
  adminId: string;
  /** Everyone in the group, including the admin. */
  memberIds: string[];
  groupName: string;
  categories: Category[];
  date: string;
  budget: number;
  distance: number;
  timeSlot: TimeSlot;
  onlyOpen: boolean;
  shortlist: string[];
  /** placeId -> memberId -> vote */
  votes: Record<string, Record<string, Vote>>;
  messages: ChatMessage[];
  decided: boolean;
  /** Admin locked the final place; booking can start. */
  locked: boolean;
  chosenPlaceId: string | null;
  booking: Booking;
  favourites: string[];
}

export type SocialId = "instagram" | "whatsapp" | "snapchat" | "facebook";

export interface Profile {
  name: string;
  /** Area / city shown under the name, e.g. "Ahmedabad, Gujarat". */
  location: string;
  /** Image path or a data: URL from a photo the user picked. */
  avatar: string;
  /** Connected accounts: handle (or phone number for WhatsApp). Missing = not connected. */
  socials: Partial<Record<SocialId, string>>;
}
