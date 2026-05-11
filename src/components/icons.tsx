/** Shared stroke icons for header / shelves / settings */

export function IconSettings({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconLogOut({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevronLeft({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSearch({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="11" cy="11" r="6.5" strokeLinecap="round" />
      <path d="M16.5 16.5L21 21" strokeLinecap="round" />
    </svg>
  );
}

export function IconMenu({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export function IconClipboard({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Grocery cart — “fill the fridge” from clipboard. */
export function IconShoppingCart({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M6 6h15l-1.5 9h-12L6 6z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 6L5 3H2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="20" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPlus({ className = "h-[18px] w-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

/** Link card — opens details / reminders / shelf actions (replaces pencil). */
export function IconLinkSliders({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" d="M4 7h6M13 7h7" />
      <rect x="9" y="5.25" width="3.5" height="3.5" rx="0.9" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" d="M4 12h10M16 12h4" />
      <rect x="13" y="10.25" width="3.5" height="3.5" rx="0.9" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" d="M4 17h4M11 17h9" />
      <rect x="7" y="15.25" width="3.5" height="3.5" rx="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Fridge shelf — simple two-door outline. */
export function IconFridge({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M5 12h14" strokeLinecap="round" />
      <path d="M12 12V21" strokeLinecap="round" />
      <path d="M9 6.5h6" strokeLinecap="round" />
    </svg>
  );
}

/** Freezer shelf — geometric snowflake (stroke asterisk). */
export function IconSnowflake({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" aria-hidden>
      <path d="M12 3v18M3 12h18M5.64 5.64l12.72 12.72M18.36 5.64L5.64 18.36" strokeLinecap="round" />
    </svg>
  );
}

/** Meat cold drawer — same stroke language as fridge (stacked drawers). */
export function IconMeatLocker({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" aria-hidden>
      <rect x="5.5" y="3.5" width="13" height="17" rx="2" />
      <path d="M5.5 9.5h13M5.5 13.5h13M5.5 17.5h13" strokeLinecap="round" />
      <path d="M15.5 6v-1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Fruit cold locker — fridge-family outline with vent / dots. */
export function IconFruitLocker({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" aria-hidden>
      <rect x="5.5" y="3.5" width="13" height="17" rx="2" />
      <path d="M12 3.5V2" strokeLinecap="round" />
      <path d="M5.5 10h13" strokeLinecap="round" />
      <circle cx="9.25" cy="14" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="14.75" cy="14" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="9.25" cy="17.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="14.75" cy="17.5" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Trash shelf — minimal bin. */
export function IconTrash({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" aria-hidden>
      <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 7h14" strokeLinecap="round" />
      <path d="M7 7l1 12a2 2 0 002 2h4a2 2 0 002-2l1-12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v5M14 11v5" strokeLinecap="round" />
    </svg>
  );
}

/** Share / copy link — arrow up from tray (iOS-style). */
export function IconShare({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M12 3v10M8 7l4-4 4 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 15v3a2 2 0 002 2h10a2 2 0 002-2v-3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Pin marker — clean map-pin style for pinned links. */
export function IconPin({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M12 21v-5" strokeLinecap="round" />
      <path
        d="M8.2 11.2l3.3-7.1a.55.55 0 011 0l3.3 7.1a3.8 3.8 0 01-3.45 5.38h-.7a3.8 3.8 0 01-3.45-5.38z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="1.35" fill="currentColor" stroke="none" />
    </svg>
  );
}

