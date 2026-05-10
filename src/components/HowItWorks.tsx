import type { ReactNode } from "react";

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
        HomePosal is a decentralized, transparent marketplace. We’ve replaced the high-pressure sales tactics of
        traditional real estate with a public bulletin board where real interest meets real ownership.
      </p>
    ),
  },
  {
    id: "the-concept",
    title: "The Concept",
    content: (
      <p className="mt-3 text-base leading-relaxed text-[var(--foreground-muted)]">
        Traditional real estate is reactive—you wait for someone to sell. HomePosal is proactive. We allow “Suitors” to
        express interest in any property they’ve always wanted, and we allow Owners to discover that interest before they
        ever deal with the stress of the MLS.
      </p>
    ),
  },
  {
    id: "how-it-works",
    title: "How it works",
    content: (
      <ol className="mt-4 space-y-4">
        <li className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">1. Browse the Board</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
            Our bulletin board is public. Anyone can see the current proposals being made on properties across Southern
            California. It’s a real-time map of market demand.
          </p>
        </li>
        <li className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">2. Make a Proposal (Suitors)</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
            Found a home you’ve always wanted? Don&apos;t wait for a “For Sale” sign. Submit a bona fide proposal. To
            keep the board high-quality, we verify your Proof of Funds so owners know you are a serious, qualified Suitor.
          </p>
        </li>
        <li className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">3. Check Your Address (Owners)</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
            Before you hire a photographer, stage your home, or sign a listing agreement, check HomePosal. See if there is
            already a proposal waiting for you. There is zero pressure; you only reach out to us if a proposal meets your
            terms.
          </p>
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
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">Involvement</td>
                <td className="px-4 py-3 text-[var(--foreground-muted)]">Showings, open houses, and disruptions.</td>
                <td className="px-4 py-3 text-[var(--foreground-muted)]">
                  Silent. Check proposals from your phone, on your schedule.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[var(--foreground)]">Opportunity</td>
                <td className="px-4 py-3 text-[var(--foreground-muted)]">Limited to what is currently “For Sale.”</td>
                <td className="px-4 py-3 text-[var(--foreground-muted)]">
                  Any property in SoCal is open for a proposal.
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
          <p className="text-sm font-semibold text-[var(--foreground)]">What is the “Pre-MLS” advantage?</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
            For owners, HomePosal acts as a safety net. Why go through the expense of a public listing if a qualified
            Suitor is already offering your “dream price” on our board? Check HomePosal first to save time and stress.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">As a Suitor, what properties can I propose on?</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
            Anything in Southern California. If you’ve driven by a house for years and wished it was yours, HomePosal gives
            you a formal way to let the owner know you are a serious buyer with verified funds.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">What happens if an owner is interested?</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
            The ball is in the owner&apos;s court. If they see a proposal they like, they reach out to us. We then
            facilitate the connection and help move the transaction forward.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "closing",
    title: null,
    content: (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-5">
        <p className="text-base font-semibold text-[var(--foreground)]">Don&apos;t list it until you check it.</p>
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
