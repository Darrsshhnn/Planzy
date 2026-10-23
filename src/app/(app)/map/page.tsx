import { Suspense } from "react";
import { MapScreen } from "@/components/map/map-screen";

/** /map, or /map?place=<id> to open centred on a place. */
export default function MapPage({ searchParams }: PageProps<"/map">) {
  return (
    <Suspense fallback={null}>
      {searchParams.then((sp) => (
        <MapScreen focusPlaceId={typeof sp.place === "string" ? sp.place : undefined} />
      ))}
    </Suspense>
  );
}
