import { forwardRef, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  id?: string;
}

const A4Container = forwardRef<HTMLDivElement, Props>(({ children, className = '', id = 'document-print-wrapper' }, ref) => (
  <div
    id={id}
    ref={ref}
    className={`bg-white shadow-lg p-[10mm] w-[210mm] min-h-[297mm] origin-top transform scale-90 font-serif text-black leading-[1.5] ${className}`}
    style={{ backgroundColor: '#ffffff', color: '#000000' }}
  >
    {children}
  </div>
));

A4Container.displayName = 'A4Container';
export default A4Container;
