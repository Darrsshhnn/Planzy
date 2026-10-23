"use client";

import { Heart } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { FavouriteButton } from "@/components/place/favourite-button";
import { PlaceListRow } from "@/components/place/place-list-row";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getPlace } from "@/lib/api/data";
import { useFavourites } from "@/store/plan-store";

export default function FavouritesPage() {
  const favourites = useFavourites();
  const places = favourites.map((id) => getPlace(id)).filter((p) => p !== undefined);
  return (
    <Screen>
      <PageHeader title="Favourites" backHref="/profile" />
      {places.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favourites yet"
          body="Tap the heart on any place to save it here. You can add liked places to a group's shortlist."
          action={
            <ButtonLink href="/search" block>
              Explore places
            </ButtonLink>
          }
        />
      ) : (
        <ul className="divide-y divide-ink/10">
          {places.map((p) => (
            <PlaceListRow key={p.id} place={p} trailing={<FavouriteButton placeId={p.id} className="h-9! w-9!" />} />
          ))}
        </ul>
      )}
    </Screen>
  );
}
