import { ArrowLeft } from '@phosphor-icons/react'

interface EngineeringDetailHeaderProps {
    title: string
    subtitle?: string
    icon?: React.ElementType
    onBack: () => void
    rightElement?: React.ReactNode
}

export default function EngineeringDetailHeader({
    title,
    subtitle,
    icon: Icon,
    onBack,
    rightElement
}: EngineeringDetailHeaderProps) {
    return (
        <div className="w-full h-full bg-slate-900/50 rounded-2xl border border-white/10 flex items-center justify-between px-6 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/80 hover:text-white border border-white/5"
                >
                    <ArrowLeft size={24} weight="bold" />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        {Icon && <Icon size={24} className="text-emerald-400" weight="fill" />}
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-white/40 text-xs font-mono tracking-wider mt-0.5">{subtitle}</p>
                    )}
                </div>
            </div>
            {rightElement && (
                <div className="bg-black/40 px-4 py-2 rounded-lg border border-white/5">
                    {rightElement}
                </div>
            )}
        </div>
    )
}
