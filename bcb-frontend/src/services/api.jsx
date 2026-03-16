import axios from "axios";
import NProgress from "nprogress";
import "nprogress/nprogress.css"

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
					break;

				case 401:
					break;

				case 404:
					break;
				
				case 403: 
					break;

				default:
					console.error("API Error:", error.response.data);
			}
		}

		return Promise.reject(error);
	}
);

export default apiClient;
