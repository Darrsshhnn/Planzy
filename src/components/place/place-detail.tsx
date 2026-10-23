"use client";

import {
  Check,
  ChevronLeft,
  Clock,
  Images,
  IndianRupee,
  MapPin,
  MessageSquareText,
  Navigation,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Screen } from "@/components/layout/screen";
import { StickyFooter } from "@/components/layout/sticky-footer";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/ui/rating";
import { getPhotoCredit } from "@/lib/api/data";
import { rupees } from "@/lib/format";
import type { Place } from "@/lib/types";
import { CURRENT_USER_ID, planActions, usePlan } from "@/store/plan-store";
import { useViewer } from "@/store/viewer-store";
import { FavouriteButton } from "./favourite-button";
import { LivePill } from "./live-status";
import { Photo, PhotoViewer, type ViewerPhoto } from "./photo";
import { PlaceImage } from "./place-image";
import { LiveSection, ScoreBars } from "./place-sections";
import { ReviewsSection, useVisitedViaPlanzy, WriteReviewSheet } from "./reviews-section";
import { VenueChatSheet } from "./venue-chat-sheet";

function creditCaption(src: string) {
  const c = getPhotoCredit(src);
  return c ? `Photo: ${c.author}, ${c.license}, via Wikimedia Commons` : undefined;
}

export function PlaceDetail({ place }: { place: Place }) {
  const router = useRouter();
  const plan = usePlan();
  const { viewerId } = useViewer();
  const [toast, setToast] = useState("");
  const [slide, setSlide] = useState(0);
  const [viewer, setViewer] = useState<{ photos: ViewerPhoto[]; start: number } | null>(null);
  const [writing, setWriting] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const verifiedVisit = useVisitedViaPlanzy(place.id);

  // The open group chat (if any) can take this place into its shortlist.
  const chatOpen = plan.created && !plan.archived && !plan.decided && plan.memberIds.includes(CURRENT_USER_ID);
  const inShortlist = plan.shortlist.includes(place.id);
  const gallery = [...(place.image ? [place.image] : []), ...place.gallery];
  const galleryPhotos: ViewerPhoto[] = gallery.map((src) => ({ src, caption: creditCaption(src) }));

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const share = async () => {
    const text = `${place.name}, ${place.address} on Planzy`;
    try {
      if (navigator.share) {
        await navigator.share({ title: place.name, text, url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${window.location.href}`);
      flash("Link copied");
    } catch {
      flash("Couldn't share right now");
    }
  };

  const primary = () => {
    if (chatOpen) {
      if (!inShortlist) planActions.addPlaceFromChat(place.id, viewerId);
      router.push(`/chat/${plan.id}`);
      return;
    }
    // No active group: start a "Popular Places" plan with this place picked.
    planActions.start("popular", [], place.id);
    router.push("/plan/friends");
  };

  return (
    <Screen
      padded={false}
      withFooter
      overlay={
        <>
          <StickyFooter>
            <Button block onClick={primary} variant={chatOpen && inShortlist ? "outline" : "dark"}>
              {chatOpen ? (
                inShortlist ? (
                  <>
                    <Check size={18} /> In shortlist · Open chat
                  </>
                ) : (
                  "Add to group chat"
                )
              ) : (
                "Plan with friends"
              )}
            </Button>
          </StickyFooter>
          {toast && (
            <div className="absolute inset-x-0 bottom-[190px] z-40 flex justify-center">
              <span className="rounded-full bg-ink px-4 py-2 text-[13px] text-white">{toast}</span>
            </div>
          )}
          <VenueChatSheet place={place} open={messaging} onClose={() => setMessaging(false)} />
          <WriteReviewSheet open={writing} onClose={() => setWriting(false)} place={place} verified={verifiedVisit} />
          {viewer && <PhotoViewer photos={viewer.photos} start={viewer.start} onClose={() => setViewer(null)} />}
        </>
      }
    >
      <div className="relative">
        {gallery.length ? (
          <div
            onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
            className="no-scrollbar flex h-[300px] snap-x snap-mandatory overflow-x-auto"
          >
            {gallery.map((src, i) => (
              <button
                key={src}
                onClick={() => setViewer({ photos: galleryPhotos, start: i })}
                aria-label={`Open photo ${i + 1} of ${gallery.length}`}
                className="relative h-full w-full shrink-0 snap-center"
              >
                <Photo src={src} alt={`${place.name} photo ${i + 1}`} sizes="430px" priority={i === 0} />
              </button>
            ))}
          </div>
        ) : (
          <PlaceImage place={place} className="h-[300px] w-full" sizes="430px" priority />
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/50 to-transparent" />
        <button
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
          aria-label="Back"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-cream/95 text-ink"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="absolute right-4 top-4 flex gap-2">
          <button
            onClick={share}
            aria-label="Share"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-cream/95 text-brand"
          >
            <Send size={19} />
          </button>
          <FavouriteButton placeId={place.id} />
        </div>
        <div className="pointer-events-none absolute bottom-8 left-4 right-4 flex items-center justify-between">
          <LivePill place={place} className="!text-[11px]" />
          <span className="flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 text-[11px] text-white backdrop-blur">
            <Images size={12} /> {slide + 1}/{gallery.length}
          </span>
        </div>
        {gallery.length > 1 && (
          <div className="pointer-events-none absolute bottom-[22px] left-0 right-0 flex justify-center gap-1.5" aria-hidden>
            {gallery.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === slide ? "w-4 bg-white" : "w-1.5 bg-white/60"}`} />
            ))}
          </div>
        )}
      </div>

      <div className="relative -mt-4 rounded-t-[24px] bg-white px-5 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-[24px] font-bold leading-tight">{place.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-[13px] text-ink/80">
              {place.distanceKm} km, {place.area}, Ahmedabad <Navigation size={13} />
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="rounded-full border border-ink px-3 py-0.5 text-[12px]">{place.category}</span>
            {place.newThisWeek && (
              <span className="flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">
                <Sparkles size={11} /> New this week
              </span>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[13px]">
          <Stars value={place.rating} />
          <span className="font-semibold">{place.rating.toFixed(1)}</span>
          <span className="text-muted">({place.reviewsCount.toLocaleString("en-IN")} reviews)</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setMessaging(true)}
            className="card flex h-[50px] items-center justify-center gap-2 bg-cream! text-[13px] font-medium"
          >
            <MessageSquareText size={20} className="text-brand" /> Message
          </button>
          <Link href={`/map?place=${place.id}`} className="card flex h-[50px] items-center justify-center gap-2 bg-cream! text-[13px] font-medium">
            <MapPin size={20} className="text-brand" /> Location
          </Link>
        </div>

        <LiveSection
          place={place}
          onOpenPhoto={(i) =>
            setViewer({
              photos: place.gallery.map((src) => ({ src, caption: creditCaption(src) })),
              start: i,
            })
          }
        />

        <dl className="mt-4 grid grid-cols-2 gap-2.5 text-[12px]">
          <InfoTile
            icon={IndianRupee}
            label={place.hourly ? `Per ${place.hourly.unit} / hour` : "Avg budget / person"}
            value={place.hourly ? rupees(place.hourly.rate) : rupees(place.pricePerPerson)}
          />
          <InfoTile icon={Sparkles} label="Best time" value={place.bestTime} />
          <InfoTile icon={Clock} label="Opening hours" value={`${place.hours.weekday}\n${place.hours.weekend}`} wide />
        </dl>

        <h2 className="mt-6 font-heading text-[19px] font-bold">About</h2>
        <p className="mt-1.5 text-[13px] leading-[20px] text-ink/85">{place.about}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {place.tags.map((t) => (
            <span key={t} className="rounded-full bg-cream px-3 py-1 text-[11px]">
              {t}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-muted">{place.address}</p>

        <h2 className="mt-6 font-heading text-[19px] font-bold">Rating breakdown</h2>
        <ScoreBars place={place} />

        <ReviewsSection
          place={place}
          onOpenPhotos={(photos, start) => setViewer({ photos, start })}
          onWrite={() => setWriting(true)}
        />

      </div>
    </Screen>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  wide,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={`card p-2.5 ${wide ? "col-span-2" : ""}`}>
      <dt className="flex items-center gap-1.5 text-muted">
        <Icon size={14} className="text-brand" /> {label}
      </dt>
      <dd className="mt-0.5 whitespace-pre-line font-semibold">{value}</dd>
    </div>
  );
}
