import { useState, useEffect } from 'react';

const slogans = [
  { lang: 'vi', prefix: 'AloAI', text1: ' - Sáng tạo', text2: 'theo cách của bạn.' },
  { lang: 'en', prefix: 'AloAI', text1: ' - Create It', text2: 'Your Way.' },
  { lang: 'km', prefix: 'AloAI', text1: ' - បង្កើតស្នាដៃ', text2: 'តាមរបៀបរបស់អ្នក' },
];

export function AnimatedSlogan() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % slogans.length);
        setIsVisible(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const current = slogans[currentIndex];

  return (
    <div className="h-[200px] md:h-[240px] flex items-center justify-center">
      <h1 
        className={`text-5xl md:text-7xl font-bold tracking-tight text-white transition-all duration-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <span className="logo-gradient-animate">
          {current.prefix}
        </span>
        {current.text1}
        <br />
        <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-red-600 bg-clip-text text-transparent">
          {current.text2}
        </span>
      </h1>
    </div>
  );
}


