import React from 'react';

const Icon = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

export const ShieldIcon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </Icon>
);

export const LockIcon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
);

export const AnonymousIcon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M18 11a6 6 0 0 0-12 0" />
    <line x1="8" y1="15" x2="16" y2="15" />
    <line x1="9" y1="18" x2="15" y2="18" />
  </Icon>
);

export const SendIcon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </Icon>
);

export const GovLogo = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M12 6l-6 2v8h12V8l-6-2zm0-4l8 4v12H4V6l8-4z" />
  </Icon>
);

export const NGOIcon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M12 2L2 7v10l10 5 10-5V7l-10-5zM12 17.5l-7-3.5v-7l7 3.5 7-3.5v7l-7 3.5z" />
    <path d="M12 17.5l-7-3.5v3.5l7 3.5 7-3.5v-3.5l-7 3.5z" />
  </Icon>
);

export const PlusIcon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </Icon>
);

export const ClockIcon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4l3 3" />
  </Icon>
);

export const DocumentIcon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
    <polyline points="14 2 14 8 20 8" />
  </Icon>
);

export const ShieldLockIcon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </Icon>
);

export const CheckCircleIcon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);

export const CloseIcon = ({ className }: { className?: string }) => (
  <Icon className={className}>
    <path d="M6 18L18 6M6 6l12 12" />
  </Icon>
);