function SvgIcon({ children, className = "", ...props }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
            {...props}
        >
            {children}
        </svg>
    );
}

export function ArrowLeftIcon(props) {
    return (
        <SvgIcon {...props}>
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
        </SvgIcon>
    );
}

export function UserIcon(props) {
    return (
        <SvgIcon {...props}>
            <path d="M18 20a6 6 0 0 0-12 0" />
            <circle cx="12" cy="8" r="4" />
        </SvgIcon>
    );
}

export function LockIcon(props) {
    return (
        <SvgIcon {...props}>
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </SvgIcon>
    );
}

export function EyeIcon(props) {
    return (
        <SvgIcon {...props}>
            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
            <circle cx="12" cy="12" r="2.5" />
        </SvgIcon>
    );
}

export function EyeOffIcon(props) {
    return (
        <SvgIcon {...props}>
            <path d="m3 3 18 18" />
            <path d="M10.6 5.1A11.7 11.7 0 0 1 12 5c6.5 0 10 7 10 7a18.6 18.6 0 0 1-3.2 4.4" />
            <path d="M6.7 6.7C4 8.5 2 12 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </SvgIcon>
    );
}

export function MailIcon(props) {
    return (
        <SvgIcon {...props}>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m4 7 8 6 8-6" />
        </SvgIcon>
    );
}

export function CodeIcon(props) {
    return (
        <SvgIcon {...props}>
            <path d="m9 8-4 4 4 4" />
            <path d="m15 8 4 4-4 4" />
            <path d="m13 6-2 12" />
        </SvgIcon>
    );
}

export function BuildingIcon(props) {
    return (
        <SvgIcon {...props}>
            <rect x="4" y="3" width="10" height="18" rx="2" />
            <path d="M14 9h6v12h-6" />
            <path d="M8 7h2" />
            <path d="M8 11h2" />
            <path d="M8 15h2" />
            <path d="M17 13h1" />
            <path d="M17 17h1" />
        </SvgIcon>
    );
}

export function WalletIcon(props) {
    return (
        <SvgIcon {...props}>
            <path d="M3 8a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
            <path d="M16 12h4" />
            <circle cx="16" cy="12" r=".6" fill="currentColor" stroke="none" />
            <path d="M6 6V5a2 2 0 0 1 2-2h9" />
        </SvgIcon>
    );
}

export function BellIcon(props) {
    return (
        <SvgIcon {...props}>
            <path d="M15 17H5l1.5-2.5V10a5.5 5.5 0 1 1 11 0v4.5L19 17h-4" />
            <path d="M10 20a2 2 0 0 0 4 0" />
        </SvgIcon>
    );
}

export function ShieldIcon(props) {
    return (
        <SvgIcon {...props}>
            <path d="m12 3 7 3v5c0 5-3.3 8.7-7 10-3.7-1.3-7-5-7-10V6l7-3Z" />
            <path d="m9.5 12 1.8 1.8 3.7-4" />
        </SvgIcon>
    );
}

export function KeyIcon(props) {
    return (
        <SvgIcon {...props}>
            <circle cx="8" cy="15" r="4" />
            <path d="m12 15 8-8" />
            <path d="M17 8h3v3" />
            <path d="M14.5 10.5 17 13" />
        </SvgIcon>
    );
}

export function CheckCircleIcon(props) {
    return (
        <SvgIcon {...props}>
            <circle cx="12" cy="12" r="9" />
            <path d="m8.5 12 2.3 2.4 4.7-4.9" />
        </SvgIcon>
    );
}
