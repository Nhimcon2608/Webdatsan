import apiClient from "./api";

const reservationService = {
	getAllReservation: async () => {
		try {
			const response = await apiClient.get(`/reservations`);
			return response.data;
		} catch (error) {
			console.error("Error fetching reservations:", error);
			throw error;
		}
	},

	getUncanceledReservationOfBranchByDate: async (branchId, date) => {
		try {
			const response = await apiClient.get(`/reservations/branch/${branchId}/${date}`);
			return response.data;
		} catch (error) {
			console.error("Error fetching reservations:", error);
			throw error;
		}
	},

	getUncanceledReservationOfBranchBetween: async (branchId, from, to) => {
		try {
			const response = await apiClient.get(`/reservations/branch/${branchId}?from=${from}&to=${to}`);
			return response.data;
		} catch (error) {
			console.error("Error fetching reservations:", error);
			throw error;
		}
	},

	getReservationById: async (reservationId) => {
		try {
			const response = await apiClient.get(`/reservations/${reservationId}`);
			return response.data;
		} catch (error) {
			console.error("Error fetching reservations:", error);
			throw error;
		}
	},

	getAllReservationsOfUser: async (status) => {
		try {
			const response = await apiClient.get(`/reservations/user/${status}`);
			return response.data;
		} catch (error) {
			console.error("Error fetching reservations:", error);
			throw error;
		}
	},

	postReservation: async (formData) => {
		try {
			const response = await apiClient.post("/reservations", formData);
			return response.data;
		} catch (error) {
			console.error("Error fetching reservations:", error);
			throw error;
		}
	},

	cancelReservation: async (reservationId) => {
		try {
			const response = await apiClient.put(
				`/reservations/cancel/${reservationId}`
			);
			return response.data;
		} catch (error) {
			console.error("Error fetching reservations:", error);
			throw error;
		}
	},

	updateReservation: async (reservationId, reservationData) => {
		try {
			const response = await apiClient.put(
				`/reservations/${reservationId}`,
				reservationData
			);
			return response.data;
		} catch (error) {
			console.error("Error fetching reservations:", error);
			throw error;
		}
	},

	scheduleCancellation: async (reservationId) => {
		try {
			const response = await apiClient.patch(
				`/reservations/schedule-cancel/${reservationId}`
			);
			return response.data;
		} catch (error) {
			console.error("Error fetching reservations:", error);
			throw error;
		}
	},

	scheduleCancellationListId: async (reservationIds) => {
		try {
			const response = await apiClient.patch(`/reservations/schedule-cancel`,reservationIds);
			return response.data;
		} catch (error) {
			console.error("Error fetching reservations:", error);
			throw error;
		}
	},

	getRecentReservations: async (branchId) => {
		try {
			const response = await apiClient.get(`/reservations/branch/${branchId}`);
			return response.data;
		} catch (error) {
			console.error("Error fetching recent reservations:", error);
			throw error;
		}
	},

	getAllReservationsByBranch: async (branchId) => {
		try {
			const response = await apiClient.get(
				`/reservations/branch/${branchId}/all`
			);
			return response.data;
		} catch (error) {
			console.error("Error fetching recent reservations:", error);
			throw error;
		}
	},

	getAllReservationsByBookAtDesc: async (branchId) => {
		try {
			const url = branchId
				? `/reservations/latest?branchId=${branchId}`
				: `/reservations/latest`;
			const response = await apiClient.get(url);
			return response.data;
		} catch (error) {
			console.error("Error fetching latest reservations:", error);
			throw error;
		}
	},

	getTodayReservation: async (branchId, date) => {
		try {
			const response = await apiClient.get(
				`/reservations/branch/${branchId}/${date}`
			);
			return response.data;
		} catch (error) {
			console.error("Error fetching reservations of today:", error);
			throw error;
		}
	},
	updateReservationStatus: async (reservationId, status, token) => {
		try {
			const config = token
				? { headers: { Authorization: `Bearer ${token}` } }
				: undefined;
			const response = await apiClient.put(
				`/reservations/${reservationId}/status`,
				{ status },
				config
			);
			return response.data;
		} catch (error) {
			console.error("Error updating reservation status:", error);
			throw new Error(
				error.response?.data?.message || "Cập nhật trạng thái thất bại."
			);
		}
	},
	getReservationsByBranch: async (branchId, token) => {
		try {
			const response = await apiClient.get(`/reservations/branch/${branchId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			return response.data;
		} catch (error) {
			console.error("Error fetching reservations:", error);
			throw new Error(
				error.response?.data?.message || "Không thể lấy danh sách đặt sân."
			);
		}
	},

	sendToManager: async (reservationId) => {
		try {
			const response = await apiClient.get(`/reservations/notification/${reservationId}`);
			return response.data;
		} catch (error) {
			console.error("Error:", error);
			throw error;
		}
	},

	createFixedBooking: async (fixedBookingRequest) => {
		try {
			const response = await apiClient.post("/fixed-booking", fixedBookingRequest);
			return response.data; // Trả về mảng reservation IDs
		} catch (error) {
			console.error("Lỗi khi đặt sân cố định:", error);
			const msg = error.response?.data?.message || error.message || "Đã có lỗi xảy ra";
			throw new Error(msg);
		}
	},

	// ===== THAY ĐỔI TRẠNG THÁI ĐẶT CỐ ĐỊNH (HÀNG LOẠT) =====
	updateFixedBookingStatus: async (reservationIds, status) => {
		try {
			// Gửi cả danh sách 4 ID và status lên
			const response = await apiClient.patch("/fixed-booking", {
				reservationIds: reservationIds,
				status: status.toLowerCase()
			});
			return response.data;
		} catch (error) {
			console.error("Lỗi cập nhật trạng thái đặt cố định:", error);
			const msg = error.response?.data?.message || error.response?.data || "Cập nhật trạng thái thất bại";
			throw new Error(msg);
		}
	},


	// ===== ĐẶT CỐ ĐỊNH: XÁC NHẬN THANH TOÁN =====
	confirmFixedBookingPayment: async (reservationIds) => {
		try {
			const response = await apiClient.patch("/fixed-booking", {
				reservationIds: reservationIds,
				status: "WAITING"
			});
			return response.data;
		} catch (error) {
			console.error("Lỗi xác nhận thanh toán cố định:", error);
			throw new Error(error.response?.data?.message || "Xác nhận thanh toán thất bại");
		}
	},

	// ===== ĐẶT CỐ ĐỊNH: HỦY ĐẶT SÂN =====
	cancelFixedBooking: async (reservationIds) => {
		try {
			const response = await apiClient.patch("/fixed-booking", {
				reservationIds: reservationIds.map(id => String(id)),
				status: "CANCELLED"
			});
			return response.data;
		} catch (error) {
			console.error("Lỗi hủy đặt cố định:", error);
			throw new Error(error.response?.data?.message || "Hủy đặt sân thất bại");
		}
	},
};

export default reservationService;
