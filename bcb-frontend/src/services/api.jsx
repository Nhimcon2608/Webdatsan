import axios from "axios";
import NProgress from "nprogress";
import "nprogress/nprogress.css"
import { showSnackbar } from "./snackbarBridge.js";

let requestCount = 0;

function startProgress() {
	if (requestCount === 0) {
		NProgress.start();
	}
	requestCount++;
}

function stopProgress() {
	requestCount--;
	if (requestCount <= 0) {
		NProgress.done();
		requestCount = 0;
	}
}

const apiClient = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	// timeout: 10000,
	headers: {
		"Content-Type": "application/json",
		// Headers (Authorization)
	},
});

function shouldAttachAuthToken(url) {
	if (!url) {
		return true;
	}

	return !["/auth/login", "/auth/register"].includes(url);
}

apiClient.interceptors.request.use(
	(config) => {
		startProgress();

		if (config.data instanceof FormData) {
			if (typeof config.headers?.setContentType === "function") {
				config.headers.setContentType(undefined);
			} else if (config.headers) {
				delete config.headers["Content-Type"];
			}
		}

		const token = localStorage.getItem("authToken");
		if (token && shouldAttachAuthToken(config.url)) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},

	(error) => {
		stopProgress();
		return Promise.reject(error);
	}
);

apiClient.interceptors.response.use(
	(response) => {
		stopProgress();
		return response;
	},
	(error) => {
		stopProgress();

		if (error.response) {
			switch (error.response.status) {

				case 400:
					showSnackbar(error.response.data?.message || 'Dữ liệu không hợp lệ', 'error');
					break;

				case 401:
					if (shouldAttachAuthToken(error.config?.url)) {
						localStorage.removeItem("authToken");
						if (window.location.pathname !== "/login") {
							window.location.href = "/login";
						}
					}
					break;

				case 403:
					showSnackbar('Bạn không có quyền thực hiện thao tác này', 'error');
					break;

				case 404:
					showSnackbar('Không tìm thấy dữ liệu', 'warning');
					break;

				default:
					console.error("API Error:", error.response.data);
			}
		}

		return Promise.reject(error);
	}
);

export default apiClient;
