import type { ReactNode } from "react";
import { Megaphone, Search } from "lucide-react";
import { ContactInviteLink } from "@/components/ContactInviteLink";

export type HowItWorksSection = {
  id: string;
  title: string | null;
  content: ReactNode;
};

const sections: HowItWorksSection[] = [
  {
    id: "overview",
    title: null,
    content: (
      <p className="text-base leading-relaxed text-[var(--foreground)]">
        HomePosal is a decentralized, transparent marketplace. We&apos;ve replaced the high-pressure sales tactics of
        traditional real estate with a public bulletin board where real interest meets real ownership.
      </p>
    ),
  },
  {
    id: "the-concept",
    title: "The Concept",
    content: (
      <p className="mt-3 text-base leading-relaxed text-[var(--foreground-muted)]">
        Traditional real estate is reactive—you wait for someone to sell. HomePosal is proactive. We allow &ldquo;Suitors&rdquo; to
        express interest in any property they&apos;ve always wanted, and we allow Owners to discover that interest before they
        ever deal with the stress of the MLS.
      </p>
    ),
  },
  {
    id: "how-it-works",
    title: "How it Works",
    content: (
      <ol className="mt-8 list-none space-y-6 p-0">
        <li className="rounded-2xl border border-gray-200/90 bg-gray-50 p-8 md:p-10">
          <p className="text-[15px] font-medium tracking-tight text-gray-900">1. Browse the Board</p>
          <p className="mt-4 max-w-prose text-[15px] leading-[1.6] text-gray-600">
            Our bulletin board is public. Anyone can see the current proposals being made on properties across Southern
            California. It&apos;s a real-time map of market demand.
          </p>
        </li>
        <li className="rounded-2xl border border-gray-200/90 bg-gray-50 p-8 md:p-10">
          <p className="text-[15px] font-medium tracking-tight text-gray-900">2. Make a Proposal (Suitors)</p>
          <p className="mt-4 max-w-prose text-[15px] leading-[1.6] text-gray-600">
            Found a home you&apos;ve always wanted? Don&apos;t wait for a &ldquo;For Sale&rdquo; sign. Submit a bona fide proposal. To
            keep the board high-quality, we verify your Proof of Funds so owners know you are a serious, qualified Suitor.
          </p>
        </li>
        <li
          id="choose-your-path-owners"
          className="scroll-mt-24 rounded-2xl border border-gray-200/90 bg-white p-8 md:p-10"
        >
          <p className="text-[15px] font-medium tracking-tight text-gray-900">3. Choose Your Path (Owners)</p>
          <p className="mt-4 max-w-prose text-[15px] leading-[1.6] text-gray-600">
            Two ways to engage—both are optional, discreet, and entirely at your pace.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
            <div className="flex flex-col rounded-2xl border border-gray-200/80 bg-gray-50 p-8">
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700">
                <Search className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Option A</p>
              <p className="mt-2 text-[17px] font-medium tracking-tight text-gray-900">Browse Proposals</p>
              <p className="mt-6 text-[15px] leading-[1.65] text-gray-600">
                <span className="font-medium text-gray-900">Check Your Address.</span> Search the board to see if there is
                already a proposal waiting for you. Entirely silent—browse interest on your own schedule. Zero pressure.
              </p>
            </div>
            <div className="flex flex-col rounded-2xl border border-gray-200/80 bg-gray-50 p-8">
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700">
                <Megaphone className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">Option B</p>
              <p className="mt-2 text-[17px] font-medium tracking-tight text-gray-900">Invite Proposals</p>
              <p className="mt-6 text-[15px] leading-[1.65] text-gray-600">
                <span className="font-medium text-gray-900">Signal the Market.</span> Ask for proposals to &ldquo;test the
                waters.&rdquo; We notify the public via social media and provide a professional yard sign to alert local suitors.
                You set the time period; move forward only if the price is right.
              </p>
              <p className="mt-5 text-[15px] leading-snug text-gray-600">
                <ContactInviteLink className="font-semibold text-[#2C56A3] underline-offset-2 transition-colors hover:text-[#234a8a] hover:underline">
                  Start Your Invite— contact HomePosal
                </ContactInviteLink>
              </p>
            </div>
          </div>
        </li>
      </ol>
    ),
  },
  {
    id: "why-homeposal",
    title: "Why HomePosal?",
    content: (
      <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)]">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full border-collapse bg-white text-left text-sm">
            <thead className="bg-[var(--background-elevated)]">
              <tr className="border-b border-[var(--border)]">
                <th scope="col" className="px-4 py-3 font-semibold text-[var(--foreground)]">
                  Feature
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-[var(--foreground)]">
                  Traditional Real Estate
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-[var(--foreground)]">
                  HomePosal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">Market Entry</td>
                <td className="px-4 py-3 text-[var(--foreground-muted)]">You must list on the MLS to see offers.</td>
                <td className="px-4 py-3 text-[var(--foreground-muted)]">See real proposals before you ever list.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">Market Testing</td>
                <td className="px-4 py-3 text-[var(--foreground-muted)]">High-cost campaigns.</td>
                <td className="px-4 py-3 text-[var(--foreground-muted)]">Proposal Windows with yard signs.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">Involvement</td>
                <td className="px-4 py-3 text-[var(--foreground-muted)]">Showings, open houses, and disruptions.</td>
                <td className="px-4 py-3 text-[var(--foreground-muted)]">
                  Silent or scheduled. Check proposals on your phone.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">Transparency</td>
                <td className="px-4 py-3 text-[var(--foreground-muted)]">Offers are hidden in agent inboxes.</td>
                <td className="px-4 py-3 text-[var(--foreground-muted)]">The bulletin board is public and transparent.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">Control</td>
                <td className="px-4 py-3 text-[var(--foreground-muted)]">High pressure to respond to active listings.</td>
                <td className="px-4 py-3 text-[var(--foreground-muted)]">
                  100% Owner-driven. You decide if and when to talk.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: "faq",
    title: "Frequently Asked Questions",
    content: (
      <div className="mt-4 space-y-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Is the bulletin board private?</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
            No. It is a public bulletin board. This transparency allows the community to see where the market is moving and
            what properties are in high demand.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">What is the &ldquo;Pre-MLS&rdquo; advantage?</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
            For owners, HomePosal acts as a safety net. Why go through the expense of a public listing if a qualified
            Suitor is already offering your &ldquo;dream price&rdquo; on our board? Check HomePosal first to save time and stress.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">As a Suitor, what properties can I propose on?</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
            Anything in Southern California. If you&apos;ve driven by a house for years and wished it was yours, HomePosal gives
            you a formal way to let the owner know you are a serious buyer with verified funds.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">What happens if an owner is interested?</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
            The ball is in the owner&apos;s court. If they see a proposal they like—whether it was already there or arrived during
            their &ldquo;Proposal Window&rdquo;—they reach out to us. We then facilitate the connection and help move the transaction
            forward.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Can an owner ask for proposals?</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
            Yes. If you aren&apos;t ready to list on the MLS but want to see bona fide purchase interest, HomePosal can signal
            that for you. We provide a yard sign and measured social promotion so local Suitors can find your address on the
            bulletin board. You choose the window, and you are never obligated to accept an offer.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "closing",
    title: null,
    content: (
      <div className="rounded-2xl border border-gray-200/90 bg-gray-50 p-8 md:p-10">
        <p className="text-[15px] leading-[1.6] text-gray-600">
          Many owners browse the board first—no commitment, no listing required. When you are ready, we are here to help you
          understand your options clearly.
        </p>
      </div>
    ),
  },
];

function sectionRootClass(id: string): string {
  if (id === "overview") return "space-y-4";
  if (id === "closing") return "mt-10";
  return "mt-10 scroll-mt-24";
}

export function HowItWorks() {
  return (
    <>
      {sections.map((section) => (
        <section key={section.id} id={section.id} className={sectionRootClass(section.id)}>
          {section.title ? (
            <h2 className="text-xl font-semibold text-[var(--foreground)]">{section.title}</h2>
          ) : null}
          {section.content}
        </section>
      ))}
    </>
  );
}

export default HowItWorks;
