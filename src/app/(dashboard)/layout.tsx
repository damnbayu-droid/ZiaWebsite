import { BottomNav } from '@/components/BottomNav';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <div className="pb-32">
                {children}
            </div>
            <BottomNav />
        </>
    );
}
