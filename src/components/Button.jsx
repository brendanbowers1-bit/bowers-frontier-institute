export function Button({ children, variant = "primary", href, onClick, type = "button" }) {
  const className = `btn btn--${variant}`;

  if (href) {
    return (
      <a className={className} href={href}>
        {children}
      </a>
    );
  }

  return (
    <button className={className} type={type} onClick={onClick}>
      {children}
    </button>
  );
}
