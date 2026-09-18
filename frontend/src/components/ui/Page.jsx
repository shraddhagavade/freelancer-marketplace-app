/*
 * Kingbolt-style page shell primitives (adapted from public-charging-fe).
 * Recipe: <Page> <PageHeader title /> <Body> ...content... </Body> <Footer/> </Page>
 */
export function Page({ children, className = '' }) {
  return <div className={`page ${className}`}>{children}</div>;
}

export function PageHeader({ title, actions, children }) {
  return (
    <div className="page-header">
      <div className="flex items-center gap-3 min-w-0">
        {title && <h1 className="page-title truncate">{title}</h1>}
        {children}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

export function Body({ children, className = '', scroll = false }) {
  return (
    <div className={`page-body ${scroll ? 'overflow-auto' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function Footer({ children, className = '' }) {
  return (
    <div
      className={`flex items-center justify-end gap-3 px-6 md:px-12 lg:px-16 py-4 bg-white border-t border-brand-divider ${className}`}
    >
      {children}
    </div>
  );
}
