import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PurpleStatCardProps {
    title: string;
    value: string;
    subtitle: string;
    className?: string;
}

export function PurpleStatCard({ title, value, subtitle, className }: PurpleStatCardProps) {
    return (
        <div className={cn("relative overflow-hidden rounded-[2rem] bg-gradient-primary p-6 text-white shadow-lg", className)}>
            {/* Decorative Circles */}
            <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full border-[1.5rem] border-white/10" />
            <div className="absolute -bottom-8 right-10 h-32 w-32 rounded-full border-[1.5rem] border-white/10" />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                        <ArrowUpRight className="h-5 w-5 text-muted-foreground/30 shrink-0" />
                    </div>
                </div>

                <div className="mt-8 min-w-0 overflow-hidden">
                    <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-1 break-all">{value}</h3>
                    <p className="text-indigo-100 font-medium tracking-wide uppercase text-[10px] md:text-xs opacity-80 truncate">{subtitle}</p>
                </div>
            </div>
        </div>
    );
}
