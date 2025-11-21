import { forwardRef, ReactNode } from 'react';

interface A4WrapperProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

const A4Wrapper = forwardRef<HTMLDivElement, A4WrapperProps>(({ children, className = '', id = 'invoice-print-wrapper' }, ref) => {
  return (
    <div 
        id={id}
        ref={ref} 
        className={`bg-white shadow-lg p-[10mm] w-[210mm] min-h-[297mm] origin-top transform scale-90 font-serif text-black leading-[1.5] ${className}`}
        style={{ backgroundColor: '#ffffff', color: '#000000' }}
    >
        {children}
    </div>
  );
});

A4Wrapper.displayName = 'A4Wrapper';

export default A4Wrapper;

