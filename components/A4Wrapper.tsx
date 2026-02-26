import { forwardRef, ReactNode } from 'react';

interface A4WrapperProps {
  children: ReactNode;
  className?: string;
  id?: string;
  height?: string; // Custom height (e.g., '297mm' for full A4, '99mm' for 1/3 A4)
}

const A4Wrapper = forwardRef<HTMLDivElement, A4WrapperProps>(({ children, className = '', id = 'invoice-print-wrapper', height = '297mm' }, ref) => {
  return (
    <div
      id={id}
      ref={ref}
      className={`bg-white shadow-lg p-[10mm] w-[210mm] origin-top transform scale-90 font-serif text-black leading-[1.5] ${className}`}
      style={{ backgroundColor: '#ffffff', color: '#000000', minHeight: height }}
    >
      {children}
    </div>
  );
});

A4Wrapper.displayName = 'A4Wrapper';

export default A4Wrapper;

