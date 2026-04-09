import apiClient from "./api";

const paymentService = {

    payWithMomo: async (paymentRequest) => {
        const res = await apiClient.post('payment/momo/create', paymentRequest);
        const payUrl = res?.data?.payUrl;

        if (!payUrl) {
            throw new Error('MoMo không trả về đường dẫn thanh toán hợp lệ');
        }

        window.location.href = payUrl;
    },
    
    getResIdsByOrderId: async (orderId) => {
        try {
			const response = await apiClient.get(`payment/momo/resIds-of/${orderId}`);
			return response.data;
		} catch (error) {
			console.error(`Error fetching ids: `, error);
			throw error;
		}
    },

    confirmDemoPayment: async (orderId, resultCode) => {
        try {
            await apiClient.post('payment/momo/demo/confirm', {
                orderId,
                resultCode,
            });
        } catch (error) {
            console.error('Error confirming demo payment:', error);
            throw error;
        }
    }
}

export default paymentService;
