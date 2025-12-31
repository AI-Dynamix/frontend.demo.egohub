import benthanhImg from '../assets/images/landmark/benthanh.png';
// Re-using exiting image for gallery demo
import notredameImg from '../assets/images/landmark/notredame.png';
import independenceImg from '../assets/images/landmark/independence.png';
import saigonPanorama from '../assets/images/panorama/saigon.png';

export interface LandmarkDetail {
    id: string;
    title: string;
    description: string;
    longDescription: string;
    distanceBg: string; // Background image for distance card
    distance: string; // Pre-calculated or coords
    travelTime: string;
    gallery: string[];
    videoUrl: string; // Placeholder
    vrUrl: string;
    mapImage: string; // Placeholder for map view
    openHours: string;
    lat: number;
    lng: number;
    routeGuide?: {
        instruction: string;
        detail: string;
        distance: string;
        direction: 'straight' | 'left' | 'right' | 'destination';
        image?: string; // Image of the landmark at this step
    }[];
}

export const landmarkDetails: Record<string, LandmarkDetail> = {
    'benthanh': {
        id: 'benthanh',
        title: 'Chợ Bến Thành',
        description: 'Biểu tượng lịch sử sôi động giữa lòng Sài Gòn.',
        longDescription: 'Chợ Bến Thành không chỉ là nơi buôn bán sầm uất mà còn là chứng nhân lịch sử qua bao thăng trầm của thành phố. Với kiến trúc đồng hồ 4 mặt đặc trưng, đây là điểm đến không thể bỏ qua để khám phá ẩm thực đường phố, mua sắm quà lưu niệm và cảm nhận nhịp sống hối hả của người dân địa phương.',
        distanceBg: benthanhImg,
        distance: '1.2 km',
        travelTime: '5 phút đi bộ',
        gallery: [benthanhImg, notredameImg, independenceImg, benthanhImg],
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Dummy
        // Using local Saigon panorama
        vrUrl: saigonPanorama,
        mapImage: '',
        openHours: '06:00 - 22:00',
        ticketPrice: 'Miễn phí',
        lat: 10.7725,
        lng: 106.6980,
        routeGuide: [
            {
                instruction: 'Xuất phát từ Kiosk Nguyễn Huệ',
                detail: 'Đi bộ dọc phố đi bộ hướng về phía UBND Thành phố (hướng Tây Bắc).',
                distance: '0m',
                direction: 'straight',
                image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Nguyen_Hue_Walking_Street.jpg/640px-Nguyen_Hue_Walking_Street.jpg'
            },
            {
                instruction: 'Đi ngang qua Rex Hotel',
                detail: 'Khách sạn Rex 5 sao lịch sử nằm bên tay trái của bạn tại góc đường Lê Lợi.',
                distance: '350m',
                direction: 'straight',
                image: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/49841838.jpg?k=3f868ad26f56118d0af5077227d824d576a02df35078514104c98a58a9861614&o=&hp=1'
            },
            {
                instruction: 'Rẽ trái vào đường Lê Lợi',
                detail: 'Tại giao lộ trước UBND, rẽ trái vào đại lộ Lê Lợi rộng lớn.',
                distance: '400m',
                direction: 'left',
                image: 'https://vcdn1-vnexpress.vnecdn.net/2022/08/30/Le-Loi-6-1661848606.jpg?w=1200&h=0&q=100&dpr=1&fit=crop&s=s869794017'
            },
            {
                instruction: 'Đi qua Saigon Centre (Takashimaya)',
                detail: 'Trung tâm mua sắm sầm uất nằm bên tay trái.',
                distance: '800m',
                direction: 'straight',
                image: 'https://lh3.googleusercontent.com/p/AF1QipN30Xn5a5x2e5x5x2e5x5x2e5x5x2e5x5x2e5x5' // Dummy but representative
            },
            {
                instruction: 'Đến Chợ Bến Thành',
                detail: 'Đi thẳng qua vòng xoay Quách Thị Trang, chợ Bến Thành nằm ngay trước mặt.',
                distance: '1.2km',
                direction: 'destination',
                image: benthanhImg
            }
        ]
    }
};
