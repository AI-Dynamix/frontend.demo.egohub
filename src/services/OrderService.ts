export interface Order {
    id: string;
    items: any[];
    totalAmount: string;
    date: string;
    paymentMethod: 'qr' | 'card';
    email?: string;
    status: 'completed';
}

const STORAGE_KEY = 'ego_kiosk_orders';

export const OrderService = {
    getOrders: (): Order[] => {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => {
        const orders = OrderService.getOrders();
        const newOrder: Order = {
            ...order,
            id: Math.random().toString(36).substr(2, 9).toUpperCase(),
            date: new Date().toISOString(),
            status: 'completed'
        };
        orders.unshift(newOrder); // Add to top
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
        return newOrder;
    },

    // Simulate Face ID lookup
    lookupByFaceId: async (): Promise<Order[]> => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Fake 2s scan
        return OrderService.getOrders(); // Return all for demo
    }
};
