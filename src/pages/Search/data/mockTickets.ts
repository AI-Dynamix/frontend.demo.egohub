export const MOCK_TICKETS = [
    {
        id: '1',
        name: 'Vé tham quan Dinh Độc Lập',
        rating: 4.8,
        reviewCount: 5200,
        price: '65.000đ',
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1579965564887-fb2d5f0b43f4?q=80&w=1000&auto=format&fit=crop',
        tags: ['Di tích', 'Lịch sử'],
        location: 'Quận 1',
        isBestSeller: true,
        features: ['Vào cổng trực tiếp', 'Xác nhận tức thì']
    },
    {
        id: '2',
        name: 'Tour Sông Sài Gòn & Ăn Tối',
        rating: 4.6,
        reviewCount: 1800,
        price: '850.000đ',
        originalPrice: '1.200.000đ',
        image: 'https://images.unsplash.com/photo-1565570222238-0be7af89945a?q=80&w=1000&auto=format&fit=crop',
        tags: ['Ăn tối', 'Du thuyền'],
        location: 'Bến Bạch Đằng',
        isBestSeller: true,
        features: ['Bữa tối 5 món', 'Nhạc sống']
    },
    {
        id: '3',
        name: 'Vé xe buýt 2 tầng (Hop-on Hop-off)',
        rating: 4.7,
        reviewCount: 3500,
        price: '150.000đ',
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1000&auto=format&fit=crop',
        tags: ['Tham quan', 'Xe buýt'],
        location: 'TP.HCM',
        isBestSeller: false,
        features: ['24h không giới hạn', 'Audio guide đa ngôn ngữ']
    },
    {
        id: '4',
        name: 'Đài quan sát Landmark 81 SkyView',
        rating: 4.9,
        reviewCount: 4100,
        price: '500.000đ',
        originalPrice: '810.000đ',
        image: 'https://images.unsplash.com/photo-1595175685566-3d7729cb1224?q=80&w=1000&auto=format&fit=crop',
        tags: ['Ngắm cảnh', 'Check-in'],
        location: 'Bình Thạnh',
        isBestSeller: true,
        features: ['Tầng 81', 'Trải nghiệm VR']
    },
    {
        id: '5',
        name: 'Bảo tàng Chứng tích Chiến tranh',
        category: 'museum',
        rating: 4.8,
        reviewCount: 6000,
        price: '40.000đ',
        originalPrice: null,
        image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=1000&auto=format&fit=crop',
        tags: ['Bảo tàng', 'Lịch sử'],
        location: 'Quận 3',
        isBestSeller: false,
        features: ['Hướng dẫn viên audio']
    }
];

export const TICKET_CATEGORIES = [
    { id: 'all', label: 'Tất cả' },
    { id: 'attraction', label: 'Điểm tham quan' },
    { id: 'museum', label: 'Bảo tàng' },
    { id: 'tour', label: 'Tour & Ngắm cảnh' },
    { id: 'activity', label: 'Hoạt động & Trải nghiệm' },
    { id: 'entertainment', label: 'Giải trí' },
];
