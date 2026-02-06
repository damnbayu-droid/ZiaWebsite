import AIBubble from '@/components/AIBubble';
import { NotificationService } from '@/components/NotificationService';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="pb-32">
            {children}
            <AIBubble />
            <NotificationService />
        </div>
    );
}
