 "use client";

 import { useState } from "react";

 const MOBILE_TEXT =
   "Notice: This property is not currently listed for sale by the owner on this platform. The values shown are independent proposals. To ensure transparency, every proposal is vetted for authenticity—including the verification of proof of funds and pre-approval documentation—before appearing on this page. HomePosal does not represent the owner and has not been solicited to market this property.\nNote to Interested Parties & Owners: If this property is active with a licensed brokerage, please notify us. Once verified, we will direct all interested parties to the official listing and agent to maintain industry protocols.";

 export function StickyDisclosureBanner() {
   const [open, setOpen] = useState(false);

   return (
     <>
       {/* Desktop / larger screens: inline disclosure block (non-sticky) */}
       <div className="hidden md:block rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
         <p className="mb-3">
           <strong className="text-[var(--foreground)]">Notice:</strong> This property is not currently listed for sale by the owner on this platform. The values shown are independent proposals. To ensure transparency, every proposal is vetted for authenticity—including the verification of proof of funds and pre-approval documentation—before appearing on this page. HomePosal does not represent the owner and has not been solicited to market this property.
         </p>
         <p>
           <strong className="text-[var(--foreground)]">Note to Interested Parties &amp; Owners:</strong> If this property is active with a licensed brokerage, please notify us. Once verified, we will direct all interested parties to the official listing and agent to maintain industry protocols.
         </p>
       </div>

       {/* Mobile-only sticky banner */}
       <div className="md:hidden fixed inset-x-0 bottom-0 z-[80] px-3 pb-3 pointer-events-none">
         <div className="pointer-events-auto mx-auto max-w-[95%]">
           <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/85 shadow-lg backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/85">
             <button
               type="button"
               onClick={() => setOpen((v) => !v)}
               aria-expanded={open}
               aria-controls="property-disclosure-content"
               className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100"
             >
               <span>Property Status &amp; Disclosures</span>
               <span className="ml-3 text-xs font-normal text-slate-500 dark:text-slate-400">
                 {open ? "Tap to collapse" : "Tap to expand"}
               </span>
             </button>
             <div
               id="property-disclosure-content"
               className={`px-4 pb-3 text-xs text-slate-700 dark:text-slate-200 transition-all duration-300 ease-out ${
                 open ? "max-h-[260px] translate-y-0 opacity-100" : "max-h-0 -translate-y-1 opacity-0"
               }`}
             >
               {open && (
                 <div className="space-y-2 pt-1">
                   <p>
                     <strong>Notice:</strong> This property is not currently listed for sale by the owner on this
                     platform. The values shown are independent proposals. To ensure transparency, every proposal is
                     vetted for authenticity—including the verification of proof of funds and pre-approval
                     documentation—before appearing on this page. HomePosal does not represent the owner and has not
                     been solicited to market this property.
                   </p>
                   <p>
                     <strong>Note to Interested Parties &amp; Owners:</strong> If this property is active with a licensed
                     brokerage, please notify us. Once verified, we will direct all interested parties to the official
                     listing and agent to maintain industry protocols.
                   </p>
                 </div>
               )}
             </div>
           </div>
         </div>
       </div>
     </>
   );
 }

