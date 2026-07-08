import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface BackLinkProps {
  to: string;
  children: ReactNode;
}

export function BackLink({ to, children }: BackLinkProps) {
  return (
    <p>
      <Link to={to}>
        <span className="back-arrow" aria-hidden="true">←</span> {children}
      </Link>
    </p>
  );
}
