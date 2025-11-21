import { forwardRef, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  id?: string;
}

const A4LandscapeContainer = forwardRef<HTMLDivElement, Props>(
  ({ children, className = '', id = 'landscape-print-wrapper' }, ref) => (
    <div
      id={id}
      ref={ref}
      className={`bg-white shadow-lg p-[12mm] w-[297mm] min-h-[210mm] origin-top transform scale-[0.8] font-serif text-black leading-[1.4] print-wrapper print-landscape page-landscape ${className}`}
      style={{ backgroundColor: '#ffffff', color: '#000000' }}
    >
      {children}
    </div>
  ),
);

A4LandscapeContainer.displayName = 'A4LandscapeContainer';

export default A4LandscapeContainer;

