import React, { useEffect, useState, useMemo, useRef } from "react";
import authService from "../../services/authService";
import branchService from "../../services/branchServce";
import reservationService from "../../services/reservationService";
import priceService from "../../services/priceService";
import badmintonCourtService from "../../services/badmintonCourtService";
import priceTypeService from "../../services/priceTypeService";
import {
	Box,
	Grid,
	Typography,
	Card,
	CardContent,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	Chip,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Snackbar,
	Alert,
	Skeleton,
	Avatar,
	Stack,
	Tooltip,
	IconButton,
	InputAdornment,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Tab,
	Tabs,
	useMediaQuery,
	Paper,
	Container,
} from "@mui/material";
import {
	Edit,
	Delete,
	Search as SearchIcon,
	Refresh as RefreshIcon,
	Visibility,
	Add as AddIcon,
	Check as CheckIcon,
	Close,
} from "@mui/icons-material";
import { Doughnut, Bar } from "react-chartjs-2";
import {
	Chart as ChartJS,
	ArcElement,
	Tooltip as ChartTooltip,
	Legend,
	CategoryScale,
	LinearScale,
	BarElement,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useTheme } from "@mui/material/styles";
import { useAuth } from "../../../context/AuthContext";
import useSSE from "../../../hook/useSSE";

ChartJS.register(ArcElement, ChartTooltip, Legend, CategoryScale, LinearScale, BarElement);

const DashboardContent = () => {
	const theme = useTheme();
	const { user } = useAuth();
	const startTimeRef = useRef(null);
	const endTimeRef = useRef(null);
	const priceRef = useRef(null);
	// Kiểm tra khung giờ mới có hợp lệ không (không chồng + phải nối tiếp)
	const isTimeSlotValid = (newStart, newEnd, existingPrices, currentPriceId = null) => {
		if (newStart >= newEnd) return false;

		for (const price of existingPrices) {
			if (currentPriceId && price.id === currentPriceId) continue; // bỏ qua chính nó khi sửa

			const start = price.startTime;
			const end = price.endTime;

			// Không được chồng lên nhau
			if (newStart < end && newEnd > start) {
				return false;
			}
		}

		// Tìm khung giờ ngay trước (nếu có)
		const previousSlot = existingPrices
			.filter(p => currentPriceId ? p.id !== currentPriceId : true)
			.find(p => p.endTime === newStart);

		// Nếu có khung trước → phải nối tiếp (endTime của khung trước = startTime của khung mới)
		if (previousSlot) {
			return previousSlot.endTime === newStart;
		}

		// Nếu không có khung trước → cho phép (có thể là khung đầu tiên)
		return true;
	};
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	// ==================== STATE ====================
	const [todayReservations, setTodayReservations] = useState([]);
	const [recentReservations, setRecentReservations] = useState([]);
	const [allReservations, setAllReservations] = useState([]);
	const [prices, setPrices] = useState({
		fixedPrices: [],
		casualPrices: [],
	});
	const [badmintonCourts, setBadmintonCourts] = useState([]);
	const [loadingToday, setLoadingToday] = useState(true);
	const [loadingPrices, setLoadingPrices] = useState(true);
	const [loadingCourts, setLoadingCourts] = useState(true);
	const [loadingAllReservations, setLoadingAllReservations] = useState(true);
	const [error, setError] = useState(null);
	const [errorToday, setErrorToday] = useState(null);
	const [successMessage, setSuccessMessage] = useState(null);
	const [branchId, setBranchId] = useState(null);
	const [accountId, setAccountId] = useState(null);
	// const [editingPriceId, setEditingPriceId] = useState(null);
	// const [editedPrice, setEditedPrice] = useState({});
	const [addingNewPrice, setAddingNewPrice] = useState(false);
	const [priceTypes, setPriceTypes] = useState([]);
	const [newPrice, setNewPrice] = useState({
		startTime: "",
		endTime: "",
		pricePerHour: "",
		dayOfWeek: "Bow",
	});
	const [newPriceType, setNewPriceType] = useState("fixedPrices");
	const [activeDayTab, setActiveDayTab] = useState("Bow");
	const [deletePriceId, setDeletePriceId] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterStatus, setFilterStatus] = useState("ALL");
	const [selectedReservation, setSelectedReservation] = useState(null);
	const [revenueByMonth, setRevenueByMonth] = useState({ labels: [], data: [] });
	const { onEvent } = useSSE(user.id);

	// ==================== EFFECTS ====================
	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token) {
			setError("Không tìm thấy token đăng nhập.");
			setLoadingToday(false);
			setLoadingPrices(false);
			setLoadingCourts(false);
			setLoadingAllReservations(false);
			return;
		}

		const fetchData = async () => {
			try {
				const account = await authService.getCurrentAccount(token);
				setAccountId(account.id);

				const branch = await branchService.getBranchByAccountId(account.id, token);
				setBranchId(branch.id);

				const courtsData = await badmintonCourtService.getByBranchId(branch.id, token);
				setBadmintonCourts(Array.isArray(courtsData) ? courtsData : []);
			} catch (err) {
				console.error("Lỗi khi lấy dữ liệu:", err);
				setError("Không thể tải thông tin chi nhánh hoặc sân.");
			} finally {
				setLoadingCourts(false);
			}
		};

		fetchData();
	}, []);

	useEffect(() => {
		const fetchPriceTypes = async () => {
			try {
				const data = await priceTypeService.getAll();
				setPriceTypes(data);
			} catch (err) {
				console.error("Lỗi lấy loại giá:", err);
			}
		};
		fetchPriceTypes();
	}, []);

	useEffect(() => {
		if (!branchId) return;
		fetchReservations();
	}, [branchId]);


	const fetchReservations = async () => {
		const today = new Date().toISOString().split("T")[0];
		try {
			const [todayRes, recentRes, allRes] = await Promise.all([
				reservationService.getTodayReservation(branchId, today),
				reservationService.getRecentReservations(branchId),
				reservationService.getAllReservationsByBranch(branchId),
			]);
			setTodayReservations(todayRes);
			setRecentReservations(recentRes);
			setAllReservations(allRes);
		} catch (err) {
			console.error("Lỗi tải reservations:", err);
			setErrorToday("Không thể tải dữ liệu đặt sân.");
		} finally {
			setLoadingToday(false);
			setLoadingAllReservations(false);
		}
	};

	useEffect(() => {
		if (!branchId) return;

		const fetchPriceData = async () => {
			try {
				setLoadingPrices(true);
				const priceData = await priceService.getAllPriceTypesByBranch(branchId);
				setPrices({
					fixedPrices: priceData?.fixedPrices || [],
					casualPrices: priceData?.casualPrices || [],
				});
			} catch (err) {
				console.error("Lỗi tải bảng giá:", err);
				setError("Không thể tải bảng giá cố định và vãng lai.");
			} finally {
				setLoadingPrices(false);
			}
		};

		fetchPriceData();
	}, [branchId]);

	useEffect(() => {
		const handleNewReservation = (newRes) => {
			const checkDup = (list) => list.some(r => r.id === newRes.id);

			setAllReservations(prev =>
				checkDup(prev) ? prev : [newRes, ...prev]
			);

			const isToday = new Date().toISOString().split("T")[0] ===
				newRes.bookAt?.split("T")[0];

			if (isToday) {
				setTodayReservations(prev =>
					checkDup(prev) ? prev : [newRes, ...prev]
				);
			}

			setRecentReservations(prev =>
				checkDup(prev) ? prev : [newRes, ...prev]
			);

			setSuccessMessage("Có đặt sân mới!");
		};

		onEvent("RESERVATION_CREATED", handleNewReservation);
	}, [onEvent]);

	// ==================== HANDLERS ====================
	const handleRefresh = () => {
		setLoadingToday(true);
		setLoadingPrices(true);
		setLoadingCourts(true);
		setLoadingAllReservations(true);
		setError(null);
		setErrorToday(null);
		setSearchTerm("");
		setFilterStatus("ALL");

		const token = localStorage.getItem("authToken");
		if (!token) {
			setError("Không tìm thấy token đăng nhập.");
			setLoadingToday(false);
			setLoadingPrices(false);
			setLoadingCourts(false);
			setLoadingAllReservations(false);
			return;
		}

		const fetchData = async () => {
			try {
				const account = await authService.getCurrentAccount(token);
				const branch = await branchService.getBranchByAccountId(account.id, token);
				const today = new Date().toISOString().split("T")[0];
				const [pricesData, courtsData, todayRes, recentRes, allRes] = await Promise.all([
					priceService.getAllPriceTypesByBranch(branch.id),
					badmintonCourtService.getByBranchId(branch.id, token),
					reservationService.getTodayReservation(branch.id, today),
					reservationService.getRecentReservations(branch.id),
					reservationService.getAllReservationsByBranch(branch.id),
				]);

				setPrices(pricesData || { fixedPrices: [], casualPrices: [] });
				setBadmintonCourts(Array.isArray(courtsData) ? courtsData : []);
				setTodayReservations(todayRes);
				setRecentReservations(recentRes);
				setAllReservations(allRes);
				setBranchId(branch.id);
				setAccountId(account.id);
				setSuccessMessage("Dữ liệu đã được làm mới!");
				setTimeout(() => setSuccessMessage(null), 3000);
			} catch (err) {
				console.error("Lỗi khi làm mới dữ liệu:", err);
				setError("Không thể làm mới dữ liệu.");
			} finally {
				setLoadingToday(false);
				setLoadingPrices(false);
				setLoadingCourts(false);
				setLoadingAllReservations(false);
			}
		};

		fetchData();
	};

	const findPriceTypeBySelection = (types, selectedType) => {
		const expectedType = selectedType === "fixedPrices" ? "Cố định" : "Vãng lai";
		return types.find((priceType) => priceType.type?.trim() === expectedType);
	};

	const handleAddNewPrice = async (e, priceData, selectedType) => {
		e.preventDefault();

		const token = localStorage.getItem("authToken");
		if (!token || !branchId) {
			setError("Không có token hoặc chi nhánh.");
			return;
		}

		const startTime = Number(priceData.startTime);
		const endTime = Number(priceData.endTime);
		const pricePerHour = Number(priceData.pricePerHour);

		if (isNaN(startTime) || isNaN(endTime) || isNaN(pricePerHour)) {
			setError("Vui lòng nhập đầy đủ thông tin");
			return;
		}

		if (startTime >= endTime) {
			setError("Giờ bắt đầu phải nhỏ hơn giờ kết thúc");
			return;
		}

		let selectedPriceType = findPriceTypeBySelection(priceTypes, selectedType);

		if (!selectedPriceType) {
			try {
				const latestPriceTypes = await priceTypeService.getAll();
				setPriceTypes(latestPriceTypes);
				selectedPriceType = findPriceTypeBySelection(latestPriceTypes, selectedType);
			} catch (err) {
				setError("Không thể tải loại giá.");
				return;
			}
		}

		if (!selectedPriceType) {
			setError("Không tìm thấy loại giá.");
			return;
		}

		// Lấy danh sách giá hiện tại theo loại và ngày
		const dayType = priceData.dayOfWeek === "Eow" ? "Eow" : "Bow";
		const currentTypeKey = selectedType; // "fixedPrices" hoặc "casualPrices"
		const existingPrices = groupedPrices[dayType][currentTypeKey] || [];

		// Kiểm tra khung giờ có hợp lệ không
		if (!isTimeSlotValid(startTime, endTime, existingPrices)) {
			setError("Khung giờ không hợp lệ! Phải nối tiếp khung trước (ví dụ: 6-12 → 12-18)");
			return;
		}

		// ... tiếp tục tạo giá như cũ
		try {
			const payload = {
				startTime,
				endTime,
				pricePerHour,
				branchId,
				priceTypeId: selectedPriceType.id,
				dayOfWeek: priceData.dayOfWeek === "Eow" ? "1" : "0",
			};

			const createdPrice = await priceService.create(payload, token);

			setPrices(prev => ({
				...prev,
				[selectedType === "fixedPrices" ? "fixedPrices" : "casualPrices"]: [
					...(prev[selectedType] || []),
					createdPrice
				]
			}));

			setNewPrice({ startTime: "", endTime: "", pricePerHour: "", dayOfWeek: priceData.dayOfWeek });
			setAddingNewPrice(false);
			setSuccessMessage("Thêm giá thành công!");
			setTimeout(() => setSuccessMessage(null), 3000);
		} catch (err) {
			setError("Thêm giá thất bại: " + (err.response?.data?.message || "Lỗi server"));
		}
	};

	// const handleEditClick = (price) => {
	// 	setEditingPriceId(price.id);
	// 	setEditedPrice({
	// 		startTime: price.startTime,
	// 		endTime: price.endTime,
	// 		pricePerHour: price.pricePerHour,
	// 	});
	// };

	const handleSaveClick = async (priceId, updatedData) => {
		const token = localStorage.getItem("authToken");

		try {
			// Tìm price cũ để lấy dayOfWeek hiện tại
			let currentDayOfWeek = null;
			let priceTypeKey = null;

			["fixedPrices", "casualPrices"].forEach((key) => {
				const found = prices[key]?.find(p => p.id === priceId);
				if (found) {
					currentDayOfWeek = found.dayOfWeek ?? found.dayofweek;
					priceTypeKey = key;
				}
			});

			// Chuẩn bị payload đầy đủ: giữ nguyên dayOfWeek
			const payload = {
				...updatedData,
				startTime: Number(updatedData.startTime),
				endTime: Number(updatedData.endTime),
				pricePerHour: Number(updatedData.pricePerHour),
				dayOfWeek: currentDayOfWeek === "1" || currentDayOfWeek === "Eow" ? "1" : "0", // hoặc giữ nguyên string nếu backend chấp nhận
			};

			// Gửi cả dayOfWeek lên server
			const updatedPriceFromServer = await priceService.update(priceId, payload, token);

			// Cập nhật state (giờ đã có dayOfWeek từ server hoặc từ payload)
			setPrices((prev) => {
				const newState = { ...prev };
				["fixedPrices", "casualPrices"].forEach((key) => {
					const index = newState[key]?.findIndex((p) => p.id === priceId);
					if (index !== -1) {
						newState[key][index] = {
							...updatedPriceFromServer,
							dayOfWeek: payload.dayOfWeek === "1" ? "1" : "0",
							dayofweek: payload.dayOfWeek === "1" ? "1" : "0",
						};
					}
				});
				return newState;
			});

			setSuccessMessage("Cập nhật giá thành công!");
			setTimeout(() => setSuccessMessage(null), 3000);
		} catch (err) {
			console.error("Lỗi cập nhật giá:", err);
			setError("Cập nhật thất bại!");
		}
	};

	const handleDeleteClick = (priceId) => {
		setDeletePriceId(priceId);
	};

	const handleConfirmDelete = async () => {
		try {
			const token = localStorage.getItem("authToken");
			await priceService.delete(deletePriceId, token);
			setPrices((prev) => ({
				fixedPrices: (prev.fixedPrices || []).filter((p) => p.id !== deletePriceId),
				casualPrices: (prev.casualPrices || []).filter((p) => p.id !== deletePriceId),
			}));
			setDeletePriceId(null);
			setSuccessMessage("Xóa giá thành công!");
			setTimeout(() => setSuccessMessage(null), 3000);
		} catch (err) {
			console.error("Lỗi xóa giá:", err);
			setError("Xóa giá thất bại!");
		}
	};

	const handleOpenAddPrice = () => {
		const defaultDayOfWeek = activeDayTab === "Eow" ? "Eow" : "Bow";
		setNewPrice({
			startTime: "",
			endTime: "",
			pricePerHour: 0,
			dayOfWeek: defaultDayOfWeek,
		});
		setNewPriceType(
			!prices.fixedPrices?.length
				? "fixedPrices"
				: !prices.casualPrices?.length
					? "casualPrices"
					: newPriceType
		);
		setAddingNewPrice(true);
	};

	const handleViewDetails = (reservation) => {
		setSelectedReservation(reservation);
	};

	// ==================== HELPER FUNCTIONS ====================
	const formatTime = (num) => {
		if (num == null) return "--:--";
		const hour = Math.floor(num).toString().padStart(2, "0");
		return `${hour}:00`;
	};

	const calculateEndTime = (startTime, rentalTime) => {
		if (!startTime || !rentalTime) return "--:--";
		const [startHours, startMinutes, startSeconds] = startTime.split(":");
		let date = new Date();
		date.setHours(parseInt(startHours), parseInt(startMinutes), parseInt(startSeconds || 0));
		const totalMinutes = Math.round(rentalTime * 60);
		date.setMinutes(date.getMinutes() + totalMinutes);
		return `${date.getHours().toString().padStart(2, "0")}:${date
			.getMinutes()
			.toString()
			.padStart(2, "0")}`;
	};

	const formatDate = (dateString) => {
		if (!dateString) return "N/A";
		const date = new Date(dateString);
		return date.toLocaleString("vi-VN", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// ==================== RENDER FUNCTIONS ====================
	const renderReservationStatus = useMemo(
		() => (status) => {
			const statusInfo = {
				waiting: { label: "Chờ đến sân", color: "warning" },
				checked: { label: "Đã đến", color: "success" },
				cancel: { label: "Đã hủy", color: "error" },
				awaiting_payment: { label: "Chờ thanh toán", color: "#1565c0" },
				finish: { label: "Đã hoàn thành", color: "primary" },
			};

			const { label, color } = statusInfo[status] || {
				label: status,
				color: "default",
			};

			return (
				<Chip
					label={label}
					color={color}
					size="small"
					sx={{
						fontWeight: 600,
						color: theme.palette.getContrastText(
							theme.palette[color]?.main || theme.palette.text.primary
						),
					}}
				/>
			);
		},
		[theme]
	);

	const renderTimeRanges = useMemo(
		() => (reservation) => {
			if (!reservation.reservationDetails?.length) {
				return (
					<Typography color="text.secondary" variant="body2">
						Không có dữ liệu
					</Typography>
				);
			}

			return (
				<Box>
					{reservation.reservationDetails.map((detail, index) => {
						const court = badmintonCourts.find(
							(c) => String(c.id) === String(detail.badmintonCourtId)
						);
						const courtNumber = court?.ordinalNumber ?? "N/A";
						const startTime = detail.startTime?.slice(0, 5) || "--:--";
						const endTime = calculateEndTime(detail.startTime, detail.rentalTime);

						return (
							<Typography
								key={index}
								variant="body2"
								sx={{ color: "text.primary", fontWeight: 500 }}
							>
								Sân {courtNumber}: {startTime} - {endTime}
							</Typography>
						);
					})}
				</Box>
			);
		},
		[badmintonCourts]
	);

	// ==================== COMPUTED VALUES ====================
	const sortedToday = useMemo(
		() =>
			todayReservations
				.slice()
				.sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
				.filter(
					(res) =>
						res.playerName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
						(filterStatus === "ALL" || res.status === filterStatus)
				),
		[todayReservations, searchTerm, filterStatus]
	);

	const sortedRecent = useMemo(
		() =>
			recentReservations
				.slice()
				.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
				.filter(
					(res) =>
						res.playerName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
						(filterStatus === "ALL" || res.status === filterStatus)
				),
		[recentReservations, searchTerm, filterStatus]
	);

	const groupedPrices = useMemo(() => {
		const result = {
			Bow: { fixedPrices: [], casualPrices: [] },
			Eow: { fixedPrices: [], casualPrices: [] },
		};

		if (!prices) return result;

		const normalizeDayType = (dayType) => {
			if (dayType === null || dayType === undefined) return "Bow";
			const str = String(dayType).trim().toLowerCase();
			if (str === "0" || str === "bow" || str === "weekday") return "Bow";
			if (str === "1" || str === "eow" || str === "weekend") return "Eow";
			return "Bow";
		};

		const processArray = (sourceArray, targetKey) => {
			if (!Array.isArray(sourceArray)) return;
			sourceArray.forEach((price) => {
				const dayType = normalizeDayType(price.dayOfWeek || price.dayofweek);
				result[dayType][targetKey].push(price);
			});
		};

		processArray(prices.fixedPrices, "fixedPrices");
		processArray(prices.casualPrices, "casualPrices");
		return result;
	}, [prices]);

	const currentPrices = groupedPrices?.[activeDayTab] || { fixedPrices: [], casualPrices: [] };

	const statusCounts = useMemo(() => {
		const counts = { waiting: 0, checked: 0, cancel: 0, finish: 0 };
		allReservations.forEach((res) => {
			if (counts.hasOwnProperty(res.status)) {
				counts[res.status]++;
			}
		});
		return counts;
	}, [allReservations]);

	// --- Doanh thu 6 tháng gần đây ---
	useEffect(() => {
		if (allReservations.length > 0) {
			const now = new Date();
			const revenueMap = new Map();

			for (let i = 0; i < 6; i++) {
				const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
				const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
				revenueMap.set(key, 0);
			}

			allReservations.forEach((res) => {
				if (!res.bookAt) return;

				const date = new Date(res.bookAt);
				const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

				if (!revenueMap.has(key)) return;

				if (res.status === "finish") {
					const price = Number(res.totalPrice) || 0;
					revenueMap.set(key, revenueMap.get(key) + price);
				}

				if (res.status === "cancel") {
					const deposit = Number(res.deposit) || 0;
					revenueMap.set(key, revenueMap.get(key) + deposit);
				}
			});

			const labels = Array.from(revenueMap.keys());
			const data = Array.from(revenueMap.values());
			setRevenueByMonth({ labels, data });
		}
	}, [allReservations]);

	// ✅ CHART DATA
	const chartData = useMemo(() => {
		const total = allReservations.length;

		const chartColors =
			theme.palette.mode === "dark"
				? {
					waiting: "#ffa726",
					checked: "#66bb6a",
					cancel: "#ef5350",
					finish: "#42a5f5",
				}
				: {
					waiting: "#ff9800",
					checked: "#4caf50",
					cancel: "#f44336",
					finish: "#2196f3",
				};

		return {
			labels: ["Chờ đến sân", "Đã đến", "Đã hủy", "Đã hoàn thành"],
			datasets: [
				{
					data: [statusCounts.waiting, statusCounts.checked, statusCounts.cancel, statusCounts.finish],
					backgroundColor: [
						chartColors.waiting,
						chartColors.checked,
						chartColors.cancel,
						chartColors.finish,
					],
					borderColor: theme.palette.background.paper,
					borderWidth: 3,
					hoverOffset: 10,
				},
			],
			total,
			chartColors,
		};
	}, [statusCounts, theme, allReservations]);

	const chartOptions = useMemo(
		() => ({
			responsive: true,
			maintainAspectRatio: false,
			cutout: "68%",
			plugins: {
				legend: { display: false },
				tooltip: {
					backgroundColor: theme.palette.background.paper,
					titleColor: theme.palette.text.primary,
					bodyColor: theme.palette.text.primary,
					borderColor: theme.palette.divider,
					borderWidth: 1,
					cornerRadius: 8,
					padding: 10,
					callbacks: {
						label: (context) => {
							const label = context.label || "";
							const value = context.parsed || 0;
							const total = chartData.total || 1;
							const percentage = ((value / total) * 100).toFixed(1);
							return `${label}: ${value} đơn (${percentage}%)`;
						},
					},
				},
				datalabels: {
					color: "#fff",
					font: {
						family: theme.typography.fontFamily,
						size: 13,
						weight: "bold",
					},
					textStrokeColor: "rgba(0,0,0,0.2)",
					textStrokeWidth: 2,
					formatter: (value) => {
						const total = chartData.total || 1;
						const percentage = ((value / total) * 100).toFixed(0);
						return percentage > 8 ? `${percentage}%` : "";
					},
				},
			},
			animation: {
				animateScale: true,
				animateRotate: true,
			},
		}),
		[theme, chartData.total]
	);

	const revenueChartData = useMemo(() => ({
		labels: revenueByMonth.labels,
		datasets: [
			{
				label: 'Doanh thu (VND)',
				data: revenueByMonth.data,
				backgroundColor: theme.palette.mode === "dark" ? "#42a5f5" : "#2196f3",
				borderColor: theme.palette.mode === "dark" ? "#1976d2" : "#1565c0",
				borderWidth: 2,
				borderRadius: 8,
			},
		],
	}), [revenueByMonth, theme]);

	const revenueChartOptions = useMemo(() => ({
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false,
			},
			tooltip: {
				backgroundColor: theme.palette.background.paper,
				titleColor: theme.palette.text.primary,
				bodyColor: theme.palette.text.primary,
				borderColor: theme.palette.divider,
				borderWidth: 1,
				cornerRadius: 8,
				padding: 10,
				callbacks: {
					label: (context) => {
						return `Doanh thu: ${context.parsed.y.toLocaleString()} VND`;
					},
				},
			},
		},
		scales: {
			y: {
				beginAtZero: true,
				ticks: {
					color: theme.palette.text.secondary,
					callback: (value) => {
						return value.toLocaleString() + ' đ';
					},
				},
				grid: {
					color: theme.palette.divider,
				},
			},
			x: {
				ticks: {
					color: theme.palette.text.secondary,
				},
				grid: {
					display: false,
				},
			},
		},
	}), [theme]);

	// ==================== SUB-COMPONENTS ====================
	const NumberTextField = React.memo(({ value, onChange, label, min = 0, max, ...props }) => {
		const handleChange = (e) => {
			const val = e.target.value;

			// Cho phép xóa hết → để trống
			if (val === "" || val === "-") {
				onChange("");
				return;
			}

			const num = parseInt(val, 10);
			if (!isNaN(num) && num >= min && (max === undefined || num <= max)) {
				onChange(num);
			}
		};


		const displayValue = value === "" || value === 0 ? "" : value;

		return (
			<TextField
				label={label}
				type="number"
				fullWidth
				margin="dense"
				value={displayValue}
				onChange={handleChange}
				inputProps={{ min, max, inputMode: "numeric" }}
				{...props}
			/>
		);
	});

	const AddPriceDialog = React.memo(
		({ open, onClose, newPrice, setNewPrice, newPriceType, setNewPriceType, onSubmit }) => {
			const [localPrice, setLocalPrice] = useState(newPrice);
			const [localType, setLocalType] = useState(newPriceType);
			const [dialogError, setDialogError] = useState("");

			useEffect(() => {
				if (open) {
					setLocalPrice(newPrice);
					setLocalType(newPriceType);
					setDialogError("");
					// Focus vào ô đầu tiên khi mở dialog
					setTimeout(() => startTimeRef.current?.querySelector('input')?.focus(), 100);
				}
			}, [open, newPrice, newPriceType]);

			const handleSubmit = (e) => {
				e.preventDefault();
				setDialogError("");

				const startTime = Number(localPrice.startTime);
				const endTime = Number(localPrice.endTime);
				const pricePerHour = Number(localPrice.pricePerHour);

				if (isNaN(startTime) || isNaN(endTime) || isNaN(pricePerHour)) {
					setDialogError("Vui lòng nhập đầy đủ thông tin");
					return;
				}

				if (startTime >= endTime) {
					setDialogError("Giờ bắt đầu phải nhỏ hơn giờ kết thúc");
					return;
				}

				if (pricePerHour <= 0) {
					setDialogError("Giá phải lớn hơn 0");
					return;
				}

				const dayType = localPrice.dayOfWeek === "Eow" ? "Eow" : "Bow";
				const currentTypeKey = localType;
				const existingPrices = groupedPrices[dayType][currentTypeKey] || [];

				if (!isTimeSlotValid(startTime, endTime, existingPrices)) {
					setDialogError("Khung giờ không hợp lệ! Phải nối tiếp khung trước (ví dụ: 6-12 → 12-18)");
					return;
				}

				onSubmit(e, localPrice, localType);
			};

			const handleClose = () => {
				setDialogError("");
				onClose();
			};

			// Xử lý Enter để nhảy field
			const handleKeyDown = (e, nextRef) => {
				if (e.key === "Enter") {
					e.preventDefault();
					nextRef.current?.querySelector('input')?.focus();
				}
			};

			if (!open) return null;

			return (
				<Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
					<DialogTitle sx={{ color: "primary.main", fontWeight: 600 }}>
						Thêm khung giá mới
					</DialogTitle>
					<DialogContent>
						<NumberTextField
							ref={startTimeRef}
							label="Giờ bắt đầu (0-23)"
							value={localPrice.startTime}
							onChange={(val) => setLocalPrice({ ...localPrice, startTime: val })}
							onKeyDown={(e) => handleKeyDown(e, endTimeRef)}
							min={0}
							max={23}
							sx={{ mt: 2 }}
							autoFocus // tự động focus khi mở
						/>

						<NumberTextField
							ref={endTimeRef}
							label="Giờ kết thúc (0-23)"
							value={localPrice.endTime}
							onChange={(val) => setLocalPrice({ ...localPrice, endTime: val })}
							onKeyDown={(e) => handleKeyDown(e, priceRef)}
							min={0}
							max={23}
						/>

						<NumberTextField
							ref={priceRef}
							label="Giá mỗi giờ (VND)"
							value={localPrice.pricePerHour}
							onChange={(val) => setLocalPrice({ ...localPrice, pricePerHour: val })}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleSubmit(e);
								}
							}}
							min={1}
						/>

						<FormControl fullWidth size="small" sx={{ mt: 2 }}>
							<InputLabel>Ngày trong tuần</InputLabel>
							<Select
								value={localPrice.dayOfWeek || "Bow"}
								label="Ngày trong tuần"
								onChange={(e) => setLocalPrice({ ...localPrice, dayOfWeek: e.target.value })}
							>
								<MenuItem value="Bow">Thứ 2 - Thứ 6</MenuItem>
								<MenuItem value="Eow">Thứ 7 - CN</MenuItem>
							</Select>
						</FormControl>

						<FormControl fullWidth size="small" sx={{ mt: 2 }}>
							<InputLabel>Loại giá</InputLabel>
							<Select
								value={localType}
								label="Loại giá"
								onChange={(e) => setLocalType(e.target.value)}
							>
								<MenuItem value="fixedPrices">Giá cố định</MenuItem>
								<MenuItem value="casualPrices">Giá vãng lai</MenuItem>
							</Select>
						</FormControl>

						{dialogError && (
							<Alert severity="error" sx={{ mt: 2 }}>
								{dialogError}
							</Alert>
						)}
					</DialogContent>
					<DialogActions>
						<Button onClick={handleClose}>Hủy</Button>
						<Button onClick={handleSubmit} variant="contained" color="primary">
							Lưu
						</Button>
					</DialogActions>
				</Dialog>
			);
		}
	);

	const PriceRow = React.memo(({ price, onSave, onDelete, formatTime }) => {
		const [isEditing, setIsEditing] = useState(false);
		const [localValues, setLocalValues] = useState({
			startTime: price.startTime,
			endTime: price.endTime,
			pricePerHour: price.pricePerHour,
		});
		const [rowError, setRowError] = useState(""); // Lỗi riêng cho từng dòng

		useEffect(() => {
			setLocalValues({
				startTime: price.startTime,
				endTime: price.endTime,
				pricePerHour: price.pricePerHour,
			});
			setRowError(""); // reset lỗi khi dữ liệu từ server thay đổi
		}, [price.startTime, price.endTime, price.pricePerHour]);

		const handleSave = () => {
			setRowError("");

			if (localValues.startTime >= localValues.endTime) {
				setRowError("Giờ bắt đầu phải nhỏ hơn giờ kết thúc");
				return;
			}
			if (localValues.pricePerHour <= 0) {
				setRowError("Giá phải lớn hơn 0");
				return;
			}

			const dayType = price.dayOfWeek === "1" || price.dayofweek === "1" ? "Eow" : "Bow";
			const typeKey = price.priceType?.type === "Cố định" || price.priceTypeName === "Cố định" ? "fixedPrices" : "casualPrices";
			const existingPrices = groupedPrices[dayType][typeKey] || [];

			if (!isTimeSlotValid(localValues.startTime, localValues.endTime, existingPrices, price.id)) {
				setRowError("Khung giờ không hợp lệ! Phải nối tiếp khung trước (ví dụ: 6-12 → 12-18)");
				return;
			}

			// Nếu OK → gọi save thật
			onSave(price.id, localValues);
			setIsEditing(false);
			setRowError("");
		};

		const handleCancel = () => {
			setIsEditing(false);
			setRowError("");
			setLocalValues({
				startTime: price.startTime,
				endTime: price.endTime,
				pricePerHour: price.pricePerHour,
			});
		};

		return (
			<>
				<TableRow hover sx={{ ...(rowError && { bgcolor: "error.light", opacity: 0.9 }) }}>
					<TableCell>
						{isEditing ? (
							<Stack direction="row" spacing={1} alignItems="center">
								<NumberTextField
									size="small"
									value={localValues.startTime}
									onChange={(v) => setLocalValues(prev => ({ ...prev, startTime: v }))}
									min={0}
									max={23}
									sx={{ width: 90 }}
								/>
								<Typography>-</Typography>
								<NumberTextField
									size="small"
									value={localValues.endTime}
									onChange={(v) => setLocalValues(prev => ({ ...prev, endTime: v }))}
									min={0}
									max={23}
									sx={{ width: 90 }}
								/>
							</Stack>
						) : (
							<Typography
								onClick={() => setIsEditing(true)}
								sx={{
									cursor: "pointer",
									fontWeight: 500,
									color: "text.primary",
									"&:hover": { textDecoration: "underline", color: "primary.main" },
								}}
							>
								{formatTime(price.startTime)} - {formatTime(price.endTime)}
							</Typography>
						)}
					</TableCell>

					<TableCell>
						{isEditing ? (
							<Stack direction="row" spacing={1} alignItems="center">
								<NumberTextField
									size="small"
									value={localValues.pricePerHour}
									onChange={(v) => setLocalValues(prev => ({ ...prev, pricePerHour: v }))}
									min={1}
									sx={{ width: 130 }}
								/>
								<IconButton size="small" color="success" onClick={handleSave}>
									<CheckIcon fontSize="small" />
								</IconButton>
								<IconButton size="small" color="error" onClick={handleCancel}>
									<Close fontSize="small" />
								</IconButton>
							</Stack>
						) : (
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography
									onClick={() => setIsEditing(true)}
									sx={{
										cursor: "pointer",
										fontWeight: 600,
										color: "success.main",
										"&:hover": { textDecoration: "underline" },
									}}
								>
									{price.pricePerHour.toLocaleString()}đ
								</Typography>
								<IconButton size="small" onClick={() => setIsEditing(true)}>
									<Edit fontSize="small" />
								</IconButton>
							</Stack>
						)}
					</TableCell>

					<TableCell align="center">
						<Tooltip title="Xóa">
							<IconButton size="small" color="error" onClick={() => onDelete(price.id)}>
								<Delete fontSize="small" />
							</IconButton>
						</Tooltip>
					</TableCell>
				</TableRow>

				{/* Hiển thị lỗi ngay dưới dòng */}
				{rowError && (
					<TableRow>
						<TableCell colSpan={3} sx={{ py: 0.5 }}>
							<Typography color="error" variant="caption" sx={{ fontWeight: 500, fontSize: "0.8rem" }}>
								{rowError}
							</Typography>
						</TableCell>
					</TableRow>
				)}
			</>
		);
	});
	const ReservationList = React.memo(
		({ data, onView, renderTimeRanges, renderStatus, isMobile, showDeposit }) => {
			if (isMobile) {
				return (
					<Stack spacing={2}>
						{data.map((res) => (
							<Card
								key={res.id}
								variant="outlined"
								sx={{
									p: 2,
									bgcolor: "background.paper",
									transition: "all 0.3s ease",
									"&:hover": {
										boxShadow: 3,
										transform: "translateY(-2px)",
									},
								}}
							>
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Stack direction="row" spacing={1} alignItems="center">
										<Avatar
											sx={{
												width: 32,
												height: 32,
												fontSize: 14,
												bgcolor: "primary.main",
												color: "primary.contrastText",
											}}
										>
											{res.playerName?.[0]}
										</Avatar>
										<Box>
											<Typography fontWeight="medium" color="text.primary">
												{res.playerName}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												ID: {res.id}
											</Typography>
										</Box>
									</Stack>
									<IconButton size="small" onClick={() => onView(res)}>
										<Visibility fontSize="small" />
									</IconButton>
								</Stack>
								{showDeposit && (
									<Typography mt={1} color="text.primary">
										Cọc: {res.deposit?.toLocaleString()} VND
									</Typography>
								)}
								<Box mt={1}>{renderTimeRanges(res)}</Box>
								<Box mt={1}>{renderStatus(res.status)}</Box>
							</Card>
						))}
					</Stack>
				);
			}

			return (
				<Table size="small">
					<TableHead>
						<TableRow>
							<TableCell sx={{ color: "text.primary", fontWeight: 600 }}>ID</TableCell>
							<TableCell sx={{ color: "text.primary", fontWeight: 600 }}>Khách</TableCell>
							{showDeposit && (
								<TableCell sx={{ color: "text.primary", fontWeight: 600 }}>Cọc</TableCell>
							)}
							<TableCell sx={{ color: "text.primary", fontWeight: 600 }}>Thông tin</TableCell>
							<TableCell sx={{ color: "text.primary", fontWeight: 600 }}>Trạng thái</TableCell>
							<TableCell sx={{ color: "text.primary", fontWeight: 600 }}>Hành động</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{data.map((res) => (
							<TableRow
								key={res.id}
								hover
								sx={{
									transition: "background-color 0.2s ease",
									"&:hover": {
										bgcolor: theme.palette.mode === "dark"
											? "rgba(255,255,255,0.05)"
											: "rgba(0,0,0,0.02)",
									},
								}}
							>
								<TableCell sx={{ color: "text.primary" }}>{res.id}</TableCell>
								<TableCell>
									<Stack direction="row" spacing={1} alignItems="center">
										<Avatar
											sx={{
												width: 28,
												height: 28,
												fontSize: 12,
												bgcolor: "primary.main",
												color: "primary.contrastText",
											}}
										>
											{res.playerName?.[0]}
										</Avatar>
										<Typography variant="body2" sx={{ color: "text.primary" }}>
											{res.playerName}
										</Typography>
									</Stack>
								</TableCell>
								{showDeposit && (
									<TableCell sx={{ color: "text.primary" }}>
										{res.deposit?.toLocaleString()} VND
									</TableCell>
								)}
								<TableCell sx={{ color: "text.primary" }}>{renderTimeRanges(res)}</TableCell>
								<TableCell>{renderStatus(res.status)}</TableCell>
								<TableCell>
									<IconButton size="small" onClick={() => onView(res)}>
										<Visibility fontSize="small" />
									</IconButton>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			);
		}
	);

	return (
		<Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
			{/* ==================== THANH ĐIỀU KHIỂN DÍNH TRÊN ĐẦU (STICKY) ==================== */}
			<Box
				sx={{
					position: "sticky",
					top: 0,
					zIndex: 1200,
					bgcolor: "background.paper",
					borderBottom: 1,
					borderColor: "divider",
					boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
					backdropFilter: "blur(10px)",
				}}
			>
				<Container maxWidth="xl">
					<Box sx={{ py: 3 }}>
						<Stack
							direction={{ xs: "column", sm: "row" }}
							justifyContent="space-between"
							alignItems="center"
							spacing={2}
						>
							<Typography variant="h5" fontWeight="bold" color="text.primary">
								Bảng điều khiển
							</Typography>

							<Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center">
								<TextField
									placeholder="Tìm khách..."
									size="small"
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<SearchIcon />
											</InputAdornment>
										),
									}}
									sx={{ minWidth: 200 }}
								/>

								<Select
									value={filterStatus}
									onChange={(e) => setFilterStatus(e.target.value)}
									size="small"
									sx={{ minWidth: 140 }}
								>
									<MenuItem value="ALL">Tất cả</MenuItem>
									<MenuItem value="waiting">Chờ đến sân</MenuItem>
									<MenuItem value="checked">Đã đến</MenuItem>
									<MenuItem value="cancel">Đã hủy</MenuItem>
									<MenuItem value="finish">Hoàn thành</MenuItem>
								</Select>

								<Button
									variant="contained"
									startIcon={<RefreshIcon />}
									onClick={handleRefresh}
								>
									Làm mới
								</Button>
							</Stack>
						</Stack>
					</Box>
				</Container>
			</Box>

			{/* ==================== NỘI DUNG CHÍNH (CÓ THỂ CUỘN) ==================== */}
			<Container maxWidth="xl" sx={{ mt: 3, pb: 6 }}>
				{/* Snackbar thông báo */}
				<Snackbar
					open={!!error || !!errorToday || !!successMessage}
					autoHideDuration={3000}
					onClose={() => {
						setError(null);
						setErrorToday(null);
						setSuccessMessage(null);
					}}
					anchorOrigin={{ vertical: "top", horizontal: "center" }}
				>
					<Alert severity={error || errorToday ? "error" : "success"}>
						{error || errorToday || successMessage}
					</Alert>
				</Snackbar>

				{/* === DÒNG 1: 2 BIỂU ĐỒ === */}
				<Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, mb: 4 }}>
					{/* Thống kê trạng thái */}
					<Card sx={{ p: 3, boxShadow: 4, borderRadius: 3 }}>
						<Typography variant="h6" fontWeight="bold" gutterBottom color="text.primary">
							Thống kê trạng thái đơn
						</Typography>
						<Box sx={{ height: 300, position: "relative" }}>
							<Doughnut data={chartData} options={chartOptions} plugins={[ChartDataLabels]} />
							<Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
								<Typography variant="h4" fontWeight="bold" color="primary">
									{allReservations.length}
								</Typography>
								<Typography variant="body2" color="text.secondary">Tổng đơn</Typography>
							</Box>
						</Box>
						<Box sx={{ mt: 3, display: "grid", gap: 2, gridTemplateColumns: "repeat(2, 1fr)" }}>
							{[
								{ label: "Chờ đến sân", value: statusCounts.waiting, color: chartData.chartColors.waiting },
								{ label: "Đã đến", value: statusCounts.checked, color: chartData.chartColors.checked },
								{ label: "Đã hủy", value: statusCounts.cancel, color: chartData.chartColors.cancel },
								{ label: "Đã hoàn thành", value: statusCounts.finish, color: chartData.chartColors.finish },
							].map((item) => (
								<Stack key={item.label} direction="row" alignItems="center" spacing={1.5}>
									<Box sx={{ width: 12, height: 12, bgcolor: item.color, borderRadius: "50%" }} />
									<Typography variant="body2" color="text.primary" sx={{ flex: 1 }}>
										{item.label}
									</Typography>
									<Typography variant="body2" fontWeight="bold" color="text.primary">
										{item.value}
									</Typography>
								</Stack>
							))}
						</Box>
					</Card>

					{/* Doanh thu 6 tháng */}
					<Card sx={{ p: 3, boxShadow: 4, borderRadius: 3 }}>
						<Typography variant="h6" fontWeight="bold" gutterBottom color="text.primary">
							Doanh thu 6 tháng gần đây
						</Typography>
						<Box textAlign="center" mb={2}>
							<Typography variant="h4" fontWeight="bold" color="success.main">
								{revenueByMonth.data.reduce((a, b) => a + b, 0).toLocaleString("vi-VN")} ₫
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Tổng doanh thu
							</Typography>
						</Box>
						<Box sx={{ height: 300 }}>
							{revenueByMonth.data.length === 0 ? (
								<Typography color="text.secondary" textAlign="center" py={8} fontStyle="italic">
									Chưa có dữ liệu doanh thu
								</Typography>
							) : (
								<Bar data={revenueChartData} options={revenueChartOptions} />
							)}
						</Box>
					</Card>
				</Box>

				{/* === BẢNG GIÁ === */}
				<Card sx={{ mb: 4, borderRadius: 3, boxShadow: 4 }}>
					<CardContent sx={{ p: { xs: 3, md: 4 } }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
							<Typography variant="h6" fontWeight="bold" color="text.primary">
								Giá thuê sân
							</Typography>
							<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddPrice} color="success">
								THÊM KHUNG GIÁ
							</Button>
						</Stack>

						<Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
							<Tabs value={activeDayTab} onChange={(_, v) => setActiveDayTab(v)} centered>
								<Tab label="Thứ 2 - Thứ 6" value="Bow" />
								<Tab label="Thứ 7 - CN" value="Eow" />
							</Tabs>
						</Box>

						{loadingPrices ? (
							<Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />
						) : (
							<Box sx={{ display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
								{/* Giá cố định */}
								<Box>
									<Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
										Giá cố định
									</Typography>
									<Paper variant="outlined" sx={{ p: 2, minHeight: 240 }}>
										{currentPrices.fixedPrices?.length ? (
											<Table size="small">
												<TableHead>
													<TableRow>
														<TableCell><strong>Giờ</strong></TableCell>
														<TableCell><strong>Giá/giờ</strong></TableCell>
														<TableCell align="center"><strong>Hành động</strong></TableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													{currentPrices.fixedPrices
														.sort((a, b) => a.startTime - b.startTime)
														.map((price) => (
															<PriceRow
																key={price.id}
																price={price}
																onSave={handleSaveClick}
																onDelete={handleDeleteClick}
																formatTime={formatTime}
															/>
														))}
												</TableBody>
											</Table>
										) : (
											<Typography textAlign="center" color="text.secondary" py={4}>
												Chưa có giá cố định
											</Typography>
										)}
									</Paper>
								</Box>

								{/* Giá vãng lai */}
								<Box>
									<Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
										Giá vãng lai
									</Typography>
									<Paper variant="outlined" sx={{ p: 2, minHeight: 240 }}>
										{currentPrices.casualPrices?.length ? (
											<Table size="small">
												<TableHead>
													<TableRow>
														<TableCell><strong>Giờ</strong></TableCell>
														<TableCell><strong>Giá/giờ</strong></TableCell>
														<TableCell align="center"><strong>Hành động</strong></TableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													{currentPrices.casualPrices
														.sort((a, b) => a.startTime - b.startTime)
														.map((price) => (
															<PriceRow
																key={price.id}
																price={price}
																onSave={handleSaveClick}
																onDelete={handleDeleteClick}
																formatTime={formatTime}
															/>
														))}
												</TableBody>
											</Table>
										) : (
											<Typography textAlign="center" color="text.secondary" py={4}>
												Chưa có giá vãng lai
											</Typography>
										)}
									</Paper>
								</Box>
							</Box>
						)}
					</CardContent>
				</Card>

				{/* === 5 lượt đặt gần đây === */}
				<Card sx={{ mb: 4, borderRadius: 3, boxShadow: 4 }}>
					<CardContent sx={{ p: { xs: 3, md: 4 } }}>
						<Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
							5 lượt đặt gần đây
						</Typography>
						{sortedRecent.length === 0 ? (
							<Typography color="text.secondary" fontStyle="italic">Không có dữ liệu</Typography>
						) : (
							<ReservationList
								data={sortedRecent.slice(0, 5)}
								onView={handleViewDetails}
								renderTimeRanges={renderTimeRanges}
								renderStatus={renderReservationStatus}
								isMobile={isMobile}
							/>
						)}
					</CardContent>
				</Card>

				{/* === Đơn đặt hôm nay === */}
				<Card sx={{ borderRadius: 3, boxShadow: 4 }}>
					<CardContent sx={{ p: { xs: 3, md: 4 } }}>
						<Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
							Đơn đặt hôm nay
						</Typography>
						{loadingToday ? (
							<Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
						) : sortedToday.length === 0 ? (
							<Typography color="text.secondary" fontStyle="italic">Không có đơn nào hôm nay</Typography>
						) : (
							<ReservationList
								data={sortedToday}
								onView={handleViewDetails}
								renderTimeRanges={renderTimeRanges}
								renderStatus={renderReservationStatus}
								isMobile={isMobile}
								showDeposit
							/>
						)}
					</CardContent>
				</Card>
			</Container>

			{/* ==================== CÁC DIALOG ==================== */}
			<AddPriceDialog
				open={addingNewPrice}
				onClose={() => setAddingNewPrice(false)}
				newPrice={newPrice}
				setNewPrice={setNewPrice}
				newPriceType={newPriceType}
				setNewPriceType={setNewPriceType}
				onSubmit={handleAddNewPrice}
			/>

			<Dialog open={!!deletePriceId} onClose={() => setDeletePriceId(null)}>
				<DialogTitle color="error">Xác nhận xóa</DialogTitle>
				<DialogContent>
					<Typography>Bạn có chắc chắn muốn xóa khung giá này?</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeletePriceId(null)}>Hủy</Button>
					<Button onClick={handleConfirmDelete} color="error" variant="contained">
						Xóa
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={!!selectedReservation} onClose={() => setSelectedReservation(null)} maxWidth="sm" fullWidth>
				<DialogTitle color="primary">Chi tiết đơn #{selectedReservation?.id}</DialogTitle>
				<DialogContent dividers>
					{selectedReservation && (
						<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
							<Stack direction="row" spacing={2} alignItems="center">
								<Avatar sx={{ bgcolor: "primary.main" }}>
									{selectedReservation.playerName?.[0]?.toUpperCase()}
								</Avatar>
								<Box>
									<Typography fontWeight="600">{selectedReservation.playerName}</Typography>
									<Typography variant="body2" color="text.secondary">Khách hàng</Typography>
								</Box>
							</Stack>
							<Typography><strong>Tiền cọc:</strong> {selectedReservation.deposit?.toLocaleString()} VND</Typography>
							<Typography><strong>Trạng thái:</strong> {renderReservationStatus(selectedReservation.status)}</Typography>
							<Box>
								<Typography variant="subtitle2" fontWeight="600">Sân đặt:</Typography>
								{renderTimeRanges(selectedReservation)}
							</Box>
							<Typography variant="body2" color="text.secondary">
								<strong>Ghi chú:</strong> {selectedReservation.notes || "Không có"}
							</Typography>
						</Box>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setSelectedReservation(null)}>Đóng</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default DashboardContent;
