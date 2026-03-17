import apiClient from "./api";

const managerService = {
	uploadAvatar: async (formData) => {
		try {
			const response = await apiClient.put('/accounts/upload-image', formData);
			return response.data;
		} catch (error) {
			console.error('Error uploading avatar:', error);
			throw new Error(error.response?.data?.message || 'Failed to upload avatar');
		}
	},
};

export default managerService;
