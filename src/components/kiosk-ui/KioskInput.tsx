import { InputHTMLAttributes } from 'react'
import { MagnifyingGlass, XCircle } from '@phosphor-icons/react'

interface KioskInputProps extends InputHTMLAttributes<HTMLInputElement> {
    onClear?: () => void
    leftIcon?: boolean
}

export default function KioskInput({
    className = '',
    value,
    onClear,
    leftIcon = true,
    onChange,
    ...props
}: KioskInputProps) {
    return (
        <div className={`relative h-20 w-full ${className}`}>
            <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-inner flex items-center px-6 gap-4 focus-within:bg-white/15 focus-within:border-white/30 transition-all">
                {leftIcon && (
                    <MagnifyingGlass size={32} className="text-white/50 shrink-0" />
                )}

                <input
                    value={value}
                    onChange={onChange}
                    className="flex-1 bg-transparent h-full text-2xl font-medium text-white placeholder-white/30 focus:outline-none"
                    {...props}
                />

                {value && onClear && (
                    <button
                        onClick={onClear}
                        className="text-white/40 hover:text-white transition-colors p-2"
                    >
                        <XCircle size={32} weight="fill" />
                    </button>
                )}
            </div>
        </div>
    )
}
