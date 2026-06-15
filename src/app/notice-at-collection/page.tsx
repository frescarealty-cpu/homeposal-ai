import { NoticeAtCollectionContent } from "@/components/legal/NoticeAtCollectionContent";

export default function NoticeAtCollectionPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">Notice at Collection</h1>
      <NoticeAtCollectionContent className="mt-4" />
    </div>
  );
}
