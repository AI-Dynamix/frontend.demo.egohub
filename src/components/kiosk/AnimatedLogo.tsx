

interface AnimatedLogoProps {
    className?: string
    scale?: number
}

export default function AnimatedLogo({ className = "", scale = 1 }: AnimatedLogoProps) {
    const currentTheme = {
        cssGradient: 'linear-gradient(135deg, #f97316 0%, #facc15 40%, #059669 100%)',
        shadowColor: '#facc15',
    }

    return (
        <div className={`flex items-center ${className}`} style={{ transform: `scale(${scale})` }}>
            <span
                className="text-7xl font-black italic tracking-tighter bg-clip-text text-transparent animate-pulse"
                style={{
                    backgroundImage: currentTheme.cssGradient,
                    fontFamily: 'sans-serif',
                    paddingRight: '0.1em',
                    filter: `drop-shadow(0 0 25px ${currentTheme.shadowColor})`
                }}
            >
                eGO!
            </span>
        </div>
    )
}
