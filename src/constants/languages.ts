export interface LanguageConfig {
    code: string;
    label: string;
    greeting: string;
    welcome: string;
    flag: string;
    countryCode: string; // For flag-icons (e.g., vn, gb, jp, kr, cn)
}

export const LANGUAGES: LanguageConfig[] = [
    {
        code: 'vn',
        label: 'Tiếng Việt',
        greeting: 'Xin chào',
        welcome: 'Chào mừng bạn đến với cổng thông tin du lịch với hướng dẫn viên AI.',
        flag: '🇻🇳',
        countryCode: 'vn'
    },
    {
        code: 'en',
        label: 'English',
        greeting: 'Hello',
        welcome: 'Welcome to the Smart Tourism Portal with AI Guide.',
        flag: '🇬🇧',
        countryCode: 'gb'
    },
    {
        code: 'jp',
        label: '日本語',
        greeting: 'Konnichiwa',
        welcome: 'AIガイド付きスマート観光ポータルへようこそ。',
        flag: '🇯🇵',
        countryCode: 'jp'
    },
    {
        code: 'kr',
        label: '한국어',
        greeting: 'Annyeonghaseyo',
        welcome: 'AI 가이드를 동반한 스마트 관광 포털에 오신 것을 환영합니다.',
        flag: '🇰🇷',
        countryCode: 'kr'
    },
    {
        code: 'cn',
        label: '中文',
        greeting: 'Ni Hao',
        welcome: '欢迎来到配备 AI 导游的智慧旅游门户。',
        flag: '🇨🇳',
        countryCode: 'cn'
    },
];
