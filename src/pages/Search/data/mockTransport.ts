import { Bus, Train, Airplane } from '@phosphor-icons/react';

export const TRANSPORT_TYPES = [
    { id: 'bus', label: 'Xe khách', icon: Bus },
    { id: 'train', label: 'Tàu hỏa', icon: Train },
    { id: 'plane', label: 'Máy bay', icon: Airplane },
];

export const MOCK_TRIPS = [
    {
        id: '1',
        operator: 'Phương Trang',
        type: 'bus',
        from: 'Sài Gòn',
        to: 'Đà Lạt',
        departureTime: '22:00',
        arrivalTime: '05:00 (+1)',
        duration: '7h',
        price: '320.000đ',
        seatType: 'Giường nằm',
        seatsAvailable: 12,
        rating: 4.5,
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Logo_Phuong_Trang.png/1200px-Logo_Phuong_Trang.png' // Placeholder or use text
    },
    {
        id: '2',
        operator: 'Thành Bưởi',
        type: 'bus',
        from: 'Sài Gòn',
        to: 'Đà Lạt',
        departureTime: '23:00',
        arrivalTime: '06:00 (+1)',
        duration: '7h',
        price: '340.000đ',
        seatType: 'Phòng nằm VIP',
        seatsAvailable: 5,
        rating: 4.7,
        logo: ''
    },
    {
        id: '3',
        operator: 'Vietnam Railways',
        type: 'train',
        from: 'Sài Gòn',
        to: 'Nha Trang',
        departureTime: '06:00',
        arrivalTime: '14:00',
        duration: '8h',
        price: '450.000đ',
        seatType: 'Ngồi mềm điều hòa',
        seatsAvailable: 50,
        rating: 4.2,
        logo: ''
    },
    {
        id: '4',
        operator: 'Vietnam Airlines',
        type: 'plane',
        from: 'Sài Gòn',
        to: 'Hà Nội',
        departureTime: '08:00',
        arrivalTime: '10:15',
        duration: '2h 15m',
        price: '1.850.000đ',
        seatType: 'Phổ thông',
        seatsAvailable: 20,
        rating: 4.8,
        logo: ''
    },
    {
        id: '5',
        operator: 'Vietjet Air',
        type: 'plane',
        from: 'Sài Gòn',
        to: 'Phú Quốc',
        departureTime: '14:30',
        arrivalTime: '15:30',
        duration: '1h',
        price: '950.000đ',
        seatType: 'Eco',
        seatsAvailable: 15,
        rating: 4.0,
        logo: ''
    }
];
