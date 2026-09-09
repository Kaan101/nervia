import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 16, children, ...rest }: P) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false" {...rest}
    >
      {children}
    </svg>
  );
}

export const IconDashboard = (p: P) => (
  <Base {...p}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Base>
);
export const IconProcess = (p: P) => (
  <Base {...p}><rect x="3" y="4" width="6" height="5" rx="1.5" /><rect x="15" y="4" width="6" height="5" rx="1.5" /><rect x="9" y="15" width="6" height="5" rx="1.5" /><path d="M6 9v3.5h12V9M12 12.5V15" /></Base>
);
export const IconRisk = (p: P) => (
  <Base {...p}><path d="M12 3.6 2.8 19.2a1.2 1.2 0 0 0 1 1.8h16.4a1.2 1.2 0 0 0 1-1.8Z" /><path d="M12 9.5v4.2" /><circle cx="12" cy="17" r="0.6" fill="currentColor" /></Base>
);
export const IconControl = (p: P) => (
  <Base {...p}><path d="M12 3 4.5 6v6c0 4.4 3 8 7.5 9 4.5-1 7.5-4.6 7.5-9V6Z" /><path d="m9 12 2.2 2.2L15.3 10" /></Base>
);
export const IconHeat = (p: P) => (
  <Base {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" /></Base>
);
export const IconAction = (p: P) => (
  <Base {...p}><path d="M9 5h10M9 12h10M9 19h10" /><path d="m3 5 1.6 1.6L7.4 3.8M3 12l1.6 1.6 2.8-2.8M3 19l1.6 1.6 2.8-2.8" /></Base>
);
export const IconDoc = (p: P) => (
  <Base {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></Base>
);
export const IconClock = (p: P) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 1.8" /></Base>
);
export const IconChange = (p: P) => (
  <Base {...p}><path d="M20 11a8 8 0 0 0-13.6-5.6L4 8" /><path d="M4 4v4h4" /><path d="M4 13a8 8 0 0 0 13.6 5.6L20 16" /><path d="M20 20v-4h-4" /></Base>
);
export const IconAudit = (p: P) => (
  <Base {...p}><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H16l4 4v11.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5Z" /><path d="M15.5 4v4.5H20" /><path d="M8.5 12.5h7M8.5 16h4.5" /></Base>
);
export const IconNetwork = (p: P) => (
  <Base {...p}><circle cx="12" cy="5" r="2.4" /><circle cx="5" cy="18" r="2.4" /><circle cx="19" cy="18" r="2.4" /><path d="M10.4 6.9 6.3 15.6M13.6 6.9l4.1 8.7M7.4 18h9.2" /></Base>
);
export const IconSparkles = (p: P) => (
  <Base {...p}><path d="M12 3.5 13.7 8.6 19 10.3l-5.3 1.7L12 17.2l-1.7-5.2L5 10.3l5.3-1.7Z" /><path d="M18.5 4v3M20 5.5h-3M6 17v2.5M7.2 18.2H4.8" /></Base>
);
export const IconSearch = (p: P) => (
  <Base {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.4 15.4 4.1 4.1" /></Base>
);
export const IconChevronRight = (p: P) => (<Base {...p}><path d="m9 5 7 7-7 7" /></Base>);
export const IconChevronDown = (p: P) => (<Base {...p}><path d="m5 9 7 7 7-7" /></Base>);
export const IconChevronLeft = (p: P) => (<Base {...p}><path d="m15 5-7 7 7 7" /></Base>);
export const IconClose = (p: P) => (<Base {...p}><path d="M6 6l12 12M18 6 6 18" /></Base>);
export const IconArrowRight = (p: P) => (<Base {...p}><path d="M4 12h15M13 6l6 6-6 6" /></Base>);
export const IconArrowDown = (p: P) => (<Base {...p}><path d="M12 4v15M6 13l6 6 6-6" /></Base>);
export const IconTrendUp = (p: P) => (<Base {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></Base>);
export const IconTrendDown = (p: P) => (<Base {...p}><path d="m3 7 6 6 4-4 8 8" /><path d="M15 17h6v-6" /></Base>);
export const IconTrendFlat = (p: P) => (<Base {...p}><path d="M4 12h13" /><path d="m15 8 4 4-4 4" /></Base>);
export const IconWarning = (p: P) => (
  <Base {...p}><path d="M12 3.6 2.8 19.2a1.2 1.2 0 0 0 1 1.8h16.4a1.2 1.2 0 0 0 1-1.8Z" /><path d="M12 9.5v4.2" /><circle cx="12" cy="17" r="0.6" fill="currentColor" /></Base>
);
export const IconLock = (p: P) => (
  <Base {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2" /><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" /></Base>
);
export const IconShield = (p: P) => (
  <Base {...p}><path d="M12 3 4.5 6v6c0 4.4 3 8 7.5 9 4.5-1 7.5-4.6 7.5-9V6Z" /><path d="M9.4 12.2h2.2" /><circle cx="13.6" cy="12.2" r="1.6" /><path d="M13.6 13.8v2.4" /></Base>
);
export const IconShieldAlert = (p: P) => (
  <Base {...p}><path d="M12 3 4.5 6v6c0 4.4 3 8 7.5 9 4.5-1 7.5-4.6 7.5-9V6Z" /><path d="M12 8.5v4" /><circle cx="12" cy="15.6" r="0.6" fill="currentColor" /></Base>
);
export const IconMoney = (p: P) => (
  <Base {...p}><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5v5M18 9.5v5" /></Base>
);
export const IconGavel = (p: P) => (
  <Base {...p}><path d="M4 20h9M6.5 15.5l5-5M9 6.5 15.5 13M12.6 3.9l7.5 7.5M11 5.5 9 7.5M18.5 13l-2 2" /></Base>
);
export const IconUsers = (p: P) => (
  <Base {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" /><path d="M16 5.4a3.2 3.2 0 0 1 0 5.2M17.5 14.4a5.5 5.5 0 0 1 3 5.1" /></Base>
);
export const IconSettings = (p: P) => (
  <Base {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" /></Base>
);
export const IconLogout = (p: P) => (
  <Base {...p}><path d="M14.5 4.5h3A2 2 0 0 1 19.5 6.5v11a2 2 0 0 1-2 2h-3" /><path d="M10 8l-4 4 4 4M6 12h9" /></Base>
);
export const IconFilter = (p: P) => (<Base {...p}><path d="M3.5 5.5h17l-6.5 7.6v5.6l-4 2v-7.6Z" /></Base>);
export const IconCheck = (p: P) => (<Base {...p}><path d="m5 12.5 4.5 4.5L19 7" /></Base>);
export const IconPlus = (p: P) => (<Base {...p}><path d="M12 5v14M5 12h14" /></Base>);
export const IconExternal = (p: P) => (
  <Base {...p}><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" /></Base>
);
export const IconLayers = (p: P) => (
  <Base {...p}><path d="m12 3 9 4.6-9 4.6-9-4.6Z" /><path d="m3.5 12 8.5 4.3 8.5-4.3M3.5 16.4 12 20.7l8.5-4.3" /></Base>
);
export const IconList = (p: P) => (<Base {...p}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></Base>);
export const IconFlow = (p: P) => (
  <Base {...p}><rect x="2.5" y="9" width="6" height="6" rx="1.5" /><rect x="15.5" y="9" width="6" height="6" rx="1.5" /><path d="M8.5 12h7" /><path d="m13.4 9.8 2.1 2.2-2.1 2.2" /></Base>
);
export const IconMenu = (p: P) => (<Base {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Base>);
export const IconRefresh = (p: P) => (
  <Base {...p}><path d="M20.5 11a8.5 8.5 0 0 0-14.6-5.4L3.5 8" /><path d="M3.5 3.5V8H8" /><path d="M3.5 13a8.5 8.5 0 0 0 14.6 5.4l2.4-2.4" /><path d="M20.5 20.5V16H16" /></Base>
);
export const IconBook = (p: P) => (
  <Base {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" /></Base>
);
export const IconTarget = (p: P) => (
  <Base {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.6" /><circle cx="12" cy="12" r="1" fill="currentColor" /></Base>
);
export const IconCalendar = (p: P) => (
  <Base {...p}><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></Base>
);
