import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { badgeTone } from "./format.js";
import { readMotion, readTheme, toggleMotion, toggleTheme } from "./theme.js";

export function Mark({ quiet = false }) {
  return (
    <span className={quiet ? "gw-mark gw-mark-quiet" : "gw-mark"} aria-hidden="true">
      G
    </span>
  );
}

export function Button({
  variant = "ghost",
  size,
  busy = false,
  className = "",
  children,
  type = "button",
  ...props
}) {
  const classes = [
    "cq-btn",
    `cq-btn-${variant}`,
    "cq-btn-no-ico",
    size === "sm" ? "cq-btn-sm" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type={type}
      className={classes}
      aria-busy={busy ? "true" : undefined}
      {...props}
      disabled={props.disabled || busy}
    >
      {busy ? (
        <span className="cq-btn-spinner" aria-hidden="true">
          <span className="gw-spinner" />
        </span>
      ) : null}
      <span className="cq-btn-label">{children}</span>
    </button>
  );
}

export function StatusBadge({ status }) {
  const display = (status || "UNKNOWN").toString().toUpperCase();
  const tone = badgeTone(display);
  return <span className={tone ? `cq-badge cq-badge-${tone}` : "cq-badge"}>{display}</span>;
}

export function Page({ children }) {
  return <section className="gw-page">{children}</section>;
}

export function PageHeader({ kicker, title, lede, actions }) {
  return (
    <header className="gw-page-head">
      <div className="gw-page-copy">
        {kicker ? <p className="t-overline gw-kicker">{kicker}</p> : null}
        <h1 className="t-h1">{title}</h1>
        {lede ? <p className="t-body gw-lede">{lede}</p> : null}
      </div>
      {actions ? <div className="gw-actions">{actions}</div> : null}
    </header>
  );
}

export function Banner({ children, action }) {
  return (
    <div className="gw-banner" role="alert">
      <p className="t-body-s">{children}</p>
      {action}
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="cq-table-wrap">
      <div className="cq-state">
        <Mark quiet />
        <p className="cq-state-title">{title}</p>
        {body ? <p className="cq-state-body">{body}</p> : null}
        {action}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 8, cols = 5 }) {
  return (
    <div className="cq-table-wrap" aria-busy="true">
      <p className="cq-sr-only">Loading</p>
      <table className="cq-table">
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: cols }, (_, col) => (
                <td key={col}>
                  <span className="cq-skeleton gw-skel" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel, busy }) {
  const headingId = useId();
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog || dialog.open) return;
    dialog.showModal();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      className="cq-dialog"
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 id={headingId} className="t-h3 cq-dialog-title">
        {title}
      </h2>
      <p className="cq-dialog-body">{body}</p>
      <div className="cq-dialog-actions">
        <Button onClick={onCancel}>Keep it</Button>
        <Button variant="destructive" busy={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}

function useRootSetting(read) {
  const [value, setValue] = useState(read);
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setValue(read()));
    observer.observe(root, { attributes: true, attributeFilter: ["class", "data-motion"] });
    return () => observer.disconnect();
  }, [read]);
  return value;
}

function ThemeButton() {
  const theme = useRootSetting(readTheme);
  return (
    <Button size="sm" onClick={toggleTheme}>
      {theme === "light" ? "Use dark mode" : "Use light mode"}
    </Button>
  );
}

function MotionButton() {
  const motion = useRootSetting(readMotion);
  return (
    <Button size="sm" onClick={toggleMotion}>
      {motion === "reduced" ? "Use full motion" : "Reduce motion"}
    </Button>
  );
}

function itemActive(pathname, item) {
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function AppShell({ product, nav, user, onSignOut, children }) {
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const menuRef = useRef(null);
  const items = nav.map((item) => ({ ...item, active: itemActive(location.pathname, item) }));

  useEffect(() => {
    const current = items.find((item) => item.active);
    document.title = current ? `${current.label} · ${product}` : product;
  }, [location.pathname, product, nav]);

  useEffect(() => {
    const dialog = menuRef.current;
    if (!navOpen || !dialog || dialog.open) return;
    dialog.showModal();
  }, [navOpen]);

  return (
    <div className="gw-app">
      <a className="cq-sr-only" href="#main">
        Skip to main
      </a>
      <aside className="cq-sidebar gw-sidebar">
        <div className="gw-brand">
          <Mark />
          <div>
            <p className="t-h4">{product}</p>
            <p className="t-caption gw-brand-sub">Risk-aware data protection</p>
          </div>
        </div>
        <nav className="cq-sidebar-group" aria-label="Primary">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="cq-sidebar-link"
              aria-current={item.active ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="gw-sidebar-foot">
          {user ? (
            <p className="gw-user">
              <span className="t-body-s">{user.username}</span>
              <span className="cq-badge">{user.role}</span>
            </p>
          ) : null}
          <ThemeButton />
          <MotionButton />
          <Button onClick={onSignOut}>Sign out</Button>
        </div>
      </aside>

      {navOpen ? (
      <dialog
        ref={menuRef}
        className="cq-dialog gw-nav-dialog"
        aria-label="Menu"
        onCancel={(event) => {
          event.preventDefault();
          setNavOpen(false);
        }}
      >
        <div className="gw-nav-dialog-head">
          <p className="t-h4">{product}</p>
          <Button size="sm" onClick={() => setNavOpen(false)}>
            Close menu
          </Button>
        </div>
        <nav className="cq-sidebar-group" aria-label="Primary">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="cq-sidebar-link"
              aria-current={item.active ? "page" : undefined}
              onClick={() => setNavOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </dialog>
      ) : null}

      <div className="gw-content">
        <header className="cq-topbar-app">
          <Button className="gw-menu-btn" size="sm" onClick={() => setNavOpen(true)}>
            Open menu
          </Button>
          <p className="t-body-s gw-crumb">{product}</p>
          <div className="gw-top-actions">
            <div className="gw-top-theme">
              <ThemeButton />
            </div>
            {user ? <span className="t-body-s gw-top-user">{user.username}</span> : null}
            <Button size="sm" onClick={onSignOut}>
              Sign out
            </Button>
          </div>
        </header>
        <main id="main" data-density="compact">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AuthScreen({ product, kicker, title, lede, hint, error, busy, onSubmit, username, password, setUsername, setPassword }) {
  useEffect(() => {
    document.title = `${title} · ${product}`;
  }, [product, title]);

  return (
    <main id="main" className="gw-auth">
      <a className="cq-sr-only" href="#auth-form">
        Skip to sign in
      </a>
      <form id="auth-form" className="gw-auth-panel" onSubmit={onSubmit}>
        <div className="gw-brand">
          <Mark />
          <div>
            <p className="t-overline gw-kicker">{kicker}</p>
            <p className="t-h4">{product}</p>
          </div>
        </div>
        <div>
          <h1 className="t-h1">{title}</h1>
          <p className="t-body gw-lede">{lede}</p>
        </div>
        <div className="gw-fields">
          <div className="cq-field">
            <label className="cq-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="cq-input"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>
          <div className="cq-field">
            <label className="cq-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="cq-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? "auth-error" : undefined}
              required
            />
          </div>
        </div>
        {error ? (
          <p id="auth-error" className="cq-error" role="alert">
            {error}
          </p>
        ) : null}
        <Button variant="primary" type="submit" busy={busy}>
          {busy ? "Signing in" : "Sign in"}
        </Button>
        {hint ? <p className="t-caption gw-hint">{hint}</p> : null}
        <div className="gw-actions">
          <ThemeButton />
          <MotionButton />
        </div>
      </form>
    </main>
  );
}
