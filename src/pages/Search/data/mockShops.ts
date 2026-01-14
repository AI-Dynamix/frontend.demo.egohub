import { ShoppingBag, TShirt, DeviceMobile, BookOpen, Gift } from '@phosphor-icons/react';

export const SHOP_CATEGORIES = [
    { id: 'all', label: 'Tất cả', icon: ShoppingBag },
    { id: 'fashion', label: 'Thời trang', icon: TShirt },
    { id: 'electronics', label: 'Điện tử', icon: DeviceMobile },
    { id: 'souvenir', label: 'Lưu niệm', icon: Gift },
    { id: 'book', label: 'Sách & VP', icon: BookOpen },
];

export const MOCK_SHOPS = [
    {
        id: '1',
        name: 'Uniqlo Vincom Center',
        rating: 4.8,
        reviewCount: 3400,
        distance: '0.4 km',
        openTime: '10:00 - 22:00',
        category: 'fashion',
        image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=1000&auto=format&fit=crop',
        tags: ['Quần áo', 'LifeWear'],
        floor: 'L1-L2'
    },
    {
        id: '2',
        name: 'Nhà sách Fahasa',
        rating: 4.5,
        reviewCount: 1200,
        distance: '0.6 km',
        openTime: '08:00 - 22:00',
        category: 'book',
        image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1000&auto=format&fit=crop',
        tags: ['Sách', 'Văn phòng phẩm'],
        floor: 'L3'
    },
    {
        id: '3',
        name: 'Samsung Experience Store',
        rating: 4.7,
        reviewCount: 890,
        distance: '0.5 km',
        openTime: '09:30 - 22:00',
        category: 'electronics',
        image: 'https://images.unsplash.com/photo-1531297461136-82lw8e4a553e?q=80&w=1000&auto=format&fit=crop',
        tags: ['Điện thoại', 'Phụ kiện'],
        floor: 'L4'
    },
    {
        id: '4',
        name: 'Zara',
        rating: 4.3,
        reviewCount: 2500,
        distance: '0.4 km',
        openTime: '10:00 - 22:00',
        category: 'fashion',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop',
        tags: ['Thời trang', 'Phụ kiện'],
        floor: 'L1'
    },
    {
        id: '5',
        name: 'Vietnam Souvenirs',
        rating: 4.6,
        reviewCount: 560,
        distance: '0.2 km',
        openTime: '09:00 - 21:00',
        category: 'souvenir',
        image: 'https://images.unsplash.com/photo-1558288523-2895f50ac835?q=80&w=1000&auto=format&fit=crop',
        tags: ['Quà tặng', 'Thủ công'],
        floor: 'G'
    }
];
