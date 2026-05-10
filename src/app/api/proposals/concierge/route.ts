import { NextRequest, NextResponse } from "next/server";
import { convertToModelMessages, streamText, tool, zodSchema } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function textStreamResponse(text: string, status = 200) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });

  return new NextResponse(stream, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

const FinancingTypeSchema = z.enum(["cash", "loan"]);

const ConciergeProposalSchema = z.object({
  proposerLegalName: z.string().min(2),
  proposedPurchasePriceUsd: z.number().positive(),
  initialDepositUsd: z.number().nonnegative(),
  financingType: FinancingTypeSchema,
  // If financingType === "loan", we expect these to reconcile.
  downPaymentUsd: z.number().nonnegative().optional(),
  loanAmountUsd: z.number().nonnegative().optional(),
  contingencies: z.string().max(5000).optional(),
  proofOfFunds: z.object({
    bucket: z.string().min(1),
    path: z.string().min(1),
  }),
});

type ConciergeContext = {
  propertyId?: string;
  placeAddress?: string;
  placeLat?: number;
  placeLng?: number;
  zestimateUsd?: number | null;
  listPriceUsd?: number | null;
};

type Collected = Partial<{
  proposerLegalName: string;
  proposedPurchasePriceUsd: number;
  initialDepositUsd: number;
  financingType: z.infer<typeof FinancingTypeSchema>;
  downPaymentUsd: number;
  loanAmountUsd: number;
  contingencies: string;
  proofOfFunds: { bucket: string; path: string };
}>;

type IncomingMessage = {
  role?: string;
  content?: unknown;
  text?: unknown;
  parts?: Array<{ type?: unknown; text?: unknown }> | unknown;
};

function messageText(m: IncomingMessage): string {
  if (typeof m.content === "string") return m.content;
  if (typeof m.text === "string") return m.text;
  if (Array.isArray(m.parts)) {
    return m.parts
      .map((p) => {
        if (!p) return "";
        if (p.type === "text" && typeof p.text === "string") return p.text;
        if (typeof p.text === "string") return p.text;
        return "";
      })
      .join("");
  }
  return "";
}

function lastUserText(messages: IncomingMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role === "user") return messageText(m);
  }
  return "";
}

function looksLikePlainName(s: string) {
  const t = s.trim();
  if (t.length < 2 || t.length > 120) return false;
  if (t.includes(":")) return false;
  if (/^(yes|no|confirm|submit|stop|retry)$/i.test(t)) return false;
  // Must contain at least one letter.
  if (!/[a-zA-Z]/.test(t)) return false;
  // Avoid accidentally accepting "Purchase price 500000" style.
  if (/(purchase|price|deposit|financing|contingenc|proof|upload|loan|down payment)/i.test(t)) return false;
  return true;
}

function fillFromPlainAnswer(collected: Collected, messages: IncomingMessage[]) {
  const raw = lastUserText(messages).trim();
  if (!raw) return collected;

  const step = nextStep(collected);

  if (step === "proposerLegalName" && !collected.proposerLegalName && looksLikePlainName(raw)) {
    collected.proposerLegalName = raw;
    return collected;
  }

  if (step === "proposedPurchasePriceUsd" && collected.proposedPurchasePriceUsd == null) {
    const n = parseMoneyNumber(raw);
    if (n != null && n > 0) collected.proposedPurchasePriceUsd = n;
    return collected;
  }

  if (step === "initialDepositUsd" && collected.initialDepositUsd == null) {
    const n = parseMoneyNumber(raw);
    if (n != null && n >= 0) collected.initialDepositUsd = n;
    return collected;
  }

  if (step === "financingType" && !collected.financingType) {
    const v = raw.trim().toLowerCase();
    if (v === "cash" || v === "loan") collected.financingType = v as "cash" | "loan";
    return collected;
  }

  if (step === "downPaymentUsd" && collected.downPaymentUsd == null) {
    const n = parseMoneyNumber(raw);
    if (n != null && n >= 0) collected.downPaymentUsd = n;
    return collected;
  }

  if (step === "loanAmountUsd" && collected.loanAmountUsd == null) {
    const n = parseMoneyNumber(raw);
    if (n != null && n >= 0) collected.loanAmountUsd = n;
    return collected;
  }

  if (step === "contingencies" && !collected.contingencies) {
    if (!raw.includes(":") && raw.length <= 5000) collected.contingencies = raw;
    return collected;
  }

  return collected;
}

function parseMoneyNumber(raw: string): number | null {
  const cleaned = raw.replace(/[$,]/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function extractCollected(messages: IncomingMessage[]): Collected {
  const out: Collected = {};

  for (const m of messages) {
    if (m.role !== "user") continue;
    const t = messageText(m).trim();
    if (!t) continue;

    // Legal name
    {
      const mm = t.match(/^legal name\s*:\s*(.+)$/i);
      if (mm?.[1]) out.proposerLegalName = mm[1].trim();
    }

    // Purchase price
    {
      const mm = t.match(/^(purchase price|proposal price|price)\s*:\s*(.+)$/i);
      const n = mm?.[2] ? parseMoneyNumber(mm[2]) : null;
      if (n != null && n > 0) out.proposedPurchasePriceUsd = n;
    }

    // Initial deposit
    {
      const mm = t.match(/^(initial deposit|deposit)\s*:\s*(.+)$/i);
      const n = mm?.[2] ? parseMoneyNumber(mm[2]) : null;
      if (n != null && n >= 0) out.initialDepositUsd = n;
    }

    // Financing
    {
      const mm = t.match(/^financing\s*:\s*(cash|loan)$/i);
      if (mm?.[1] === "cash" || mm?.[1] === "loan") out.financingType = mm[1];
    }

    // Down payment / Loan amount (loan flow)
    {
      const mm = t.match(/^(down payment)\s*:\s*(.+)$/i);
      const n = mm?.[2] ? parseMoneyNumber(mm[2]) : null;
      if (n != null && n >= 0) out.downPaymentUsd = n;
    }
    {
      const mm = t.match(/^(loan amount)\s*:\s*(.+)$/i);
      const n = mm?.[2] ? parseMoneyNumber(mm[2]) : null;
      if (n != null && n >= 0) out.loanAmountUsd = n;
    }

    // Contingencies
    {
      const mm = t.match(/^contingencies\s*:\s*(.+)$/i);
      if (mm?.[1]) out.contingencies = mm[1].trim();
    }

    // Proof of funds: our UI sends "Proof of funds uploaded. bucket=... path=..."
    {
      const mm = t.match(/bucket\s*=\s*([^\s]+)\s+path\s*=\s*([^\s]+)\s*$/i);
      if (/proof of funds uploaded/i.test(t) && mm?.[1] && mm?.[2]) {
        out.proofOfFunds = { bucket: mm[1].trim(), path: mm[2].trim() };
      }
    }
  }

  return out;
}

type Step =
  | "proposerLegalName"
  | "proposedPurchasePriceUsd"
  | "initialDepositUsd"
  | "financingType"
  | "downPaymentUsd"
  | "loanAmountUsd"
  | "contingencies"
  | "proofOfFunds"
  | "finalConfirm";

function nextStep(collected: Collected): Step {
  if (!collected.proposerLegalName) return "proposerLegalName";
  if (collected.proposedPurchasePriceUsd == null) return "proposedPurchasePriceUsd";
  if (collected.initialDepositUsd == null) return "initialDepositUsd";
  if (!collected.financingType) return "financingType";
  if (collected.financingType === "loan") {
    if (collected.downPaymentUsd == null) return "downPaymentUsd";
    if (collected.loanAmountUsd == null) return "loanAmountUsd";
  }
  if (!collected.contingencies) return "contingencies";
  if (!collected.proofOfFunds?.path) return "proofOfFunds";
  return "finalConfirm";
}

function toCents(usd: number) {
  return Math.round(usd * 100);
}

async function submitProposalDirect(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  context: ConciergeContext;
  input: z.infer<typeof ConciergeProposalSchema>;
}) {
  const { supabase, userId, context, input } = args;
  const reasons = validateGate(input);
  if (reasons.length > 0) {
    return { decision: "deny" as const, reasons };
  }

  const isPlace = !!(context.placeAddress && typeof context.placeLat === "number" && typeof context.placeLng === "number");
  const isProperty = !!context.propertyId;
  if (!isPlace && !isProperty) {
    return {
      decision: "deny" as const,
      reasons: ["Missing target (propertyId or place address). Please refresh and try again."],
    };
  }

  const payload = {
    ...input,
    context,
    submittedAt: new Date().toISOString(),
    userId,
  };

  const baseRow = {
    user_id: userId,
    offer_amount_cents: toCents(input.proposedPurchasePriceUsd),
    purchase_price_cents: toCents(input.proposedPurchasePriceUsd),
    initial_deposit_cents: toCents(input.initialDepositUsd),
    financing_type: input.financingType === "cash" ? "cash" : "conventional",
    closing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    accepted_terms: true,
    accepted_terms_at: new Date().toISOString(),
    proposer_legal_name: input.proposerLegalName,
    contingencies: input.contingencies ?? null,
    proof_of_funds: true,
    proof_of_funds_file_path: input.proofOfFunds.path,
    concierge_payload: payload,
    full_notes: input.contingencies ? `Contingencies: ${input.contingencies}` : null,
    down_payment_cents:
      input.financingType === "loan"
        ? toCents(input.downPaymentUsd ?? input.initialDepositUsd)
        : toCents(input.initialDepositUsd),
    loan_amount_cents: input.financingType === "loan" ? toCents(input.loanAmountUsd ?? 0) : null,
    status: "verified",
  };

  const insertResult = isPlace
    ? await supabase
        .from("place_proposals")
        .insert({
          ...baseRow,
          place_address: context.placeAddress!,
          place_lat: context.placeLat!,
          place_lng: context.placeLng!,
        })
        .select("id")
        .single()
    : await supabase
        .from("proposals")
        .insert({
          ...baseRow,
          property_id: context.propertyId!,
        })
        .select("id")
        .single();

  if (insertResult.error) {
    return { decision: "deny" as const, reasons: [insertResult.error.message] };
  }

  return { decision: "verified" as const, proposalId: insertResult.data.id };
}

function validateGate(input: z.infer<typeof ConciergeProposalSchema>) {
  const reasons: string[] = [];

  if (!input.proofOfFunds?.path) {
    reasons.push("Proof of funds is required (please upload a file).");
  }

  const price = input.proposedPurchasePriceUsd;
  const deposit = input.initialDepositUsd;
  if (deposit > price) {
    reasons.push("Initial deposit cannot exceed the proposed purchase price.");
  }

  if (input.financingType === "cash") {
    // For cash, we accept any deposit <= price; loan fields must not conflict.
    if (input.loanAmountUsd && input.loanAmountUsd > 0) {
      reasons.push("Financing is marked as Cash, but a loan amount was provided.");
    }
  } else {
    const down = input.downPaymentUsd ?? deposit;
    const loan = input.loanAmountUsd;
    if (loan == null) {
      reasons.push("Loan amount is required for Loan financing.");
    } else {
      const sum = Math.round((down + loan) * 100) / 100;
      const priceRounded = Math.round(price * 100) / 100;
      if (Math.abs(sum - priceRounded) > 1) {
        reasons.push("For Loan financing, down payment + loan amount must equal the purchase price.");
      }
    }
  }

  return reasons;
}

export async function POST(req: NextRequest) {
  let body: { messages?: IncomingMessage[]; context?: ConciergeContext };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return textStreamResponse("I couldn’t read that message (invalid JSON). Please retry.", 400);
  }

  try {
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const modelMessages = await convertToModelMessages(
      messages as unknown as Parameters<typeof convertToModelMessages>[0]
    );
    const context = (body.context ?? {}) as ConciergeContext;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return textStreamResponse("Please sign in to use the Proposal Concierge.", 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_verified, full_name")
      .eq("id", user.id)
      .single();

    if (!profile?.is_verified) {
      return textStreamResponse(
        "Please verify your email to activate your account before submitting proposals.",
        403
      );
    }

    const collected = fillFromPlainAnswer(extractCollected(messages), messages);
    const step = nextStep(collected);
    const lastUser = lastUserText(messages).trim().toLowerCase();
    const wantsFinalize =
      step === "finalConfirm" && (lastUser === "yes" || lastUser === "confirm" || lastUser === "submit");

    // For the final step, bypass the model and submit directly. This avoids "empty stream"
    // issues when the model emits only tool events (which TextStreamChatTransport ignores).
    if (wantsFinalize) {
      const parsed = ConciergeProposalSchema.safeParse({
        proposerLegalName: collected.proposerLegalName,
        proposedPurchasePriceUsd: collected.proposedPurchasePriceUsd,
        initialDepositUsd: collected.initialDepositUsd,
        financingType: collected.financingType,
        downPaymentUsd: collected.downPaymentUsd,
        loanAmountUsd: collected.loanAmountUsd,
        contingencies: collected.contingencies,
        proofOfFunds: collected.proofOfFunds,
      });

      if (!parsed.success) {
        return textStreamResponse(
          "I’m missing a required detail to submit. Please use the required one-line format for the current question, then confirm.",
          200
        );
      }

      const decision = await submitProposalDirect({
        supabase,
        userId: user.id,
        context,
        input: parsed.data,
      });

      if (decision.decision === "deny") {
        return textStreamResponse(
          `I can’t submit yet:\n- ${decision.reasons.join("\n- ")}\n\nReply with the corrected line, then say: Yes`,
          200
        );
      }

      return textStreamResponse(
        `Submitted as verified. Proposal ID: ${decision.proposalId}\n\nIf you need to change anything, open the concierge again and start a new submission.`,
        200
      );
    }

    const system = [
      "You are HomePosal's Proposal Concierge.",
      "Your job is to help the buyer complete a proposal with minimal confusion.",
      "",
      "Conversation style requirements:",
      "- Ask EXACTLY ONE question at a time.",
      "- Keep replies short (2–4 sentences).",
      "- Always show the exact reply format you want (a single-line example).",
      "- If the user replies with something ambiguous, ask a clarifying question instead of guessing.",
      "- Do not mention internal tool names, schemas, or token limits.",
      "",
      "You MUST follow this strict flow:",
      "1) Ask for the current field only.",
      "2) After user answers, repeat back what you captured and ask them to confirm with: \"Yes\" or provide a corrected line in the same format.",
      "3) Only move to the next field after confirmation.",
      "",
      `Server-tracked progress (do not contradict): step=${step}`,
      `Already captured (may be partial): ${JSON.stringify(collected)}`,
      "",
      "You must collect exactly these fields, and confirm each item before moving on:",
      "- proposerLegalName (legal name of the buyer)",
      "- proposedPurchasePriceUsd (number in USD)",
      "- initialDepositUsd (number in USD)",
      "- financingType: cash or loan",
      "- contingencies (free text; allow 'none')",
      "- proofOfFunds: the user must upload a file using the paperclip button in the UI (they cannot paste it)",
      "",
      "If financingType=loan, also collect downPaymentUsd and loanAmountUsd and ensure they reconcile:",
      "downPaymentUsd + loanAmountUsd must equal proposedPurchasePriceUsd.",
      "",
      "Real-time validation: if proposedPurchasePriceUsd is significantly below market value, gently ask if they want to adjust or explain.",
      `Market value reference (if provided): zestimateUsd=${context.zestimateUsd ?? "null"}; listPriceUsd=${context.listPriceUsd ?? "null"}.`,
      "Treat 'significantly below' as under 80% of market value (when that value is available).",
      "",
      "User guidance templates you MUST use:",
      "- For legal name: Example reply: \"Legal name: Jane Q. Buyer\"",
      "- For price: Example reply: \"Purchase price: 850000\"",
      "- For deposit: Example reply: \"Initial deposit: 50000\"",
      "- For financing: Example reply: \"Financing: cash\" OR \"Financing: loan\"",
      "- For down payment (loan only): Example reply: \"Down payment: 150000\"",
      "- For loan amount (loan only): Example reply: \"Loan amount: 700000\"",
      "- For contingencies: Example reply: \"Contingencies: inspection, appraisal\" OR \"Contingencies: none\"",
      "- For proof of funds: tell them: \"Upload your proof of funds using the paperclip, then say: Proof uploaded\"",
      "",
      "Tool usage rule:",
      "- Only call submit_proposal when step=finalConfirm AND the user explicitly confirms (they say: Yes).",
      `- Right now, user confirmation for final submit is: ${wantsFinalize ? "YES" : "NO"}.`,
      "If the tool returns a denial, explain the denial and tell them what to fix, then continue the interview.",
    ].join("\n");

    const modelName =
      (process.env.GOOGLE_CONCIERGE_MODEL || process.env.GOOGLE_GENERATIVE_AI_MODEL || "").trim() ||
      "gemini-flash-latest";

    const result = streamText({
      model: google(modelName),
      system,
      messages: modelMessages,
      tools: {
        submit_proposal: tool({
        description:
          "Final submission gate: validates internal consistency, requires proof of funds, and saves proposal as verified.",
        inputSchema: zodSchema(ConciergeProposalSchema),
        execute: async (input) => {
          const reasons = validateGate(input);
          if (reasons.length > 0) {
            return { decision: "deny" as const, reasons };
          }

          const isPlace = !!(context.placeAddress && typeof context.placeLat === "number" && typeof context.placeLng === "number");
          const isProperty = !!context.propertyId;
          if (!isPlace && !isProperty) {
            return {
              decision: "deny" as const,
              reasons: ["Missing target (propertyId or place address). Please refresh and try again."],
            };
          }

          const payload = {
            ...input,
            context,
            submittedAt: new Date().toISOString(),
            userId: user.id,
          };

          const baseRow = {
            user_id: user.id,
            offer_amount_cents: toCents(input.proposedPurchasePriceUsd),
            purchase_price_cents: toCents(input.proposedPurchasePriceUsd),
            initial_deposit_cents: toCents(input.initialDepositUsd),
            financing_type: input.financingType === "cash" ? "cash" : "conventional",
            closing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            accepted_terms: true,
            accepted_terms_at: new Date().toISOString(),
            proposer_legal_name: input.proposerLegalName,
            contingencies: input.contingencies ?? null,
            proof_of_funds: true,
            proof_of_funds_file_path: input.proofOfFunds.path,
            concierge_payload: payload,
            full_notes: input.contingencies ? `Contingencies: ${input.contingencies}` : null,
            down_payment_cents:
              input.financingType === "loan"
                ? toCents(input.downPaymentUsd ?? input.initialDepositUsd)
                : toCents(input.initialDepositUsd),
            loan_amount_cents:
              input.financingType === "loan" ? toCents(input.loanAmountUsd ?? 0) : null,
            status: "verified",
          };

          const insertResult = isPlace
            ? await supabase
                .from("place_proposals")
                .insert({
                  ...baseRow,
                  place_address: context.placeAddress!,
                  place_lat: context.placeLat!,
                  place_lng: context.placeLng!,
                })
                .select("id")
                .single()
            : await supabase
                .from("proposals")
                .insert({
                  ...baseRow,
                  property_id: context.propertyId!,
                })
                .select("id")
                .single();

          if (insertResult.error) {
            return { decision: "deny" as const, reasons: [insertResult.error.message] };
          }

          return { decision: "verified" as const, proposalId: insertResult.data.id };
        },
        }),
      },
    });

    return result.toTextStreamResponse();
  } catch (e) {
    console.error("[concierge] route error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return textStreamResponse(`Concierge failed. ${msg}`, 500);
  }
}

