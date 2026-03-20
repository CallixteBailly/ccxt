// ---------------------------------------------------------------------------
// Theme & style constants -- dark trading terminal aesthetic
// ---------------------------------------------------------------------------

export const colors = {
    bg: '#0d1117',
    bgCard: '#161b22',
    bgHover: '#1c2128',
    bgInput: '#0d1117',
    border: '#30363d',
    borderFocus: '#58a6ff',

    text: '#e6edf3',
    textSecondary: '#8b949e',
    textMuted: '#484f58',

    green: '#3fb950',
    greenBg: 'rgba(63, 185, 80, 0.15)',
    red: '#f85149',
    redBg: 'rgba(248, 81, 73, 0.15)',
    yellow: '#d29922',
    yellowBg: 'rgba(210, 153, 34, 0.15)',
    blue: '#58a6ff',
    blueBg: 'rgba(88, 166, 255, 0.15)',
    purple: '#bc8cff',
    gray: '#484f58',
} as const;

export const spacing = {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
} as const;

export const fontSize = {
    xs: '11px',
    sm: '12px',
    md: '14px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    hero: '32px',
} as const;

export const fontFamily = "'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, Consolas, monospace";

// Common inline style objects
export const cardStyle: React.CSSProperties = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    padding: spacing.lg,
};

export const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: fontSize.sm,
};

export const thStyle: React.CSSProperties = {
    textAlign: 'left' as const,
    padding: `${spacing.sm} ${spacing.md}`,
    color: colors.textSecondary,
    fontWeight: 500,
    borderBottom: `1px solid ${colors.border}`,
    fontSize: fontSize.xs,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
};

export const tdStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text,
};

export const buttonStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontFamily,
    fontSize: fontSize.sm,
    fontWeight: 600,
    transition: 'opacity 0.15s',
};

export const buttonPrimary: React.CSSProperties = {
    ...buttonStyle,
    background: colors.blue,
    color: '#fff',
};

export const buttonSuccess: React.CSSProperties = {
    ...buttonStyle,
    background: colors.green,
    color: '#fff',
};

export const buttonDanger: React.CSSProperties = {
    ...buttonStyle,
    background: colors.red,
    color: '#fff',
};

export const buttonSecondary: React.CSSProperties = {
    ...buttonStyle,
    background: colors.bgHover,
    color: colors.text,
    border: `1px solid ${colors.border}`,
};

export const inputStyle: React.CSSProperties = {
    padding: `${spacing.sm} ${spacing.md}`,
    borderRadius: '6px',
    border: `1px solid ${colors.border}`,
    background: colors.bgInput,
    color: colors.text,
    fontFamily,
    fontSize: fontSize.sm,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
};

export const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none' as const,
    paddingRight: spacing.xl,
    cursor: 'pointer',
};

export const labelStyle: React.CSSProperties = {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: spacing.xs,
    display: 'block',
};
