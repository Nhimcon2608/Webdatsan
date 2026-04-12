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

const publicRequestPrefixes = [
	"/auth/login",
	"/auth/register",
	"/branches/",
	"/badminton-courts/",
	"/prices/",
	"/price-types/",
	"/reviews/",
	"/vouchers/active",
	"/vouchers/branch/",
	"/reservations/branch/",
	"/reservations/latest",
	"/reservations/recent",
];

function getRequestPath(url) {
	if (!url) {
		return "";
	}

	try {
		return new URL(url, window.location.origin).pathname;
	} catch {
		return url;
	}
}

function shouldAttachAuthToken(url) {
	if (!url) {
		return true;
	}

	const requestPath = getRequestPath(url);
	return !publicRequestPrefixes.some((prefix) => requestPath.startsWith(prefix));
}

function removeContentTypeHeader(headers) {
	if (!headers) {
		return;
	}

	if (typeof headers.delete === "function") {
		headers.delete("Content-Type");
		headers.delete("content-type");
		return;
	}

	delete headers["Content-Type"];
	delete headers["content-type"];
}

apiClient.interceptors.request.use(
	(config) => {
		startProgress();

		if (config.data instanceof FormData) {
			removeContentTypeHeader(config.headers);
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
					showSnackbar(error.response.data?.message || 'Bạn không có quyền thực hiện thao tác này', 'error');
					break;

				case 404:
					if (!error.config?.skipNotFoundSnackbar) {
						showSnackbar('Không tìm thấy dữ liệu', 'warning');
					}
					break;

				default:
					console.error("API Error:", error.response.data);
			}
		}

		return Promise.reject(error);
	}
);

export default apiClient;
