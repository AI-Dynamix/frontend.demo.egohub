import { ForkKnife, Coffee, Hamburger, IceCream } from '@phosphor-icons/react';

export const RESTAURANT_CATEGORIES = [
    { id: 'all', label: 'Tất cả', icon: ForkKnife },
    { id: 'vietnamese', label: 'Món Việt', icon: ForkKnife },
    { id: 'fastfood', label: 'Fastfood', icon: Hamburger },
    { id: 'coffee', label: 'Cà phê', icon: Coffee },
    { id: 'dessert', label: 'Tráng miệng', icon: IceCream },
];

export const MOCK_RESTAURANTS = [
    {
        id: '1',
        name: 'Phở 2000',
        rating: 4.5,
        reviewCount: 1240,
        distance: '0.3 km',
        deliveryTime: '15-20 min',
        priceRange: '$$',
        category: 'vietnamese',
        image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=1000&auto=format&fit=crop',
        tags: ['Phở', 'Truyền thống'],
        isPromo: true,
        promoText: 'Giảm 20% đơn từ 200k'
    },
    {
        id: '2',
        name: 'Burger King - Bến Thành',
        rating: 4.2,
        reviewCount: 850,
        distance: '0.5 km',
        deliveryTime: '10-15 min',
        priceRange: '$',
        category: 'fastfood',
        image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=1000&auto=format&fit=crop',
        tags: ['Burger', 'Gà rán'],
        isPromo: false,
    },
    {
        id: '3',
        name: 'Highlands Coffee',
        rating: 4.6,
        reviewCount: 2100,
        distance: '0.2 km',
        deliveryTime: '10 min',
        priceRange: '$',
        category: 'coffee',
        image: 'https://images.unsplash.com/photo-1559496417-e7f25cb247f3?q=80&w=1000&auto=format&fit=crop',
        tags: ['Cà phê', 'Bánh ngọt'],
        isPromo: true,
        promoText: 'Mua 1 tặng 1'
    },
    {
        id: '4',
        name: 'Cơm Tấm Cali',
        rating: 4.3,
        reviewCount: 560,
        distance: '0.8 km',
        deliveryTime: '25 min',
        priceRange: '$$',
        category: 'vietnamese',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1000&auto=format&fit=crop',
        tags: ['Cơm tấm', 'Sườn bì chả'],
        isPromo: false,
    },
    {
        id: '5',
        name: 'Dairy Queen',
        rating: 4.7,
        reviewCount: 300,
        distance: '0.6 km',
        deliveryTime: '15 min',
        priceRange: '$',
        category: 'dessert',
        image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=1000&auto=format&fit=crop',
        tags: ['Kem', 'Tráng miệng'],
        isPromo: true,
        promoText: 'Freeship < 2km'
    }
];
