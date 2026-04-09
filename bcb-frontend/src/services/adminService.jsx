import apiClient from "./api";

const adminService = {
    getAllAccounts: async () => {
        try {
            const response = await apiClient.get("/accounts");
            return response.data.map((account) => ({
                ...account,
                isActivated: account.isActivated ?? account.activated ?? false,
            }));
        } catch (error) {
            console.error("Error fetching accounts:", error);
            throw error;
        }
    },
};

export default adminService;
