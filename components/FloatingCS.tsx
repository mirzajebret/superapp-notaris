import { Headset } from 'lucide-react';

export default function FloatingCS() {
    return (
        <a
            href="https://bu-line-service.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium py-3 px-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 no-print"
        >
            <Headset size={20} />
            <span className="hidden sm:inline">CS AHU</span>
        </a>
    );
}
