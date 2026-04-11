import apiClient from "./api";

const voucherService = {
    getAllVouchersOfBranch: async (branchId, token) => {
        try {
            const response = await apiClient.get(`/vouchers/branch/${branchId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching vouchers:", error);
            throw error;
        }
    },
    createVoucher: async (voucherData, token) => {
        try {
            const response = await apiClient.post("/vouchers", voucherData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Voucher created:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error creating voucher:", error);
            throw new Error(error.response?.data?.message || "Tạo voucher thất bại.");
        }
    },

    updateVoucher: async (voucherId, voucherData, token) => {
        try {
            const response = await apiClient.put(
                `/vouchers/${voucherId}`,
                voucherData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            console.log("Voucher updated:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error updating voucher:", error);
            throw new Error(
                error.response?.data?.message || "Cập nhật voucher thất bại."
            );
        }
    },

    toggleVoucherAvailability: async (voucherId, status, token) => {
        try {
            const response = await apiClient.patch(
                `/vouchers/enable?voucherId=${voucherId}&status=${status}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Voucher availability toggled:", response.data);
            return response.data;
        } catch (error) {
            console.error("Error toggling voucher availability:", error);
            throw new Error(
                error.response?.data?.message || "Cập nhật trạng thái voucher thất bại."
            );
        }
    },
};

export default voucherService;
