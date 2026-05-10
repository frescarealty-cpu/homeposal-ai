import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Digital Image Disclosure (AB 723) - HomePosal",
  description:
    "Disclosure regarding digitally altered or AI-enhanced images in accordance with California AB 723.",
};

export default function DigitalImageDisclosurePage() {
  return (
    <div className="mx-auto w-full max-w-[800px] px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        Digital Image Disclosure (AB 723)
      </h1>
      <p className="mt-6 text-sm leading-relaxed text-[var(--foreground-muted)]">
        Where HomePosal displays images that have been digitally altered or AI-enhanced (for
        example, virtual staging or object removal), those images will be clearly labeled.
        Where applicable, we will also provide a link to the original, unaltered image.
      </p>
    </div>
  );
}

