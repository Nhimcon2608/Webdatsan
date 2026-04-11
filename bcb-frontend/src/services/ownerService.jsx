import apiClient from './api';

const ownerService = {

    getOwnerByPhoneNumber: async (phoneNumber) => {
        try {
            return await apiClient.get(`/owners/phone/${encodeURIComponent(phoneNumber)}`, {
                skipNotFoundSnackbar: true,
            });
        } catch (error) {
            if (error.response?.status !== 404) {
                console.error('Error fetching owner by phone number:', error);
            }
            throw error;
        }
    },

    getAllOwner: async () => {
        try {
            const response = await apiClient.get('/owners');
            return response.data;
        } catch (error) {
            console.error('Error fetching owners: ', error);
            throw error;
        }
    }

}

export default ownerService;
