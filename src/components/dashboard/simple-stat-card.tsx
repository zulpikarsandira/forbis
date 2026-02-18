import { LucideIcon, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleStatCardProps {
    icon: LucideIcon;
    value: string;
    label: string;
    colorClass?: string;
    className?: string;
}

export function SimpleStatCard({ icon: Icon, value, label, colorClass = "bg-primary", className }: SimpleStatCardProps) {
    return (
        <div className={cn("bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-full min-h-[200px]", className)}>
            <div className="flex justify-between items-start w-full">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-md shrink-0", colorClass)}>
                    <Icon className="h-6 w-6" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-300 shrink-0" />
            </div>

            <div className="mt-8 min-w-0">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight break-all mb-1">{value}</h3>
                <p className="text-sm font-medium text-gray-500 truncate uppercase tracking-wide text-xs opacity-70">{label}</p>
            </div>
        </div>
    );
}
