import { HomeContent } from "@/components/HomeContent";
import { MOCK_PROPERTIES } from "@/data/properties";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ address?: string; county?: string }>;
}) {
  let address: string | undefined;
  let county: string | undefined;
  try {
    const params = await searchParams;
    address = params.address;
    county = params.county;
  } catch (err) {
    const isAbort =
      err instanceof Error &&
      (err.name === "AbortError" || /abort|aborted/i.test(err.message ?? ""));
    if (isAbort) {
      address = undefined;
      county = undefined;
    } else {
      throw err;
    }
  }
  return (
    <HomeContent
      properties={MOCK_PROPERTIES}
      initialSearch={address ?? ""}
      countySlug={county ?? undefined}
    />
  );
}
