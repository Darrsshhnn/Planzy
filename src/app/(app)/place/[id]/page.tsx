import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PlaceDetail } from "@/components/place/place-detail";
import { getPlace, getPlaces } from "@/lib/api/data";

export function generateStaticParams() {
  return getPlaces().map((p) => ({ id: p.id }));
}

function PlaceById({ id }: { id: string }) {
  const place = getPlace(id);
  if (!place) notFound();
  return <PlaceDetail place={place} />;
}

export default function PlacePage({ params }: PageProps<"/place/[id]">) {
  return (
    <Suspense fallback={<div className="absolute inset-0 animate-pulse bg-cream/60" />}>
      {params.then(({ id }) => (
        <PlaceById id={id} />
      ))}
    </Suspense>
  );
}
