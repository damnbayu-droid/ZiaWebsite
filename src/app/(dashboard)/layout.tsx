import AIBubble from '@/components/AIBubble';
import { NotificationService } from '@/components/NotificationService';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <div className="pb-32">
                {children}
                <AIBubble />
                <NotificationService />
            </div>

            {/* Footer with Domain Links */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-2 z-10">
                <div className="flex justify-center items-center gap-2 text-xs text-gray-400">
                    <a href="https://indonesianvisas.com" target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 transition-colors">
                        indonesianvisas.com
                    </a>
                    <span className="text-gray-300">|</span>
                    <a href="https://indodesign.website" target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 transition-colors">
                        indodesign.website
                    </a>
                </div>
            </footer>
        </>
    );
}
