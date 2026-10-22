"use client";

import { BadgeCheck, ImagePlus, PenLine, Star, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Stars } from "@/components/ui/rating";
import { Sheet } from "@/components/ui/sheet";
import { toReviewPhotoDataUrl } from "@/lib/image";
import type { Place, Review } from "@/lib/types";
import { usePlan } from "@/store/plan-store";
import { useProfile } from "@/store/account-store";
import { addReview, useMyReviews } from "@/store/reviews-store";
import { Photo, type ViewerPhoto } from "./photo";

type Filter = "all" | "photos" | "verified" | 5 | 4 | 3;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "photos", label: "With photos" },
  { id: "verified", label: "Verified" },
  { id: 5, label: "5 star" },
  { id: 4, label: "4 star" },
  { id: 3, label: "3 & below" },
];
const MAX_PHOTOS = 3;

function matches(r: Review, f: Filter) {
  if (f === "all") return true;
  if (f === "photos") return !!r.photos?.length;
  if (f === "verified") return r.verified;
  if (f === 3) return r.rating <= 3;
  return Math.round(r.rating) === f;
}

/** A review is "verified" when the visit was booked through Planzy. */
export function useVisitedViaPlanzy(placeId: string) {
  const plan = usePlan();
  return plan.booking.status !== "none" && plan.chosenPlaceId === placeId;
}

export function ReviewsSection({
  place,
  onOpenPhotos,
  onWrite,
}: {
  place: Place;
  onOpenPhotos: (photos: ViewerPhoto[], start: number) => void;
  onWrite: () => void;
}) {
  const mine = useMyReviews(place.id);
  const [filter, setFilter] = useState<Filter>("all");
  const all = [...mine, ...place.reviews];
  const shown = all.filter((r) => matches(r, filter));

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-[19px] font-bold">Reviews</h2>
        <button
          onClick={onWrite}
          className="flex h-8 items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-cream px-3 text-[12px] font-semibold"
        >
          <PenLine size={14} /> Write a review
        </button>
      </div>
      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
        <BadgeCheck size={13} className="text-navy" /> Verified = visit booked through Planzy
      </p>

      <div className="no-scrollbar -mx-5 mt-2.5 flex gap-2 overflow-x-auto px-5">
        {FILTERS.map((f) => (
          <Chip key={String(f.id)} selected={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>

      <ul className="mt-3 space-y-3">
        {shown.map((r) => {
          const photos: ViewerPhoto[] = (r.photos ?? []).map((src) => ({ src, caption: `${r.author} · ${r.when}` }));
          return (
            <li key={r.id} className="reveal card p-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                  {r.author}
                  {r.verified && (
                    <span className="flex items-center gap-0.5 text-[10px] font-medium text-navy">
                      <BadgeCheck size={14} /> Verified
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-muted">{r.when}</span>
              </div>
              <Stars value={r.rating} size={12} />
              <p className="mt-1 text-[13px] leading-[19px]">{r.text}</p>
              {photos.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {photos.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => onOpenPhotos(photos, i)}
                      aria-label={`Open photo ${i + 1} from ${r.author}`}
                      className="relative h-[72px] w-[92px] overflow-hidden rounded-[8px] border border-ink/10"
                    >
                      <Photo src={p.src} alt="" sizes="92px" />
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
        {shown.length === 0 && <li className="py-4 text-center text-[13px] text-muted">No reviews match this filter.</li>}
      </ul>
    </section>
  );
}

/** Rendered in the screen overlay so it sits above the scroll area and bottom nav. */
export function WriteReviewSheet({
  open,
  onClose,
  place,
  verified,
}: {
  open: boolean;
  onClose: () => void;
  place: Place;
  verified: boolean;
}) {
  const profile = useProfile();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState("");

  const reset = () => {
    setRating(0);
    setText("");
    setPhotos([]);
    setError("");
  };

  const pick = async (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    try {
      const added = await Promise.all([...files].slice(0, room).map(toReviewPhotoDataUrl));
      setPhotos((p) => [...p, ...added]);
      setError(files.length > room ? `Up to ${MAX_PHOTOS} photos per review` : "");
    } catch {
      setError("One of those files isn't a photo we can read");
    }
  };

  const submit = () => {
    if (!rating) return setError("Tap a star to rate");
    if (text.trim().length < 10) return setError("Write at least 10 characters");
    const ok = addReview(place.id, {
      id: `my-${Date.now().toString(36)}`,
      author: profile.name,
      rating,
      text: text.trim(),
      when: "Just now",
      verified,
      photos,
    });
    if (!ok) return setError("Not enough space to save these photos. Try fewer photos.");
    reset();
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={`Review ${place.name}`}>
      <div className="flex gap-1.5" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star`} onClick={() => setRating(n)}>
            <Star size={32} className={n <= rating ? "fill-[#F7C028] stroke-[#F7C028]" : "stroke-ink/30"} />
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={400}
        rows={4}
        placeholder="How was it? Crowd, cleanliness, staff, value…"
        aria-label="Your review"
        className="mt-3 w-full resize-none rounded-[12px] border border-ink bg-paper p-3 text-[14px] outline-none focus:border-brand"
      />

      <div className="mt-2 flex flex-wrap gap-2">
        {photos.map((src, i) => (
          <div key={i} className="relative h-[72px] w-[72px] overflow-hidden rounded-[8px]">
            <Photo src={src} alt={`Your photo ${i + 1}`} sizes="72px" />
            <button
              onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
              aria-label="Remove photo"
              className="absolute right-0.5 top-0.5 rounded-full bg-ink/80 p-0.5 text-white"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <label className="flex h-[72px] w-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[8px] border-[1.5px] border-dashed border-brand bg-cream text-[10px] font-semibold">
            <ImagePlus size={20} className="text-brand" />
            Add photo
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                pick(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      <p className={`mt-3 flex items-center gap-1.5 text-[12px] ${verified ? "text-navy" : "text-muted"}`}>
        <BadgeCheck size={15} />
        {verified ? "Your review will be marked Verified (booked via Planzy)" : "Book through Planzy to get a Verified badge"}
      </p>
      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
      <Button block className="mt-4" onClick={submit}>
        Post review
      </Button>
    </Sheet>
  );
}
