import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

import {
	Box,
	Container,
	Typography,
	Grid,
	Card,
	CardContent,
	CardMedia,
	Divider,
	Chip,
	Rating,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Avatar,
	Button,
	List,
	ListItem,
	ListItemText,
	ListItemAvatar,
	IconButton,
	Tabs,
	Tab,
	Fade,
	Badge,
	useMediaQuery,
	CircularProgress,
	Alert,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Select,
	MenuItem,
	Checkbox,
	FormControl,
	InputLabel,
	OutlinedInput,
} from "@mui/material";
import HideImageIcon from "@mui/icons-material/HideImage";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import {
	format,
	addDays,
	isToday,
	isTomorrow,
	isAfter,
	isBefore,
	startOfMonth,
	getDay,
	addMonths,
	startOfWeek,
} from "date-fns";
import vi from "date-fns/locale/vi";

import {
	Phone,
	Mail,
	MapPin,
	Info,
	Clock,
	Tag,
	Star,
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	Calendar,
	SquareMousePointer,
	Map,
	XCircle,
	ArrowLeft,
	CreditCard,
	SquarePen,
} from "lucide-react";

import DOMPurify from "dompurify";

import { formatVND, formatTimeDate, formatDate } from "../../utils/format";

import branchService from "../../services/branchServce";
import reviewService from "../../services/reviewService";
import badmintionCourtService from "../../services/badmintonCourtService";
import voucherService from "../../services/voucherService";
import reservationService from "../../services/reservationService";
import reservationDetailService from "../../services/reservationDetailService";
import userService from "../../services/userService";
import authService from "../../services/authService";
import priceService from "../../services/priceService";
import { useAuth } from "../../../context/AuthContext";
import { useSnackbar } from "../../../context/SnackbarContext";

import UserLayout from "../../layouts/user/UserLayout";
import NotFound from "../NotFound";
import ReviewModal from "../../components/modal/WriteReviewModal";
import LoginModal from "../../components/modal/LoginModal";
import Developing from "../../components/common/Developing";
// import { useTheme } from "@mui/material/styles";
import theme from "../../theme/Theme";

const bookingType = [
	{ id: '1', label: 'Đặt theo ngày' },
	{ id: '2', label: 'Đặt cố định' },
];
const isWeekendDay = (date) => {
	const day = date.getDay(); // 0 = CN, 6 = T7
	return day === 0 || day === 6;
};

const BranchDetail = () => {
	const navigate = useNavigate();
	const { user, login } = useAuth();
	const { showSnackbar } = useSnackbar();
	// const theme = useTheme();

	const [selectedCourtIndex, setSelectedCourtIndex] = useState(0);
	const [courtImageIndices, setCourtImageIndices] = useState({});
	const [currentTab, setCurrentTab] = useState(0);
	const [branchDetail, setBranchDetail] = useState({
		courts: [],
		reviews: [],
		vouchers: [],
	});
	const [hasError, setHasError] = useState(false);
	const [selectedVoucher, setSelectedVoucher] = useState(null);
	const [profileData, setProfileData] = useState({});
	const [reviewOfUser, setReviewOfUser] = useState(null);
	const [openWriteReviewModal, setOpenWriteReviewModal] = useState(false);
	const [openLoginModal, setOpenLoginModal] = useState(false);
	const isDarkMode = theme.palette.mode === "dark";
	const [selectedFixedCourts, setSelectedFixedCourts] = useState([]);
	const [applyToAllCourts, setApplyToAllCourts] = useState(true);

	const [selectedSlots, setSelectedSlots] = useState([]);
	const [courts, setCourts] = useState([]);
	const [timeSlots, setTimeSlots] = useState([]);
	const [bookedSlots, setBookedSlots] = useState([]);
	const [minDate, setMinDate] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState(minDate);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [showBookingSummary, setShowBookingSummary] = useState(false);
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("momo");
	const [refreshFlag, setRefreshFlag] = useState(false);
	const [bookingTab, setBookinTab] = useState('1');
	const [priceTables, setPriceTables] = useState({
		fixedPrices: [],
		casualPrices: [],
	});
	const [priceDayTab, setPriceDayTab] = useState(0);

	// States cho đặt cố định
	const [fixedBookingDate, setFixedBookingDate] = useState(null);
	const [fixedSelectedSlots, setFixedSelectedSlots] = useState([]);
	const [fixedBookedSlots, setFixedBookedSlots] = useState([]);
	const [fixedLoading, setFixedLoading] = useState(false);
	const [showFixedBookingSummary, setShowFixedBookingSummary] = useState(false);
	const [selectedFixedPaymentMethod, setSelectedFixedPaymentMethod] = useState("momo");
	const [selectedCourts, setSelectedCourts] = useState([]);
	const [selectedDayTab, setSelectedDayTab] = useState(0);
	const [weekDaysOrder, setWeekDaysOrder] = useState([]);
	const [fixedTimeSlots, setFixedTimeSlots] = useState([]);

	const colorPalette = {
		available: "#f3f4f6",
		selected: "#3b82f6",
		booked: "#9ca3af",
		unavailable: "#e5e7eb",
		hover: "rgba(59, 130, 246, 0.1)",
		success: "#10b981",
		warning: "#f59e0b",
		textLight: "#ffffff",
		textDark: "#1f2937",
		textSecondary: "#6b7280",
	};

	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
	const { branchId } = useParams();
	const location = useLocation();
	const tabIndex = location.state?.tabIndex ?? 1;

	// console.log('BranchID: ', branchId);

	useEffect(() => {
		if (!user || !user.id) {
			return;
		}

		if (user.role !== "USER") {
			return;
		}

		const fetchProfile = async () => {
			try {
				const profile = await userService.getProfile(user.id);
				setProfileData(profile.data);
			} catch (error) {
				console.error("Failed to fetch profile:", error);
			}
		};

		fetchProfile();
	}, [user]);

	useEffect(() => {
		const fetchBranchDetail = async () => {
			try {
				const branchInfor = await branchService.getBranchById(branchId);
				if (!branchInfor || Object.keys(branchInfor).length === 0) {
					throw new Error("Branch not found");
				}

				const reviews = await reviewService.getAllReviewsOfBranch(branchId);
				const courts =
					await badmintionCourtService.getAllCourtsOfBranchByStatus(
						branchId,
						"true"
					);
				const vouchers = await voucherService.getAllVouchersOfBranch(branchId);

				const updatedBranchInfor = {
					...branchInfor,
					reviews: reviews,
					courts: courts,
					vouchers: vouchers,
				};

				setBranchDetail(updatedBranchInfor);
				setHasError(false);

				// console.log('infor: ', branchInfor);
				// console.log('reviews', reviews);
				// console.log('courts', courts);
			} catch (error) {
				setHasError(true);
				console.error("Error fetching branch data:", error);
			}
		};

		fetchBranchDetail();
	}, [branchId]);

	useEffect(() => {
		if (!user || !branchDetail) {
			return;
		}

		setReviewOfUser(branchDetail.reviews.find((r) => r.accountId == user.id));
	}, [user, branchDetail]);

	// console.log('branch: ', branchDetail);
	// console.log('profile data ', profileData);
	// console.log('review of user ', reviewOfUser);
	// console.log('user: ', user);

	useEffect(() => {
		const fetchData = async () => {
			if (!branchDetail) return;

			try {
				setLoading(true);
				setError(null);

				const reservationData = await reservationService.getUncanceledReservationOfBranchByDate(
					branchId,
					formatDate(selectedDate)
				);

				// console.log('Reservation Data:', reservationData);
				// console.log('branch Detail', branchDetail);

				const { minStartTime, maxEndTime } = getMinStartTimeAndMaxEndTime(
					branchDetail.prices
				);

				const generateTimeSlots = () => {
					const slots = [];
					for (let hour = minStartTime; hour <= maxEndTime; hour++) {
						if (hour < maxEndTime) {
							const formatTime = (value) => value.toString().padStart(2, "0");

							slots.push({
								id: `${formatTime(hour)}:00-${formatTime(hour)}:30`,
								startLabel: `${formatTime(hour)}:00`,
								endLabel: `${formatTime(hour)}:30`,
								displayLabel: `${formatTime(hour)}:00 - ${formatTime(hour)}:30`,
								hour,
								minute: 0,
								endHour: hour,
								endMinute: 30,
							});

							slots.push({
								id: `${formatTime(hour)}:30-${formatTime(hour + 1)}:00`,
								startLabel: `${formatTime(hour)}:30`,
								endLabel: `${formatTime(hour + 1)}:00`,
								displayLabel: `${formatTime(hour)}:30 - ${formatTime(
									hour + 1
								)}:00`,
								hour,
								minute: 30,
								endHour: hour + 1,
								endMinute: 0,
							});
						}
					}
					// console.log('slot: ', slots);
					return slots;
				};

				setCourts(branchDetail.courts);
				setTimeSlots(generateTimeSlots());
				setBookedSlots(transformBookedSlots(reservationData));
			} catch (err) {
				setError("Đã có lỗi khi tải dữ liệu. Vui lòng thử lại.");
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [selectedDate, branchDetail]);

	useEffect(() => {
		const fetchPrices = async () => {
			try {
				const data = await priceService.getAllPriceTypesByBranch(branchId);
				setPriceTables(data);
			} catch (err) {
				console.error("Lỗi tải bảng giá:", err);
			}
		};
		fetchPrices();
	}, [branchId]);

	// Fetch data cho đặt cố định
	// LẤY DỮ LIỆU BOOKED CHO CẢ 28 NGÀY (4 TUẦN) – BẮT BUỘC
	useEffect(() => {
		const fetchFixedBookingData = async () => {
			if (!branchDetail || !fixedBookingDate || bookingTab !== '2') return;

			try {
				setFixedLoading(true);

				const startDate = new Date(fixedBookingDate);
				const endDate = new Date(startDate);
				endDate.setDate(startDate.getDate() + 28);

				const bookedSlots = [];

				const reservationsResponse = await reservationService.getUncanceledReservationOfBranchBetween(branchId, startDate, endDate);

				reservationsResponse.forEach(reservation => {
					const reservationDate = new Date(reservation.bookAt);
					const dayOfWeek = reservationDate.getDay();

					const slots = transformBookedSlots([reservation]);

					slots.forEach(slot => {
						bookedSlots.push({
							...slot,
							dayIndex: dayOfWeek
						});
					});
				});

				setFixedBookedSlots(bookedSlots);
			} catch (err) {
				console.error("Lỗi tải dữ liệu đặt cố định:", err);
			} finally {
				setFixedLoading(false);
			}
		};

		fetchFixedBookingData();
	}, [fixedBookingDate, branchDetail, bookingTab, branchId]);


	useEffect(() => {
		const fetchReviews = async () => {
			const reviews = await reviewService.getAllReviewsOfBranch(branchId);

			setBranchDetail((prev) => ({
				...prev,
				reviews: reviews,
			}));
		};
		fetchReviews();
	}, [branchId, refreshFlag]);

	useEffect(() => {
		if (location.state?.tabIndex !== undefined) {
			setCurrentTab(tabIndex);
		}
	}, [tabIndex]);

	useEffect(() => {
		// Tính toán ngày đầu tháng tiếp theo
		const getFirstDayOfNextMonth = () => {
			const today = new Date();
			const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
			return nextMonth;
		};

		if (bookingTab === '2') {
			const firstDayNextMonth = getFirstDayOfNextMonth();
			setFixedBookingDate(firstDayNextMonth);
			setSelectedCourts([]);
			setFixedSelectedSlots([]);
			generateFixedTimeSlots();
		}
	}, [bookingTab, priceTables.fixedPrices]);

	// Tạo time slots cho đặt cố định
	const generateFixedTimeSlots = () => {
		const { minStartTime, maxEndTime } = getFixedMinStartAndMaxEnd(); // ← DÙNG HÀM MỚI

		const slots = [];
		for (let hour = minStartTime; hour < maxEndTime; hour++) {
			const formatTime = (value) => value.toString().padStart(2, "0");

			// 00 - 30
			slots.push({
				id: `${formatTime(hour)}:00-${formatTime(hour)}:30`,
				startLabel: `${formatTime(hour)}:00`,
				endLabel: `${formatTime(hour)}:30`,
				displayLabel: `${formatTime(hour)}:00 - ${formatTime(hour)}:30`,
				hour,
				minute: 0,
				endHour: hour,
				endMinute: 30,
			});

			// 30 - 00 (giờ tiếp theo)
			slots.push({
				id: `${formatTime(hour)}:30-${formatTime(hour + 1)}:00`,
				startLabel: `${formatTime(hour)}:30`,
				endLabel: `${formatTime(hour + 1)}:00`,
				displayLabel: `${formatTime(hour)}:30 - ${formatTime(hour + 1)}:00`,
				hour,
				minute: 30,
				endHour: hour + 1,
				endMinute: 0,
			});
		}

		setFixedTimeSlots(slots);
	};

	// Tính thứ tự các ngày trong tuần dựa trên ngày 1 của tháng
	useEffect(() => {
		if (fixedBookingDate && bookingTab === '2') {
			const firstDayOfMonth = startOfMonth(fixedBookingDate);
			const dayOfWeek = getDay(firstDayOfMonth); // 0 = CN, 1 = T2, ..., 6 = T7

			// Tạo mảng thứ tự bắt đầu từ ngày đầu tháng
			const daysOrder = [];
			const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
			const shortNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

			for (let i = 0; i < 7; i++) {
				const dayIndex = (dayOfWeek + i) % 7;
				daysOrder.push({
					index: dayIndex,
					name: dayNames[dayIndex],
					shortName: shortNames[dayIndex],
				});
			}

			setWeekDaysOrder(daysOrder);
			setSelectedDayTab(0);
		}
	}, [fixedBookingDate, bookingTab]);

	const getGoogleMapUrl = (address) =>
		`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

	const getDestination = (address) =>
		`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
			address
		)}`;

	const navigateCourtImage = (courtId, direction) => {
		const court = branchDetail.courts.find((c) => c.id === courtId);
		if (!court) return;

		setCourtImageIndices((prevIndices) => {
			const currentIndex = prevIndices[courtId];
			let newIndex =
				direction === "next"
					? currentIndex === court.images.length - 1
						? 0
						: currentIndex + 1
					: currentIndex === 0
						? court.images.length - 1
						: currentIndex - 1;

			return { ...prevIndices, [courtId]: newIndex };
		});
	};


	const handleTabChange = (event, newValue) => {
		setCurrentTab(newValue);
	};

	const handleCourtSelection = (index) => {
		const courtId = branchDetail.courts[index].id;

		setSelectedCourtIndex(index);
	};

	const handleBookingCourtSelection = (courtId) => {

		// console.log("courtId: ", courtId)

		setSelectedFixedCourts(prev => {
			if (prev.includes(courtId)) {
				return prev.filter(id => id !== courtId);
			} else {
				return [...prev, courtId];
			}
		});
	};

	const handleReviewSubmitted = () => {
		setRefreshFlag((prev) => !prev);
	};

	if (hasError) {
		return <NotFound />;
	}

	const handleFixedBookCourts = () => {
		if (!user) {
			setOpenLoginModal(true);
			return;
		}
		if (fixedSelectedSlots.length === 0) {
			alert("Vui lòng chọn ít nhất 1 khung giờ");
			return;
		}
		setShowFixedBookingSummary(true);
	};

	if (
		Object.keys(courtImageIndices).length === 0 &&
		branchDetail?.courts?.length > 0
	) {
		const initialIndices = {};
		branchDetail.courts.forEach((court) => {
			initialIndices[court.id] = 0;
		});
		setCourtImageIndices(initialIndices);
	}

	const renderPriceTable = (title, prices, icon, colorScheme, description) => {
		if (!prices || prices.length === 0) return null;

		const formatTime = (t) => `${t.toString().padStart(2, "0")}:00`;
		const isDarkMode = theme.palette.mode === "dark";

		// Xác định kiểu bảng: xanh (primary) hay cam
		const isFixed = colorScheme?.header === theme.palette.primary.main;
		const headerColor = isFixed ? theme.palette.primary.main : "#f57c00";

		// Màu nền row dịu nhẹ, tinh tế, dễ nhìn
		const rowBgEven = isDarkMode
			? "rgba(255, 255, 255, 0.06)"
			: isFixed
				? "rgba(144, 202, 249, 0.08)"  // xanh rất nhẹ
				: "rgba(255, 152, 0, 0.08)";   // cam rất nhẹ

		const rowBgOdd = isDarkMode
			? "rgba(255, 255, 255, 0.10)"
			: isFixed
				? "rgba(144, 202, 249, 0.14)"
				: "rgba(255, 152, 0, 0.14)";

		return (
			<Card
				sx={{
					borderRadius: theme.shape.borderRadius,
					overflow: "hidden",
					boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
					border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
					mb: 5,
					bgcolor: "background.paper",
				}}
			>
				{/* HEADER - Sạch sẽ, thanh lịch */}
				<Box
					sx={{
						bgcolor: headerColor,
						color: "white",
						px: { xs: 3, md: 4 },
						py: 3,
						display: "flex",
						alignItems: "center",
						gap: 2,
						position: "relative",
						overflow: "hidden",

						"&::before": {
							content: '""',
							position: "absolute",
							left: 0,
							top: 0,
							bottom: 0,
							width: 10,
							background:
								"linear-gradient(190deg, rgba(255,255,255, -0.5), rgba(255,255,255,0.5))",
						},
					}}
				>
					{icon}
					<Typography variant="h6" fontWeight={800}>
						{title}
					</Typography>
				</Box>

				{/* MÔ TẢ */}
				{description && (
					<Box sx={{ px: { xs: 3, md: 4 }, py: 2 }}>
						<Typography variant="body2" color="text.secondary" fontStyle="italic">
							{description}
						</Typography>
					</Box>
				)}

				{/* BẢNG GIÁ - SIÊU SẠCH */}
				<TableContainer sx={{ overflow: "hidden" }}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell
									sx={{
										bgcolor: headerColor,
										color: "white",
										fontWeight: 700,
										py: 2.5,
										fontSize: "1rem",
										borderBottom: "none",
									}}
								>
									Khung giờ
								</TableCell>
								<TableCell
									align="right"
									sx={{
										bgcolor: headerColor,
										color: "white",
										fontWeight: 700,
										py: 2.5,
										fontSize: "1rem",
										borderBottom: "none",
									}}
								>
									Giá / giờ
								</TableCell>
							</TableRow>
						</TableHead>

						<TableBody>
							{prices.map((item, index) => {
								const isEven = index % 2 === 0;
								return (
									<TableRow
										key={index}
										sx={{
											bgcolor: isEven ? rowBgEven : rowBgOdd,
											transition: "none",
											"&:hover": {
												bgcolor: isEven ? rowBgEven : rowBgOdd, // giữ nguyên màu
											},
										}}
									>
										<TableCell
											sx={{
												py: 3,
												fontWeight: 500,
												fontSize: 20,
												color: "text.primary",
												borderBottom: "none",
											}}
										>
											{formatTime(item.startTime)} - {formatTime(item.endTime)}
										</TableCell>

										<TableCell
											align="right"
											sx={{
												py: 3,
												fontWeight: 600,
												fontSize: 25,
												color: isDarkMode
													? (isFixed ? "#bbdefb" : "#ffcc80")  // sáng nhẹ, dễ đọc
													: (isFixed ? "#3c84f1ff" : "#e65100"), // đậm vừa phải
												borderBottom: "none",
											}}
										>
											{formatVND(item.pricePerHour)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			</Card>
		);
	};


	const getMinStartTimeAndMaxEndTime = (prices) => {
		const today = new Date();
		const isTodaySelected =
			selectedDate.toDateString() === today.toDateString();

		let minStartTime = 7;
		let maxEndTime = 22;

		if (prices && prices.length > 0) {
			minStartTime = Math.min(
				minStartTime,
				...prices.map((price) => price.startTime)
			);
			maxEndTime = Math.max(
				maxEndTime,
				...prices.map((price) => price.endTime)
			);
		}

		if (isTodaySelected) {
			const currentHour = today.getHours();

			if (currentHour >= maxEndTime) {
				const nextAvailableDate = addDays(today, 1);
				setMinDate(nextAvailableDate);
				setSelectedDate(nextAvailableDate);
			} else {
				minStartTime = Math.max(minStartTime, currentHour + 1);
			}
		}

		return { minStartTime, maxEndTime };
	};

	const transformBookedSlots = (reservations) => {
		const slots = [];

		if (!reservations) {
			return slots;
		}

		reservations?.forEach((r) => {
			r.reservationDetails?.forEach((d) => {
				const courtId = d.badmintonCourtId;
				const splitTime = d.startTime.split(":");
				let hour = parseInt(splitTime[0], 10);
				let minute = parseInt(splitTime[1], 10);

				const totalMinutes = d.rentalTime * 60;
				const numberOfSlots = totalMinutes / 30;

				for (let i = 0; i < numberOfSlots; i++) {
					const startHour = hour.toString().padStart(2, "0");
					const startMinute = minute.toString().padStart(2, "0");

					minute += 30;
					if (minute >= 60) {
						minute -= 60;
						hour += 1;
					}

					const endHour = hour.toString().padStart(2, "0");
					const endMinute = minute.toString().padStart(2, "0");

					const timeSlotId = `${startHour}:${startMinute}-${endHour}:${endMinute}`;
					slots.push({ courtId, timeSlotId });
				}
			});
		});

		return slots;
	};

	const isSlotBooked = (courtId, timeSlotId) => {
		return bookedSlots.some(
			(slot) => slot.courtId === courtId && slot.timeSlotId === timeSlotId
		);
	};

	const isSlotSelected = (courtId, timeSlotId) => {
		return selectedSlots.some(
			(slot) => slot.courtId === courtId && slot.timeSlotId === timeSlotId
		);
	};

	const handleSlotClick = (courtId, timeSlotId) => {
		if (isSlotBooked(courtId, timeSlotId)) return;

		const newSelectedSlots = [...selectedSlots];
		const existingIndex = newSelectedSlots.findIndex(
			(slot) => slot.courtId === courtId && slot.timeSlotId === timeSlotId
		);

		if (existingIndex >= 0) {
			newSelectedSlots.splice(existingIndex, 1);
		} else {
			newSelectedSlots.push({ courtId, timeSlotId });
		}

		setSelectedSlots(newSelectedSlots);
	};

	// Handler cho đặt cố định
	const handleFixedSlotClick = (courtId, timeSlotId, dayIndex) => {
		// Nếu chưa chọn sân nào → báo lỗi
		if (selectedFixedCourts.length === 0) {
			alert('Vui lòng chọn ít nhất 1 sân trước!');
			return;
		}

		// Nếu đã bật "Áp dụng cho tất cả sân"
		if (applyToAllCourts) {
			const allCourts = selectedFixedCourts;

			// Kiểm tra xem có sân nào trong danh sách bị booked không
			const anyBooked = allCourts.some(cId =>
				isFixedSlotBooked(cId, timeSlotId, dayIndex)
			);

			if (anyBooked) {
				alert('Một số sân đã được đặt ở khung giờ này!');
				return;
			}

			// Kiểm tra trạng thái hiện tại: TẤT CẢ các sân đã được chọn chưa?
			const allSelected = allCourts.every(cId =>
				isFixedSlotSelected(cId, timeSlotId, dayIndex)
			);

			if (allSelected) {
				// Nếu TẤT CẢ đã chọn → bỏ chọn ở tất cả
				setFixedSelectedSlots(prev =>
					prev.filter(slot =>
						!(allCourts.includes(slot.courtId) &&
							slot.timeSlotId === timeSlotId &&
							slot.dayIndex === dayIndex)
					)
				);
			} else {
				// Nếu CHƯA TẤT CẢ chọn → thêm vào tất cả sân
				const newSlots = allCourts.map(cId => ({
					courtId: cId,
					timeSlotId,
					dayIndex,
				}));
				// Lọc bỏ trùng lặp
				setFixedSelectedSlots(prev => {
					const existingSlots = new Set(
						prev.map(s => `${s.courtId}-${s.timeSlotId}-${s.dayIndex}`)
					);
					const filteredNewSlots = newSlots.filter(
						slot => !existingSlots.has(`${slot.courtId}-${slot.timeSlotId}-${slot.dayIndex}`)
					);
					return [...prev, ...filteredNewSlots];
				});
			}
		}
		// Nếu tắt "Áp dụng cho tất cả" → chỉ chọn riêng sân đang click
		else {
			if (isFixedSlotBooked(courtId, timeSlotId, dayIndex)) return;

			setFixedSelectedSlots(prev => {
				const exists = prev.some(s =>
					s.courtId === courtId &&
					s.timeSlotId === timeSlotId &&
					s.dayIndex === dayIndex
				);

				if (exists) {
					return prev.filter(s =>
						!(s.courtId === courtId &&
							s.timeSlotId === timeSlotId &&
							s.dayIndex === dayIndex)
					);
				} else {
					return [...prev, { courtId, timeSlotId, dayIndex }];
				}
			});
		}
	};
	const isFixedSlotBooked = (courtId, timeSlotId, dayIndex) => {
		return fixedBookedSlots.some(
			(slot) =>
				slot.courtId === courtId &&
				slot.timeSlotId === timeSlotId &&
				slot.dayIndex === dayIndex
		);
	};

	const isFixedSlotSelected = (courtId, timeSlotId, dayIndex) => {
		return fixedSelectedSlots.some(
			(slot) =>
				slot.courtId === courtId &&
				slot.timeSlotId === timeSlotId &&
				slot.dayIndex === dayIndex
		);
	};

	const formatDisplayDate = (date) => {
		if (isToday(date)) return "Hôm nay";
		if (isTomorrow(date)) return "Ngày mai";
		return format(date, "EEEE, dd/MM/yyyy", { locale: vi });
	};

	const isDateValid = (date) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const maxDate = addDays(today, 30);
		return isAfter(date, today) && isBefore(date, maxDate);
	};

	const calculateTotalPrice = () => {
		if (selectedSlots.length === 0 || !priceTables.casualPrices) return 0;

		const isWeekend = isWeekendDay(selectedDate);

		// Lọc giá vãng lai phù hợp
		const applicableCasualPrices = priceTables.casualPrices.filter(price => {
			if (!price.dayOfWeek) return true;
			return isWeekend ? price.dayOfWeek === "1" : price.dayOfWeek === "0";
		});

		const finalPrices = applicableCasualPrices.length > 0
			? applicableCasualPrices
			: priceTables.casualPrices;

		return selectedSlots.reduce((total, slot) => {
			const startHour = parseInt(slot.timeSlotId.split("-")[0].split(":")[0], 10);

			const matchingPrice = finalPrices.find(p =>
				p.startTime <= startHour && p.endTime > startHour
			);

			const pricePer30Min = matchingPrice
				? matchingPrice.pricePerHour / 2
				: 0;

			return total + pricePer30Min;
		}, 0);
	};

	const calculateTotalDiscount = () => {
		return selectedVoucher?.discountRate
			? selectedVoucher.discountRate / 100
			: 0;
	};

	const calculateDiscountedPrice = () => {
		const total = calculateTotalPrice();
		const discount = calculateTotalDiscount();
		return Math.max(0, total - total * discount);
	};

	const handleLoginSuccess = async (response) => {
		localStorage.setItem("authToken", response.token);
		const userLogged = await login();
		setOpenLoginModal(false);
	};



	// Tính tổng giá cho đặt cố định
	const calculateFixedTotalPrice = () => {
		if (fixedSelectedSlots.length === 0 || !priceTables.fixedPrices) return 0;

		// Nhóm theo sân + ngày để gộp khung giờ liền nhau
		const grouped = {};

		fixedSelectedSlots.forEach(slot => {
			const key = `${slot.courtId}-${slot.dayIndex}`;
			if (!grouped[key]) grouped[key] = [];

			// Chuyển timeSlotId thành phút từ 0h (ví dụ: "21:00-21:30" → 1260)
			const startStr = slot.timeSlotId.split("-")[0]; // "21:00"
			const [hour, minute] = startStr.split(":").map(Number);
			const minutesFromMidnight = hour * 60 + minute;

			grouped[key].push(minutesFromMidnight);
		});

		let totalPrice = 0;

		Object.values(grouped).forEach(slots => {
			if (!slots || slots.length === 0) return;

			// Sắp xếp để gộp được khung liền nhau
			slots.sort((a, b) => a - b);

			let i = 0;
			while (i < slots.length) {
				let currentStart = slots[i];
				let currentEnd = currentStart + 30;
				let count = 1;

				// Gộp các khung liền nhau (cách nhau đúng 30 phút)
				while (i + count < slots.length && slots[i + count] === currentEnd) {
					currentEnd += 30;
					count++;
				}

				const durationHours = (currentEnd - currentStart) / 60; // 30p → 0.5, 60p → 1.0...
				const startHour = Math.floor(currentStart / 60);

				// Tìm bảng giá cố định phù hợp với giờ bắt đầu
				const matchingPrice = priceTables.fixedPrices.find(p =>
					p.startTime <= startHour && p.endTime > startHour
				);

				if (matchingPrice) {
					totalPrice += matchingPrice.pricePerHour * durationHours;
				}

				i += count;
			}
		});

		return totalPrice; // Đây là tiền 1 tuần (đã gộp đúng)
	};

	const handleRegisterSuccess = () => {
		setOpenLoginModal(false);
	};

	const getFixedMinStartAndMaxEnd = () => {
		if (!priceTables.fixedPrices || priceTables.fixedPrices.length === 0) {
			return { minStartTime: 7, maxEndTime: 22 }; // fallback an toàn
		}

		const startTimes = priceTables.fixedPrices.map(p => p.startTime);
		const endTimes = priceTables.fixedPrices.map(p => p.endTime);

		return {
			minStartTime: Math.min(...startTimes),
			maxEndTime: Math.max(...endTimes),
		};
	};

	const handleBookCourts = () => {
		if (!user) {
			setOpenLoginModal(true);
			return;
		}

		setShowBookingSummary(true);
	};

	const confirmBooking = async () => {
		let createdReservationId = null;

		try {
			const groupedSlots = selectedSlots.reduce((acc, slot) => {
				if (!acc[slot.courtId]) {
					acc[slot.courtId] = [];
				}
				acc[slot.courtId].push(slot.timeSlotId);
				return acc;
			}, {});

			const bookingInfo = Object.entries(groupedSlots).map(([courtId, slots]) => {
				const court = courts.find((c) => c.id === courtId);
				const sortedSlots = [...slots].sort();

				const bookingSlots = sortedSlots.map((slotId) => {
					const timeSlot = timeSlots.find((slot) => slot.id === slotId);
					return {
						startTime: timeSlot.startLabel,
						endTime: timeSlot.endLabel,
					};
				});

				return {
					courtId: courtId,
					courtName: court.ordinalNumber,
					slots: bookingSlots,
				};
			});

			const reservationData = {
				bookAt: formatDate(selectedDate),
				totalPrice: calculateDiscountedPrice(),
				deposit:
					calculateDiscountedPrice() - (calculateDiscountedPrice() * 50) / 100,
				status: "awaiting_payment",
				playerId: profileData.id,
				voucherId: selectedVoucher ? selectedVoucher.id : null,
				branchId: branchId,
			};

			const reservationResponse = await reservationService.postReservation(reservationData);
			createdReservationId = reservationResponse.id;
			await reservationService.scheduleCancellation(reservationResponse.id);
			const rentalDetails = getRentalDetails(bookingInfo, reservationResponse.id);

			for (const detail of rentalDetails) {
				await reservationDetailService.postReservationDetail(detail);
			}

			if (selectedPaymentMethod === "cod") {
				await reservationService.updateReservationStatus(reservationResponse.id, "waiting");
				navigate(`/booking-successfully`, {
					state: {
						branchDetail,
						reservationId: reservationResponse.id,
					},
				});
			} else if (selectedPaymentMethod === "bank") {
				const oneTimeSession = crypto.randomUUID();
				sessionStorage.setItem("checkoutSession", oneTimeSession);
				navigate(`/checkout?session=${oneTimeSession}`, {
					state: {
						branchDetail,
						reservationId: reservationResponse.id,
						reservationData: { ...reservationData, id: reservationResponse.id },
						reservationDetails: bookingInfo,
						selectedVoucher,
					},
				});
			} else {
				navigate(`/demo-payment?resIds=${reservationResponse.id}&type=single`, {
					state: {
						branchDetail,
						amount: reservationData.deposit,
						title: "Thanh toán MoMo",
						description: "Quét mã QR bằng ví MoMo để hoàn tất đặt cọc.",
						paymentContent: `MOMO ${reservationResponse.id}`,
					},
				});
			}
			setSelectedSlots([]);
			setShowBookingSummary(false);
		} catch (error) {
			console.error("Error confirming booking:", error);

			if (createdReservationId) {
				try {
					await reservationService.cancelReservation(createdReservationId);
				} catch (rollbackError) {
					console.error("Error rolling back reservation after payment failure:", rollbackError);
				}
			}

			showSnackbar(
				(error.response?.data?.message || error.message || "Khong the khoi tao thanh toan MoMo.")
					+ (error.config?.url ? ` [${error.config.url}]` : ""),
				"error"
			);
		}
	};

	// console.log(selectedDate);

	function getRentalDetails(details, reservationId) {
		const result = [];

		details.forEach(({ courtId, slots }) => {
			slots.sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

			let groupStart = slots[0].startTime;
			let prevEnd = slots[0].endTime;
			let totalDuration = parseTime(prevEnd) - parseTime(groupStart);

			for (let i = 1; i < slots.length; i++) {
				const currentStart = slots[i].startTime;
				const currentEnd = slots[i].endTime;

				if (parseTime(currentStart) === parseTime(prevEnd)) {
					totalDuration += parseTime(currentEnd) - parseTime(currentStart);
					prevEnd = currentEnd;
				} else {
					result.push({
						reservationId: reservationId,
						badmintonCourtId: courtId,
						startTime: groupStart,
						rentalTime: formatToHours(totalDuration),
						extendedTime: 0,
					});

					groupStart = currentStart;
					prevEnd = currentEnd;
					totalDuration = parseTime(currentEnd) - parseTime(currentStart);
				}
			}

			result.push({
				reservationId: reservationId,
				badmintonCourtId: courtId,
				startTime: groupStart,
				rentalTime: formatToHours(totalDuration),
				extendedTime: 0,
			});
		});

		return result;
	}

	function parseTime(timeStr) {
		const [hours, minutes] = timeStr.split(":").map(Number);
		return hours * 60 + minutes;
	}

	function formatToHours(minutes) {
		return minutes / 60;
	}

	const confirmFixedBooking = async () => {
		if (fixedSelectedSlots.length === 0) {
			alert("Vui lòng chọn ít nhất một khung giờ!");
			return;
		}

		try {
			// 1. Tính tổng tiền 1 tuần
			const weeklyTotal = calculateFixedTotalPrice();
			const totalFor4Weeks = weeklyTotal * 4;

			// 2. Áp voucher nếu có
			const discountRate = selectedVoucher ? selectedVoucher.discountRate / 100 : 0;
			const finalTotalPrice = Math.round(totalFor4Weeks * (1 - discountRate));

			// 3. Nhóm slots theo ngày (dayIndex)
			const slotsByDay = {};
			fixedSelectedSlots.forEach(slot => {
				if (!slotsByDay[slot.dayIndex]) slotsByDay[slot.dayIndex] = [];
				slotsByDay[slot.dayIndex].push(slot);
			});

			const weeklySchedule = [];
			const dayMap = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

			// 4. Xử lý từng ngày
			Object.keys(slotsByDay).forEach(dayIndexStr => {
				const dayIndex = parseInt(dayIndexStr);
				const daySlots = slotsByDay[dayIndex];

				// Nhóm theo sân
				const slotsByCourt = {};
				daySlots.forEach(s => {
					if (!slotsByCourt[s.courtId]) slotsByCourt[s.courtId] = [];
					slotsByCourt[s.courtId].push(s);
				});

				const details = [];

				// 5. Xử lý từng sân
				Object.values(slotsByCourt).forEach(courtSlots => {
					// Sắp xếp theo thời gian (chuyển sang phút để sort chính xác)
					courtSlots.sort((a, b) => {
						const timeA = a.timeSlotId.split("-")[0];
						const timeB = b.timeSlotId.split("-")[0];
						const [hA, mA] = timeA.split(":").map(Number);
						const [hB, mB] = timeB.split(":").map(Number);
						return (hA * 60 + mA) - (hB * 60 + mB);
					});

					// 6. Gộp các slot liền nhau - LOGIC MỚI ĐÚNG 100%
					let i = 0;
					while (i < courtSlots.length) {
						const startSlot = courtSlots[i];
						const startTime = startSlot.timeSlotId.split("-")[0]; // "07:00"

						// Chuyển thành phút từ 0h
						const [startHour, startMin] = startTime.split(":").map(Number);
						let currentEndMinutes = startHour * 60 + startMin + 30; // Kết thúc của slot đầu tiên

						let slotsCount = 1;

						// Kiểm tra các slot tiếp theo có liền kề không
						while (i + slotsCount < courtSlots.length) {
							const nextSlot = courtSlots[i + slotsCount];
							const nextStartTime = nextSlot.timeSlotId.split("-")[0];
							const [nextHour, nextMin] = nextStartTime.split(":").map(Number);
							const nextStartMinutes = nextHour * 60 + nextMin;

							// Nếu slot tiếp theo bắt đầu đúng bằng thời gian kết thúc hiện tại → liền kề
							if (nextStartMinutes === currentEndMinutes) {
								currentEndMinutes += 30; // Cộng thêm 30 phút
								slotsCount++;
							} else {
								break; // Không liền kề nữa → dừng
							}
						}

						// Tính tổng thời gian thuê (giờ)
						const totalMinutes = slotsCount * 30;
						const rentalTimeHours = totalMinutes / 60; // 30→0.5, 60→1, 90→1.5, 120→2

						// Format: bỏ .0 nếu là số nguyên
						const rentalTimeStr = rentalTimeHours % 1 === 0
							? rentalTimeHours.toString()
							: rentalTimeHours.toFixed(1);

						details.push({
							startTime: startTime, // "07:00", "08:30"...
							rentalTime: rentalTimeStr, // "0.5", "1", "1.5", "2"
							badmintonCourtId: startSlot.courtId
						});

						i += slotsCount; // Nhảy qua các slot đã gộp
					}
				});

				if (details.length > 0) {
					weeklySchedule.push({
						dayOfWeek: dayMap[dayIndex],
						detail: details
					});
				}
			});

			// 7. Tạo payload
			const payload = {
				branchId: branchId,
				voucherId: selectedVoucher?.id || null,
				totalPrice: finalTotalPrice,
				deposit: 0,
				firstWeekDate: format(fixedBookingDate, "yyyy-MM-dd"),
				weeklySchedule: weeklySchedule
			};

			// console.log("✅ Fixed booking payload (FIXED):", JSON.stringify(payload, null, 2));

			// 8. Gọi API
			const response = await reservationService.createFixedBooking(payload);
			const reservationIds = Array.isArray(response)
				? response
				: response?.reservations || [];
			// console.log("✅ Reservation IDs nhận được:", reservationIds);
			await reservationService.scheduleCancellationListId(reservationIds);
			console.log(payload);

			// 9. Chuyển sang trang thanh toán
			if (selectedFixedPaymentMethod === "cod") {
				await reservationService.updateFixedBookingStatus(reservationIds, "waiting");
				navigate("/booking-successfully", {
					state: {
						branchDetail,
						reservationIds,
						isFixedBooking: true,
						totalPrice: finalTotalPrice,
					},
				});
			} else if (selectedFixedPaymentMethod === "bank") {
				const oneTimeSession = crypto.randomUUID();
				sessionStorage.setItem("checkoutSession", oneTimeSession);
				navigate(`/checkout-fixed?session=${oneTimeSession}`, {
					state: {
						branchDetail,
						reservationIds,
						totalPrice: finalTotalPrice,
						originalPrice: totalFor4Weeks,
						selectedVoucher,
						weeklySchedule,
						startDate: format(fixedBookingDate, "dd/MM/yyyy"),
					},
				});
			} else {
				navigate(`/demo-payment?resIds=${reservationIds.join(",")}&type=fixed`, {
					state: {
						branchDetail,
						amount: finalTotalPrice,
						title: "Thanh toán MoMo",
						description: "Quét mã QR bằng ví MoMo để thanh toán lịch đặt sân cố định.",
						paymentContent: `MOMO FIXED ${reservationIds[0]}`,
					},
				});
			}
			// const oneTimeSession = crypto.randomUUID();
			// sessionStorage.setItem("checkoutSession", oneTimeSession);

			// navigate(`/checkout-fixed?session=${oneTimeSession}`, {
			// 	state: {
			// 		branchDetail,
			// 		reservationIds,
			// 		totalPrice: finalTotalPrice,
			// 		originalPrice: totalFor4Weeks,
			// 		selectedVoucher,
			// 		weeklySchedule,
			// 		startDate: format(fixedBookingDate, "dd/MM/yyyy"),
			// 	},
			// });

			// Reset form
			setFixedSelectedSlots([]);
			setShowFixedBookingSummary(false);
			setSelectedFixedCourts([]);
			setSelectedVoucher(null);

		} catch (error) {
			console.error("Lỗi đặt sân cố định:", error);
			alert("Đặt sân thất bại: " + (error.response?.data?.message || error.message));
		}
	};

	// Render bảng đặt cố định
	const renderFixedBookingTable = () => {
		if (fixedTimeSlots.length === 0 || weekDaysOrder.length === 0) return null;

		return (
			<TableContainer
				component={Paper}
				sx={{
					maxHeight: "68vh",
					borderRadius: theme.shape.borderRadius,
					border: `1px solid ${theme.palette.divider}`,
					bgcolor: theme.palette.mode === "dark" ? "rgba(15, 23, 42, 0.95)" : "background.paper",
					"&::-webkit-scrollbar": { width: "10px" },
					"&::-webkit-scrollbar-track": { background: "transparent" },
					"&::-webkit-scrollbar-thumb": { bgcolor: theme.palette.mode === "dark" ? "#64748b" : "#94a3b8", borderRadius: 5 },
				}}
			>
				<Table stickyHeader>
					<TableHead>
						<TableRow>
							<TableCell sx={{ bgcolor: theme.palette.primary.main, color: "white", fontWeight: 800, position: "sticky", left: 0, zIndex: 10 }}>
								Thời gian
							</TableCell>
							{weekDaysOrder.map((day, index) => {
								const dateOfDay = addDays(startOfMonth(fixedBookingDate), index);
								return (
									<TableCell key={day.index} align="center" sx={{ bgcolor: theme.palette.primary.main, color: "white", fontWeight: 800 }}>
										<Box>
											<Typography variant="body2" fontWeight={800}>{day.shortName}</Typography>
											<Typography variant="caption">{format(dateOfDay, 'd/M')}</Typography>
										</Box>
									</TableCell>
								);
							})}
						</TableRow>
					</TableHead>
					<TableBody>
						{fixedTimeSlots.map((timeSlot) => (
							<TableRow key={timeSlot.id}>
								<TableCell sx={{
									position: "sticky",
									left: 0,
									bgcolor: theme.palette.mode === "dark" ? "rgba(30, 41, 59, 0.95)" : "background.paper",
									zIndex: 9,
									fontWeight: 600,
									borderRight: `1px solid ${theme.palette.divider}`,
								}}>
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<Clock size={16} color={theme.palette.primary.main} />
										{timeSlot.displayLabel}
									</Box>
								</TableCell>
								{weekDaysOrder.map((day) => {
									// Nếu chưa chọn sân → hiển thị ô trống, không cho click
									if (selectedFixedCourts.length === 0) {
										return (
											<TableCell
												key={`${day.index}-${timeSlot.id}`}
												align="center"
												sx={{
													cursor: "not-allowed",
													bgcolor: theme.palette.mode === "dark" ? "rgba(30, 41, 59, 0.7)" : "#f8fafc",
													color: "text.secondary",
													opacity: 0.5,
												}}
											>
												<Typography variant="body2" sx={{ opacity: 0.6 }}>
													-
												</Typography>
											</TableCell>
										);
									}

									// Đã chọn sân → logic cũ
									const anyBooked = selectedFixedCourts.some(courtId =>
										isFixedSlotBooked(courtId, timeSlot.id, day.index)
									);

									let displayAsSelected = false;
									if (applyToAllCourts) {
										displayAsSelected = selectedFixedCourts.every(courtId =>
											isFixedSlotSelected(courtId, timeSlot.id, day.index)
										);
									} else {
										displayAsSelected = selectedFixedCourts.some(courtId =>
											isFixedSlotSelected(courtId, timeSlot.id, day.index)
										);
									}

									return (
										<TableCell
											key={`${day.index}-${timeSlot.id}`}
											align="center"
											onClick={() => {
												if (anyBooked) return;
												handleFixedSlotClick(selectedFixedCourts[0], timeSlot.id, day.index);
											}}
											sx={{
												cursor: anyBooked ? "not-allowed" : "pointer",
												bgcolor: anyBooked
													? (theme.palette.mode === "dark" ? "#374151" : "#9ca3af")
													: displayAsSelected
														? theme.palette.primary.main
														: (theme.palette.mode === "dark" ? "rgba(30, 41, 59, 0.7)" : "#f8fafc"),
												color: displayAsSelected || anyBooked ? "white" : "text.secondary",
												"&:hover": !anyBooked && {
													bgcolor: displayAsSelected
														? theme.palette.primary.dark
														: (theme.palette.mode === "dark" ? "rgba(59, 130, 246, 0.3)" : "#dbeafe"),
												},
												transition: "all 0.2s",
											}}
										>
											{anyBooked ? (
												<XCircle size={24} />
											) : displayAsSelected ? (
												<CheckCircle size={24} />
											) : (
												<Typography variant="body2" sx={{ opacity: 0.6 }}>
													Trống
												</Typography>
											)}
										</TableCell>
									);
								})}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
		);
	};
	const renderBookingSummary = () => {
		if (!showBookingSummary) return null;

		const groupedSlots = selectedSlots.reduce((acc, slot) => {
			if (!acc[slot.courtId]) {
				acc[slot.courtId] = [];
			}
			acc[slot.courtId].push(slot.timeSlotId);
			return acc;
		}, {});

		const bookingInfo = Object.entries(groupedSlots).map(([courtId, slots]) => {
			const court = courts.find((c) => c.id === courtId);
			const slotDetails = slots.map((slotId) => {
				const timeSlot = timeSlots.find((slot) => slot.id === slotId);
				return {
					timeSlotId: slotId,
					displayLabel: timeSlot ? timeSlot.displayLabel : slotId,
				};
			});

			// SỬA CHỖ NÀY - Tính đúng giá mỗi 30 phút
			const totalPrice = slotDetails.reduce((total, slot) => {
				// Lấy giờ bắt đầu của slot (ví dụ: "06:00-06:30" → 6)
				const startHour = parseInt(slot.timeSlotId.split("-")[0].split(":")[0], 10);

				// Tìm giá giờ áp dụng (dựa vào casualPrices như hàm calculateTotalPrice đang làm)
				const isWeekend = isWeekendDay(selectedDate);
				const applicablePrices = priceTables.casualPrices.filter(p => {
					if (!p.dayOfWeek) return true;
					return isWeekend ? p.dayOfWeek === "1" : p.dayOfWeek === "0";
				});

				const finalPrices = applicablePrices.length > 0 ? applicablePrices : priceTables.casualPrices;

				const matchingPrice = finalPrices.find(p =>
					p.startTime <= startHour && p.endTime > startHour
				);

				// Quan trọng: mỗi slot 30 phút → chia đôi giá giờ
				const priceForThisSlot = matchingPrice
					? matchingPrice.pricePerHour / 2
					: 0;

				return total + priceForThisSlot;
			}, 0);

			return {
				courtId: courtId,
				courtName: court?.ordinalNumber,
				date: format(selectedDate, "dd/MM/yyyy"),
				slots: slotDetails,
				totalPrice: totalPrice, // giờ đã đúng 40k mỗi ô nếu giá giờ là 80k
			};
		});

		return (
			<Box
				sx={{
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					bgcolor: "rgba(0,0,0,0.5)",
					zIndex: 1000,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					p: 2,
					zIndex: 1101,
				}}
			>
				<Fade in={true} timeout={500} unmountOnExit>
					<Paper
						sx={{
							width: "100%",
							maxWidth: 600,
							maxHeight: "90vh",
							overflowY: "auto",
							p: 3,
							borderRadius: theme.shape.borderRadius,
							"&::-webkit-scrollbar": {
								width: "7px",
							},
							"&::-webkit-scrollbar-track": {
								background: "transparent",
								borderRadius: theme.shape.borderRadius,
							},
							"&::-webkit-scrollbar-thumb": {
								background: theme.palette.secondary.light,
								borderRadius: theme.shape.borderRadius,
							},
						}}
					>
						<Typography
							variant="h5"
							sx={{ mb: 2, color: "primary.main", fontWeight: "bold" }}
						>
							Xác nhận đặt sân
						</Typography>

						<Typography
							variant="body1"
							sx={{ mb: 2, display: "flex", alignItems: "center" }}
						>
							<Calendar size={18} style={{ marginRight: 8 }} />
							{format(selectedDate, "EEEE, dd/MM/yyyy", { locale: vi })}
						</Typography>

						<Divider sx={{ my: 2 }} />

						{bookingInfo.map((booking, index) => (
							<Card key={index} sx={{ mb: 2, bgcolor: "background.paper" }}>
								<CardContent>
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											mb: 1,
										}}
									>
										<Typography variant="h6">
											Sân số {booking.courtName}
										</Typography>
									</Box>

									<Box sx={{ mb: 2 }}>
										<Typography variant="subtitle2" sx={{ mb: 1 }}>
											Các khung giờ đã chọn:
										</Typography>
										<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
											{booking.slots.map((slot, idx) => (
												<Chip
													key={idx}
													label={slot.displayLabel}
													size="small"
													icon={<Clock size={14} />}
													sx={{ bgcolor: "background.default" }}
												/>
											))}
										</Box>
									</Box>

									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
										}}
									>
										<Typography variant="body2" color="text.secondary">
											{booking.slots.length} khung giờ đã chọn
										</Typography>
										<Typography variant="body1" fontWeight="bold">
											{branchDetail.prices.length
												? formatVND(booking.totalPrice)
												: "-"}
										</Typography>
									</Box>
								</CardContent>
							</Card>
						))}

						<Box
							sx={{
								bgcolor: "background.default",
								p: 2,
								borderRadius: 1,
								mb: 3,
							}}
						>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<Typography variant="body1" fontWeight="bold">
									Tổng tiền:
								</Typography>
								<Typography variant="h6" color="primary.main" fontWeight="bold">
									{branchDetail.prices.length
										? formatVND(calculateTotalPrice())
										: "-"}
								</Typography>
							</Box>
							<Box
								sx={{
									border: "1px solid",
									borderColor: "divider",
									borderRadius: theme.shape.borderRadius,
									p: 2,
									mt: 2,
									backgroundColor: "background.paper",
								}}
							>
								{selectedVoucher && (
									<>
										{/* Thông tin voucher */}
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												mb: 1,
											}}
										>
											<Typography variant="body2" color="text.secondary">
												<strong>Sự kiện: </strong> {selectedVoucher.event}
											</Typography>
											<Typography
												variant="body2"
												color="success.main"
												fontWeight="bold"
											>
												-
												{formatVND(
													(calculateTotalPrice() *
														selectedVoucher.discountRate) /
													100
												)}
											</Typography>
										</Box>

										<Divider sx={{ my: 1.5 }} />

										{/* Tổng tiền sau giảm */}
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "center",
												mb: 1.5,
											}}
										>
											<Typography variant="body1" fontWeight="medium">
												Tổng tiền sau khi giảm:
											</Typography>
											<Typography
												variant="h6"
												color="primary.main"
												fontWeight="bold"
											>
												{formatVND(calculateDiscountedPrice())}
											</Typography>
										</Box>
									</>
								)}
								{/* Tiền cọc */}
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										mb: 1,
									}}
								>
									<Typography variant="body1" fontWeight="medium">
										Cọc trước 50%:
									</Typography>
									<Typography
										variant="h6"
										color="primary.main"
										fontWeight="bold"
									>
										{formatVND(calculateDiscountedPrice() * 0.5)}
									</Typography>
								</Box>

								{/* Giải thích */}
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{ display: "block", mt: 1, fontStyle: "italic" }}
								>
									* Số tiền còn lại sẽ thanh toán khi hoàn thành dịch vụ
								</Typography>
							</Box>
						</Box>

						<Box sx={{ mb: 3 }}>
							<Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
								Chọn phương thức thanh toán
							</Typography>
							<Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
								{[
									{ id: "cod", label: "COD", desc: "Xác nhận nhanh tại sân" },
									{ id: "bank", label: "Ngân hàng", desc: "Chuyển khoản và quét QR" },
									{ id: "momo", label: "MoMo", desc: "Thanh toán bằng ví MoMo" },
								].map((method) => (
									<Paper
										key={method.id}
										onClick={() => setSelectedPaymentMethod(method.id)}
										variant="outlined"
										sx={{
											p: 2,
											cursor: "pointer",
											borderRadius: 2,
											borderColor: selectedPaymentMethod === method.id ? "primary.main" : "divider",
											bgcolor: selectedPaymentMethod === method.id ? "primary.main" + "10" : "background.paper",
										}}
									>
										<Typography fontWeight={800}>{method.label}</Typography>
										<Typography variant="body2" color="text.secondary">{method.desc}</Typography>
									</Paper>
								))}
							</Box>
						</Box>

						<Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
							<Button
								variant="outlined"
								onClick={() => setShowBookingSummary(false)}
								startIcon={<ArrowLeft size={16} />}
							>
								Quay lại
							</Button>
							<Button
								variant="contained"
								color="primary"
								onClick={confirmBooking}
								startIcon={<CreditCard size={16} />}
							>
								Xác nhận và thanh toán
							</Button>
						</Box>
					</Paper>
				</Fade>
			</Box>
		);
	};

	// Render summary cho đặt cố định
	const renderFixedBookingSummary = () => {
		if (!showFixedBookingSummary) return null;

		// Bước 1: Lấy danh sách tất cả sân đã chọn
		const selectedCourtIds = [...new Set(fixedSelectedSlots.map(s => s.courtId))];
		if (selectedCourtIds.length === 0) return null;

		// Bước 2: Nhóm theo SÂN trước → rồi đến THỨ → rồi đến KHUNG GIỜ
		const groupedByCourt = {};

		selectedCourtIds.forEach(courtId => {
			groupedByCourt[courtId] = {};

			fixedSelectedSlots
				.filter(slot => slot.courtId === courtId)
				.forEach(slot => {
					const dayIndex = slot.dayIndex;
					if (!groupedByCourt[courtId][dayIndex]) {
						groupedByCourt[courtId][dayIndex] = [];
					}
					groupedByCourt[courtId][dayIndex].push(slot.timeSlotId);
				});
		});

		// Bước 3: Tạo dữ liệu hiển thị theo đúng thứ tự: Sân → Thứ → Khung giờ
		const bookingInfo = [];

		selectedCourtIds.forEach(courtId => {
			const court = courts.find(c => c.id === courtId);
			if (!court) return;

			// Lấy tất cả các ngày có đặt của sân này
			Object.keys(groupedByCourt[courtId]).forEach(dayIndexStr => {
				const dayIndex = parseInt(dayIndexStr);
				const dayInfo = weekDaysOrder.find(d => d.index === dayIndex);
				if (!dayInfo) return;

				const slotIds = [...new Set(groupedByCourt[courtId][dayIndex])].sort();
				const slotDetails = slotIds.map(slotId => {
					const timeSlot = fixedTimeSlots.find(t => t.id === slotId);
					return timeSlot ? timeSlot.displayLabel : slotId;
				});

				// Tính đúng giá cho từng sân + ngày (gộp khung liền nhau)
				let weeklyPrice = 0;

				// Chuyển tất cả slot thành phút từ 0h
				const minutesList = slotIds.map(slotId => {
					const [hour, minute] = slotId.split("-")[0].split(":").map(Number);
					return hour * 60 + minute;
				}).sort((a, b) => a - b);

				// Gộp các slot liền nhau và tính giá
				let i = 0;
				while (i < minutesList.length) {
					let start = minutesList[i];
					let end = start + 30;
					let count = 1;

					// Kiểm tra slot tiếp theo có liền kề không (cách nhau đúng 30 phút)
					while (i + count < minutesList.length && minutesList[i + count] === end) {
						end += 30;
						count++;
					}

					// Tính giá cho đoạn liền nhau này
					const durationHours = (end - start) / 60; // 30p → 0.5h, 60p → 1h
					const startHour = Math.floor(start / 60);

					// Tìm bảng giá cố định phù hợp
					const priceItem = priceTables.fixedPrices.find(p =>
						p.startTime <= startHour && p.endTime > startHour
					);

					if (priceItem) {
						weeklyPrice += priceItem.pricePerHour * durationHours;
					}

					i += count;
				}

				bookingInfo.push({
					courtId,
					courtName: court.ordinalNumber,
					dayName: dayInfo.name,
					dayShort: dayInfo.shortName,
					dateExample: format(
						addDays(startOfMonth(fixedBookingDate), weekDaysOrder.findIndex(w => w.index === dayIndex)),
						'd/M'
					),
					slots: slotDetails,
					weeklyPrice, // Giá 1 tuần cho sân này ở ngày này
				});
			});
		});

		// Sắp xếp: trước theo sân, sau theo thứ trong tuần
		bookingInfo.sort((a, b) => {
			if (a.courtName !== b.courtName) return a.courtName - b.courtName;
			const dayOrderA = weekDaysOrder.findIndex(d => d.name === a.dayName);
			const dayOrderB = weekDaysOrder.findIndex(d => d.name === b.dayName);
			return dayOrderA - dayOrderB;
		});

		// Tính tổng
		const weeklyTotal = bookingInfo.reduce((sum, item) => sum + item.weeklyPrice, 0);
		const total4Weeks = weeklyTotal * 4;

		// Áp dụng voucher (nếu có)
		const finalPrice = selectedVoucher
			? Math.round(total4Weeks * (1 - selectedVoucher.discountRate / 100))
			: total4Weeks;

		return (
			<Box
				sx={{
					position: "fixed",
					inset: 0,
					bgcolor: "rgba(0,0,0,0.6)",
					zIndex: 1300,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					p: 2
				}}
			>
				<Fade in>
					<Paper
						sx={{
							maxWidth: 680,
							maxHeight: "90vh",
							overflowY: "auto",
							borderRadius: theme.shape.borderRadius,
							p: { xs: 3, md: 5 },
							bgcolor: "background.paper",
							"&::-webkit-scrollbar": {
								width: "8px",
							},
							"&::-webkit-scrollbar-track": {
								background: "transparent",
								borderRadius: theme.shape.borderRadius,
							},
							"&::-webkit-scrollbar-thumb": {
								background: theme.palette.secondary.light,
								borderRadius: theme.shape.borderRadius,
							},
						}}
					>
						{/* Header */}
						<Typography variant="h5" fontWeight={900} color="primary.main" gutterBottom>
							Xác nhận đặt sân cố định (4 tuần)
						</Typography>
						<Typography variant="body1" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
							<Calendar size={18} />
							Bắt đầu từ: <strong>{format(fixedBookingDate, "dd/MM/yyyy", { locale: vi })}</strong>
						</Typography>
						<Divider sx={{ my: 2 }} />

						{/* HIỂN THỊ THEO NHÓM SÂN */}
						{selectedCourtIds.map(courtId => {
							const court = courts.find(c => c.id === courtId);
							const courtBookings = bookingInfo.filter(b => b.courtId === courtId);

							return (
								<Card
									key={courtId}
									sx={{
										mb: 4,
										border: `2px solid ${theme.palette.primary.main}30`,
										borderRadius: theme.shape.borderRadius
									}}
								>
									<CardContent>
										<Typography variant="h6" fontWeight={900} color="primary.main" sx={{ mb: 2 }}>
											Sân số {court?.ordinalNumber}
										</Typography>

										{courtBookings.map((booking, idx) => (
											<Box
												key={idx}
												sx={{
													mb: 2,
													borderBottom: idx < courtBookings.length - 1 ? "1px dashed" : "none",
													borderColor: "divider"
												}}
											>
												<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
													<Box>
														<Typography variant="subtitle1" fontWeight={700}>
															{booking.dayName}
														</Typography>
														<Typography variant="caption" color="text.secondary">
															Hàng tuần
														</Typography>
													</Box>
													<Typography variant="h6" color="primary.main" fontWeight={800}>
														{formatVND(booking.weeklyPrice)} / tuần
													</Typography>
												</Box>

												<Box sx={{ mb: 2 }}>
													<Typography variant="subtitle2" gutterBottom>
														Khung giờ đã chọn:
													</Typography>
													<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
														{booking.slots.map((slot, i) => (
															<Chip
																key={i}
																label={slot}
																size="small"
																icon={<Clock size={14} />}
																sx={{ bgcolor: "background.default" }}
															/>
														))}
													</Box>
												</Box>

												<Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
													<span>{booking.slots.length} khung × 4 tuần</span>
													<span>{formatVND(booking.weeklyPrice * 4)}</span>
												</Box>
											</Box>
										))}

										{/* Tổng của sân này */}
										<Box sx={{ bgcolor: "primary.main" + "10", py: 1, borderRadius: theme.shape.borderRadius, mt: 1, fontSize: 17 }}>
											<Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
												<span>Tổng sân {court?.ordinalNumber} (4 tuần):</span>
												<Typography color="primary.main" fontWeight={800}>
													{formatVND(courtBookings.reduce((s, b) => s + b.weeklyPrice, 0) * 4)}
												</Typography>
											</Box>
										</Box>
									</CardContent>
								</Card>
							);
						})}

						{/* TỔNG CỘNG */}
						<Box sx={{ bgcolor: "background.default", p: 2.5, borderRadius: theme.shape.borderRadius, mt: 3 }}>
							<Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
								<Typography fontWeight={700}>Tổng 4 tuần:</Typography>
								<Typography fontWeight={800}>{formatVND(total4Weeks)}</Typography>
							</Box>

							{selectedVoucher && (
								<>
									<Box sx={{ display: "flex", justifyContent: "space-between", color: "success.main", fontWeight: 800, mb: 2 }}>
										<span>Giảm {selectedVoucher.discountRate}% ({selectedVoucher.event}):</span>
										<span>-{formatVND(total4Weeks * selectedVoucher.discountRate / 100)}</span>
									</Box>
									<Divider sx={{ my: 2 }} />
								</>
							)}

							{/* Tổng thanh toán 100% */}
							<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
								<Typography variant="h6" fontWeight={800}>Tổng thanh toán (100%):</Typography>
								<Typography variant="h5" color="primary.main" fontWeight={800}>
									{formatVND(finalPrice)}
								</Typography>
							</Box>
						</Box>

						{/* Alert thanh toán 100% */}
						<Alert severity="info" sx={{ mt: 3 }}>
							<Typography variant="body2" fontWeight={600}>
								💳 Đặt sân cố định thanh toán <strong>100%</strong> ngay - Không cần thanh toán thêm tại sân
							</Typography>
						</Alert>

						<Box sx={{ mt: 3 }}>
							<Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
								Ch?n ph??ng th?c thanh to?n
							</Typography>
							<Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
								{[
									{ id: "cod", label: "COD", desc: "X?c nh?n tr?c ti?p" },
									{ id: "bank", label: "Ng?n h?ng", desc: "Chuy?n kho?n v? qu?t QR" },
									{ id: "momo", label: "MoMo", desc: "Thanh to?n b?ng v? MoMo" },
								].map((method) => (
									<Paper
										key={method.id}
										onClick={() => setSelectedFixedPaymentMethod(method.id)}
										variant="outlined"
										sx={{
											p: 2,
											cursor: "pointer",
											borderRadius: 2,
											borderColor: selectedFixedPaymentMethod === method.id ? "primary.main" : "divider",
											bgcolor: selectedFixedPaymentMethod === method.id ? "primary.main" + "10" : "background.paper",
										}}
									>
										<Typography fontWeight={800}>{method.label}</Typography>
										<Typography variant="body2" color="text.secondary">{method.desc}</Typography>
									</Paper>
								))}
							</Box>
						</Box>

						{/* Actions */}
						<Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
							<Button
								variant="outlined"
								size="large"
								onClick={() => setShowFixedBookingSummary(false)}
								startIcon={<ArrowLeft size={16} />}
							>
								Quay lại
							</Button>
							<Button
								variant="contained"
								size="large"
								color="primary"
								onClick={confirmFixedBooking}
								startIcon={<CreditCard size={16} />}
							>
								Xác nhận & Thanh toán {formatVND(finalPrice)}
							</Button>
						</Box>
					</Paper>
				</Fade>
			</Box>
		);
	};
	const renderStatsCard = () => {
		if (selectedSlots.length === 0) return null;

		return (
			<Card
				sx={{
					position: "sticky",
					bottom: 16,
					left: 0,
					right: 0,
					zIndex: 10,
					boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
					borderRadius: theme.shape.borderRadius,
					mt: 3,
				}}
			>
				<CardContent
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Box>
						<Typography variant="body2" color="text.secondary">
							Đã chọn {selectedSlots.length} khung giờ
						</Typography>
						<Typography variant="h6" color="primary.main" fontWeight="bold">
							{branchDetail.prices.length
								? formatVND(calculateTotalPrice())
								: "-"}
						</Typography>
					</Box>
					<Box sx={{ display: "flex", gap: 1 }}>
						<Button
							variant="outlined"
							color="secondary"
							onClick={() => setSelectedSlots([])}
						>
							Hủy
						</Button>
						<Button
							variant="contained"
							color="primary"
							onClick={handleBookCourts}
							startIcon={<CheckCircle size={16} />}
						>
							Đặt sân
						</Button>
					</Box>
				</CardContent>
			</Card>
		);
	};

	// Stats card cho đặt cố định
	const renderFixedStatsCard = () => {
		if (fixedSelectedSlots.length === 0) return null;

		const weeklyTotal = calculateFixedTotalPrice();
		const totalFor4Weeks = weeklyTotal * 4;

		// Áp dụng voucher nếu có
		const finalPrice = selectedVoucher
			? totalFor4Weeks * (1 - selectedVoucher.discountRate / 100)
			: totalFor4Weeks;

		return (
			<Card
				sx={{
					position: "sticky",
					bottom: 16,
					left: 0,
					right: 0,
					zIndex: 10,
					boxShadow: "0 -4px 12px rgba(0,0,0,0.05)",
					borderRadius: theme.shape.borderRadius,
					mt: 3,
				}}
			>
				<CardContent
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Box>
						<Typography variant="body2" color="text.secondary">
							Đã chọn {fixedSelectedSlots.length} khung giờ cố định
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Thanh toán 100%: {formatVND(finalPrice)}
						</Typography>
						<Typography variant="caption" color="primary.main" fontWeight={600}>
							(4 tuần • Không cọc)
						</Typography>
					</Box>
					<Box sx={{ display: "flex", gap: 1 }}>
						<Button
							variant="outlined"
							color="secondary"
							onClick={() => setFixedSelectedSlots([])}
						>
							Hủy
						</Button>
						<Button
							variant="contained"
							color="primary"
							onClick={handleFixedBookCourts}
							startIcon={<CheckCircle size={16} />}
						>
							Đặt sân cố định
						</Button>
					</Box>
				</CardContent>
			</Card>
		);
	};



	return (
		<>
			<UserLayout>
				<Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
					<Box
						sx={{
							mb: { xs: 3, md: 5 },
							textAlign: "center",
							bgcolor: isDarkMode ? "rgba(30, 41, 59, 0.6)" : "background.paper",
							backdropFilter: "blur(12px)",
							p: { xs: 3, md: 5 },
							borderRadius: theme.shape.borderRadius,
							border: isDarkMode ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.08)",
							boxShadow: isDarkMode
								? "0 8px 32px rgba(0,0,0,0.4)"
								: "0 4px 20px rgba(0,0,0,0.08)",
						}}
					>
						<Typography
							variant={isMobile ? "h5" : "h4"}
							component="h1"
							sx={{
								fontWeight: 900,
								mb: 2,
								background: `linear-gradient(90deg, 
									${isDarkMode ? "#60a5fa" : theme.palette.primary.main} 0%, 
									${isDarkMode ? "#93c5fd" : theme.palette.primary.light} 100%)`,
								WebkitBackgroundClip: "text",
								WebkitTextFillColor: "transparent",
								letterSpacing: isDarkMode ? "0.5px" : "normal",
							}}
						>
							{branchDetail.branchName}
						</Typography>

						<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mb: 3, gap: 1 }}>
							<Rating
								value={branchDetail.reviews?.length > 0
									? +(branchDetail.reviews.reduce((s, r) => s + r.ratingLevel, 0) / branchDetail.reviews.length).toFixed(1)
									: 0}
								precision={0.1}
								readOnly
								sx={{
									color: isDarkMode ? "#60a5fa" : theme.palette.primary.main,
									"& .MuiRating-iconFilled": { color: isDarkMode ? "#60a5fa" : theme.palette.primary.main },
									"& .MuiRating-iconHover": { color: isDarkMode ? "#93c5fd" : theme.palette.primary.dark },
								}}
							/>
							<Typography
								variant="h6"
								sx={{
									fontWeight: 700,
									color: isDarkMode ? "#93c5fd" : theme.palette.primary.main,
									ml: 1,
								}}
							>
								{branchDetail.reviews?.length > 0
									? (branchDetail.reviews.reduce((s, r) => s + r.ratingLevel, 0) / branchDetail.reviews.length).toFixed(1)
									: "0.0"}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								({branchDetail.reviews?.length || 0} đánh giá)
							</Typography>
						</Box>

						<Grid container spacing={2} justifyContent="center">
							<Grid size={{ xs: 12, md: 4 }}>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										gap: 1.5,
										bgcolor: isDarkMode ? "rgba(15, 23, 42, 0.6)" : "background.default",
										p: 2.5,
										borderRadius: theme.shape.borderRadius,
										border: isDarkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
										transition: "all 0.3s",
										"&:hover": { bgcolor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "action.hover" },
									}}
								>
									<MapPin size={22} color={isDarkMode ? "#94a3b8" : theme.palette.primary.main} />
									<Typography
										variant="body1"
										sx={{
											color: isDarkMode ? "#e2e8f0" : "text.primary",
											fontWeight: 500,
											textAlign: "center",
										}}
									>
										{isMobile
											? branchDetail.address?.split(",").slice(0, 2).join(",")
											: branchDetail.address}
									</Typography>
								</Box>
							</Grid>

							<Grid size={{ xs: 12, sm: 6, md: 4 }}>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										gap: 1.5,
										bgcolor: isDarkMode ? "rgba(15, 23, 42, 0.6)" : "background.default",
										p: 2.5,
										borderRadius: theme.shape.borderRadius,
										border: isDarkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
										"&:hover": { bgcolor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "action.hover" },
									}}
								>
									<Phone size={22} color={isDarkMode ? "#94a3b8" : theme.palette.primary.main} />
									<Typography
										variant="body1"
										sx={{ color: isDarkMode ? "#e2e8f0" : "text.primary", fontWeight: 600 }}
									>
										{branchDetail.phoneNumber}
									</Typography>
								</Box>
							</Grid>

							<Grid size={{ xs: 12, sm: 6, md: 4 }}>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										gap: 1.5,
										bgcolor: isDarkMode ? "rgba(15, 23, 42, 0.6)" : "background.default",
										p: 2.5,
										borderRadius: theme.shape.borderRadius,
										border: isDarkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
										"&:hover": { bgcolor: isDarkMode ? "rgba(30, 41, 59, 0.8)" : "action.hover" },
									}}
								>
									<Mail size={22} color={isDarkMode ? "#94a3b8" : theme.palette.primary.main} />
									<Typography
										variant="body1"
										sx={{ color: isDarkMode ? "#e2e8f0" : "text.primary", fontWeight: 500 }}
									>
										{branchDetail.email}
									</Typography>
								</Box>
							</Grid>
						</Grid>
					</Box>

					<Paper
						sx={{
							mb: 4,
							borderRadius: theme.shape.borderRadius,
							boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
							overflowX: "auto",
						}}
					>
						<Tabs
							value={currentTab}
							onChange={handleTabChange}
							variant={isMobile ? "scrollable" : "fullWidth"}
							scrollButtons={isMobile ? true : false}
							allowScrollButtonsMobile
							sx={{
								minWidth: "fit-content",
								"& .MuiTab-root": {
									minWidth: "unset",
									px: { xs: 1, sm: 2 },
									textTransform: "none",
									fontWeight: 600,
									color: theme.palette.text.secondary,
									py: 2,
									"&.Mui-selected": {
										color: theme.palette.primary.main,
									},
								},
								"& .MuiTabs-indicator": {
									height: 3,
									backgroundColor: theme.palette.primary.main,
								},
							}}
						>
							<Tab
								label={isMobile ? "Tổng quan" : "Tổng quan"}
								icon={<Info size={18} />}
								iconPosition="start"
							/>
							<Tab
								label={isMobile ? "Bảng giá" : "Bảng giá"}
								icon={<Clock size={18} />}
								iconPosition="start"
							/>
							<Tab
								label={isMobile ? "Sân" : "Các sân"}
								icon={<CheckCircle size={18} />}
								iconPosition="start"
							/>
							<Tab
								label={isMobile ? "KM" : "Khuyến mãi"}
								icon={<Tag size={18} />}
								iconPosition="start"
							/>
							<Tab
								label={isMobile ? "Đánh giá" : "Đánh giá"}
								icon={<Star size={18} />}
								iconPosition="start"
							/>
							<Tab
								label={isMobile ? "Đặt" : "Chọn sân"}
								icon={<SquareMousePointer size={18} />}
								iconPosition="start"
							/>
						</Tabs>
					</Paper>

					<Fade in={true} timeout={500}>
						<Box>
							{currentTab === 0 && (
								<Box>
									<Card
										sx={{
											mb: 4,
											borderRadius: theme.shape.borderRadius,
											overflow: "hidden",
											boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
											border: `1px solid ${theme.palette.divider}`,
										}}
									>
										<Box sx={{ position: "relative" }}>
											<CardMedia
												component="img"
												height={isMobile ? 200 : isTablet ? 200 : 350}
												image={
													branchDetail.imagePath
														? `${import.meta.env.VITE_API_URL}/${branchDetail.imagePath
														}`
														: "/images/default/branch-default-image.jpg"
												}
												alt={`Hình ảnh của ${branchDetail.branchName}`}
												sx={{
													objectFit: "cover",
													transition: "opacity 0.3s ease-in-out",
													aspectRatio: "16/9",
												}}
											/>
										</Box>
									</Card>

									<Card
										sx={{
											mb: 4,
											borderRadius: theme.shape.borderRadius,
											overflow: "hidden",
											boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
											border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
											bgcolor: isDarkMode ? "rgba(15, 23, 42, 0.7)" : "background.paper",
											backdropFilter: "blur(10px)",
										}}
									>
										<CardContent sx={{ p: { xs: 3, md: 4 } }}>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													mb: 3,
													pb: 2,
													borderBottom: `2px solid ${theme.palette.primary.main}30`,
												}}
											>
												<Info size={24} color={theme.palette.primary.main} />
												<Typography
													variant="h6"
													sx={{
														ml: 2,
														fontWeight: 800,
														color: isDarkMode ? "#e0f2fe" : "text.primary",
													}}
												>
													Giới thiệu chi nhánh
												</Typography>
											</Box>

											{branchDetail.description ? (
												<Typography
													variant="body1"
													sx={{
														lineHeight: 2,
														color: isDarkMode ? "#e2e8f0" : "text.primary",
														fontSize: "1.02rem",
														whiteSpace: "pre-line",
														"& strong": {
															color: isDarkMode ? "#93c5fd" : theme.palette.primary.dark,
															fontWeight: 700
														},
														"& .green-check": { color: "#4ade80", fontWeight: "bold" },
														"& .red-heart": { color: "#f87171", fontWeight: "bold" },
													}}
													dangerouslySetInnerHTML={{
														__html: DOMPurify.sanitize(
															(branchDetail.description || "")
																.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
																.replace(/✔️|✅/g, '<span class="green-check">Check</span>')
																.replace(/❤️/g, '<span class="red-heart">Heart</span>')
																.replace(/^[-•*]\s+/gm, "• ")
														),
													}}
												/>
											) : (
												<Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic", textAlign: "center", py: 4 }}>
													Chưa có thông tin giới thiệu chi nhánh
												</Typography>
											)}
										</CardContent>
									</Card>

									<CardContent
										sx={{
											mb: 4,
											borderRadius: theme.shape.borderRadius,
											overflow: "hidden",
											boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
											border: `1px solid ${theme.palette.divider}`,
										}}
									>
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												mb: 3,
												pb: 1,
												borderBottom: `2px solid ${theme.palette.primary.light}`,
											}}
										>
											<Map size={20} color={theme.palette.primary.main} />
											<Typography
												variant="h6"
												sx={{ ml: 1, color: "text.primary" }}
											>
												Vị trí chi nhánh
											</Typography>
										</Box>

										<Box
											sx={{
												width: "100%",
												height: 400,
												borderRadius: theme.shape.borderRadius,
												overflow: "hidden",
												boxShadow: 3,
												mb: 3,
											}}
										>
											<iframe
												title="Google Map"
												src={getGoogleMapUrl(branchDetail.address)}
												width="100%"
												height="100%"
												style={{ border: 0 }}
												allowFullScreen=""
												loading="lazy"
												referrerPolicy="no-referrer-when-downgrade"
											></iframe>
										</Box>

										<Box sx={{ display: "flex", justifyContent: "center" }}>
											<Button
												variant="contained"
												color="primary"
												onClick={() =>
													window.open(
														getDestination(branchDetail.address),
														"_blank"
													)
												}
											>
												Chỉ đường đến chi nhánh
											</Button>
										</Box>
									</CardContent>
								</Box>
							)}

							{currentTab === 1 && (
								<Box>
									<Paper elevation={0} sx={{ borderRadius: theme.shape.borderRadius, overflow: "hidden", mb: 4 }}>
										<Tabs
											value={priceDayTab}
											onChange={(_, v) => setPriceDayTab(v)}
											centered
											variant={isMobile ? "fullWidth" : "standard"}
											sx={{
												bgcolor: "background.paper",
												"& .MuiTabs-indicator": {
													height: 4,
													borderRadius: theme.shape.borderRadius,
													backgroundColor: theme.palette.primary.main,
												},
											}}
										>
											<Tab
												label="Thứ 2 - Thứ 6"
												sx={{
													textTransform: "none",
													fontWeight: 700,
													fontSize: { xs: "0.95rem", md: "1rem" },
													py: 2.5,
												}}
											/>
											<Tab
												label="Thứ 7 - Chủ Nhật"
												sx={{
													textTransform: "none",
													fontWeight: 700,
													fontSize: { xs: "0.95rem", md: "1rem" },
													py: 2.5,
												}}
											/>
										</Tabs>
									</Paper>

									<Box sx={{ minHeight: 500 }}>
										{(() => {
											const isWeekend = priceDayTab === 1;

											const fixedPrices = (priceTables.fixedPrices || []).filter(p => {
												if (!p.dayOfWeek) return true;
												return isWeekend ? p.dayOfWeek === "1" : p.dayOfWeek === "0";
											});

											const casualPrices = (priceTables.casualPrices || []).filter(p => {
												if (!p.dayOfWeek) return true;
												return isWeekend ? p.dayOfWeek === "1" : p.dayOfWeek === "0";
											});

											const hasWeekendPrice =
												priceTables.fixedPrices?.some(p => p.dayOfWeek === "1") ||
												priceTables.casualPrices?.some(p => p.dayOfWeek === "1");

											const hasData = fixedPrices.length > 0 || casualPrices.length > 0;

											if (!hasData) {
												return (
													<Paper
														elevation={0}
														sx={{
															p: { xs: 6, md: 10 },
															textAlign: "center",
															borderRadius: theme.shape.borderRadius,
															bgcolor: "background.default",
															border: `1px dashed ${theme.palette.divider}`,
														}}
													>
														<Info size={64} color={theme.palette.primary.main} style={{ mb: 3, opacity: 0.7 }} />
														<Typography variant="h6" color="text.secondary" fontWeight={500}>
															Chưa có bảng giá cho chi nhánh này
														</Typography>
													</Paper>
												);
											}

											return (
												<>
													{fixedPrices.length > 0 && renderPriceTable(
														isWeekend && hasWeekendPrice ? "Giá cố định " : "Giá cố định",
														fixedPrices,
														<Clock size={28} />,
														{
															header: theme.palette.primary.main,
														},
														"Dành cho khách hàng thuê sân theo lịch cố định hàng tuần hoặc theo tháng."
													)}

													{casualPrices.length > 0 && renderPriceTable(
														isWeekend && hasWeekendPrice ? "Giá vãng lai" : "Giá vãng lai ",
														casualPrices,
														<Tag size={28} />,
														{
															header: "#FF9800",
														},
														"Dành cho khách thuê sân linh hoạt theo ngày, không cố định lịch."
													)}

													{isWeekend && !hasWeekendPrice && (
														<Alert
															severity="info"
															icon={<Info size={18} />}
															sx={{
																mt: 3,
																borderRadius: theme.shape.borderRadius,
																bgcolor: theme.palette.info.light + "15",
																border: `1px solid ${theme.palette.info.main}30`,
																"& .MuiAlert-message": { fontWeight: 500 },
															}}
														>
															Cuối tuần đang áp dụng <strong>bảng giá ngày thường</strong>
														</Alert>
													)}
												</>
											);
										})()}
									</Box>

									<Paper
										elevation={0}
										sx={{
											mt: 6,
											p: { xs: 3, md: 4 },
											bgcolor: theme.palette.primary.light + "15",
											borderRadius: theme.shape.borderRadius,
											borderLeft: `5px solid ${theme.palette.primary.main}`,
										}}
									>
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{
												fontWeight: 500,
												lineHeight: 1.7,
												"& strong": { color: theme.palette.primary.dark },
											}}
										>
											Lưu ý: Giá trên áp dụng cho <strong>1 giờ chơi</strong>. Giá có thể thay đổi vào dịp lễ, Tết hoặc các sự kiện đặc biệt.
										</Typography>
									</Paper>

									<Box sx={{ mt: 6, textAlign: "center" }}>
										<Button
											variant="contained"
											size="large"
											onClick={() => setCurrentTab(5)}
											startIcon={<Calendar size={22} />}
											sx={{
												px: { xs: 5, md: 7 },
												py: 2,
												borderRadius: theme.shape.borderRadius,
												fontWeight: 700,
												fontSize: "1.1rem",
												textTransform: "none",
												boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)",
												"&:hover": {
													boxShadow: "0 12px 30px rgba(59, 130, 246, 0.4)",
													transform: "translateY(-2px)",
												},
												transition: "all 0.3s ease",
											}}
										>
											Đặt sân ngay hôm nay
										</Button>
									</Box>
								</Box>
							)}

							{currentTab === 2 && (
								<Grid container spacing={3}>
									<Grid size={{ xs: 12, md: 4 }}>
										<Card
											sx={{
												borderRadius: theme.shape.borderRadius,
												boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
												border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
												bgcolor: isDarkMode ? "rgba(15, 23, 42, 0.8)" : "background.paper",
												height: "100%",
											}}
										>
											<CardContent sx={{ p: { xs: 3, md: 4 } }}>
												<Typography
													variant="h6"
													sx={{
														mb: 3,
														fontWeight: 800,
														color: isDarkMode ? "#93c5fd" : theme.palette.primary.main,
														display: "flex",
														alignItems: "center",
														gap: 1.5,
													}}
												>
													<CheckCircle size={26} />
													Danh sách sân
												</Typography>

												<List sx={{ p: 0 }}>
													{[...branchDetail.courts]
														.sort((a, b) => a.ordinalNumber - b.ordinalNumber)
														.map((court, sortedIndex) => {
															const originalIndex = branchDetail.courts.findIndex(c => c.id === court.id);
															return (
																<ListItem
																	key={court.id}
																	selected={selectedCourtIndex === originalIndex}
																	onClick={() => handleCourtSelection(originalIndex)}
																	sx={{
																		borderRadius: theme.shape.borderRadius,
																		mb: 1.5,
																		cursor: "pointer",
																		transition: "all 0.3s ease",
																		bgcolor: selectedCourtIndex === originalIndex
																			? `${theme.palette.primary.main}20`
																			: "transparent",
																		border: selectedCourtIndex === originalIndex
																			? `2px solid ${theme.palette.primary.main}`
																			: `1px solid ${isDarkMode ? "rgba(255,255,255,0.12)" : "divider"}`,
																		"&:hover": {
																			bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.15)" : "action.hover",
																			transform: "translateX(2px)",
																		},
																	}}
																>
																	<ListItemAvatar>
																		<Avatar
																			sx={{
																				bgcolor: court.available ? theme.palette.primary.main : theme.palette.error.main,
																				color: "white",
																				fontWeight: 800,
																				width: 48,
																				height: 48,
																				fontSize: "1.1rem",
																			}}
																		>
																			{court.ordinalNumber}
																		</Avatar>
																	</ListItemAvatar>

																	<ListItemText
																		primary={
																			<Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDarkMode ? "#f1f5f9" : "text.primary" }}>
																				Sân số {court.ordinalNumber}
																			</Typography>
																		}
																		secondary={
																			<Typography
																				variant="body2"
																				sx={{
																					color: court.available
																						? (isDarkMode ? "#86efac" : "success.main")
																						: (isDarkMode ? "#fca5a5" : "error.main"),
																					fontWeight: 600,
																				}}
																			>
																				{court.available ? "Có thể đặt" : "Không thể đặt"}
																			</Typography>
																		}
																	/>
																</ListItem>
															);
														})}
												</List>
											</CardContent>
										</Card>
									</Grid>

									<Grid size={{ xs: 12, md: 8 }}>
										{branchDetail.courts[selectedCourtIndex] && (
											<Card
												sx={{
													borderRadius: theme.shape.borderRadius,
													overflow: "hidden",
													boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
													border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)"}`,
													bgcolor: isDarkMode ? "rgba(15, 23, 42, 0.9)" : "background.paper",
													backdropFilter: "blur(12px)",
												}}
											>
												<CardContent sx={{ p: { xs: 3, md: 5 } }}>
													<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 2 }}>
														<Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
															<Typography
																variant={isMobile ? "h5" : "h4"}
																sx={{
																	fontWeight: 900,
																	background: `linear-gradient(90deg, ${isDarkMode ? "#60a5fa" : theme.palette.primary.main}, ${isDarkMode ? "#93c5fd" : theme.palette.primary.light})`,
																	WebkitBackgroundClip: "text",
																	WebkitTextFillColor: "transparent",
																}}
															>
																Sân số {branchDetail.courts[selectedCourtIndex].ordinalNumber}
															</Typography>

															<Chip
																label={branchDetail.courts[selectedCourtIndex].available ? "Có thể đặt" : "Không thể đặt"}
																color={branchDetail.courts[selectedCourtIndex].available ? "success" : "error"}
																size="medium"
																sx={{
																	fontWeight: 800,
																	fontSize: "1rem",
																	px: 2,
																	height: 40,
																	bgcolor: branchDetail.courts[selectedCourtIndex].available
																		? (isDarkMode ? "#166534" : "#dcfce7")
																		: (isDarkMode ? "#7f1d1d" : "#fee2e2"),
																	color: branchDetail.courts[selectedCourtIndex].available
																		? (isDarkMode ? "#86efac" : "#166534")
																		: (isDarkMode ? "#fca5a5" : "#7f1d1d"),
																}}
															/>
														</Box>
													</Box>

													<Box sx={{ position: "relative", borderRadius: theme.shape.borderRadius, overflow: "hidden", mb: 3 }}>
														{branchDetail.courts[selectedCourtIndex].images[
															courtImageIndices[branchDetail.courts[selectedCourtIndex].id] || 0
														]?.imagePath ? (
															<CardMedia
																component="img"
																height={isMobile ? 240 : isTablet ? 340 : 460}
																image={`${import.meta.env.VITE_API_URL}/${branchDetail.courts[selectedCourtIndex].images[
																	courtImageIndices[branchDetail.courts[selectedCourtIndex].id] || 0
																].imagePath
																	}`
																}
																alt={`Sân số ${branchDetail.courts[selectedCourtIndex].ordinalNumber}`}
																sx={{
																	objectFit: "cover",
																	transition: "transform 0.3s ease",
																	"&:hover": { transform: "scale(1.01)" },
																}}
															/>
														) : (
															<Box
																height={isMobile ? 240 : isTablet ? 340 : 460}
																display="flex"
																alignItems="center"
																justifyContent="center"
																sx={{
																	bgcolor: isDarkMode ? "#1e293b" : "#f8fafc",
																	border: "3px dashed",
																	borderColor: "divider",
																	borderRadius: theme.shape.borderRadius,
																}}
															>
																<HideImageIcon sx={{ fontSize: 80, color: "text.disabled" }} />
															</Box>
														)}

														{branchDetail.courts[selectedCourtIndex].images.length > 1 && (
															<>
																<IconButton
																	onClick={() => navigateCourtImage(branchDetail.courts[selectedCourtIndex].id, "prev")}
																	sx={{
																		position: "absolute",
																		left: 16,
																		top: "50%",
																		transform: "translateY(-50%)",
																		bgcolor: "rgba(0,0,0,0.6)",
																		color: "white",
																		"&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
																	}}
																>
																	<ChevronLeft size={28} />
																</IconButton>
																<IconButton
																	onClick={() => navigateCourtImage(branchDetail.courts[selectedCourtIndex].id, "next")}
																	sx={{
																		position: "absolute",
																		right: 16,
																		top: "50%",
																		transform: "translateY(-50%)",
																		bgcolor: "rgba(0,0,0,0.6)",
																		color: "white",
																		"&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
																	}}
																>
																	<ChevronRight size={28} />
																</IconButton>

																<Box
																	sx={{
																		position: "absolute",
																		bottom: 16,
																		left: "50%",
																		transform: "translateX(-50%)",
																		display: "flex",
																		gap: 1.5,
																	}}
																>
																	{branchDetail.courts[selectedCourtIndex].images.map((_, idx) => (
																		<Box
																			key={idx}
																			sx={{
																				width: idx === (courtImageIndices[branchDetail.courts[selectedCourtIndex].id] || 0) ? 28 : 10,
																				height: 10,
																				borderRadius: theme.shape.borderRadius,
																				bgcolor: idx === (courtImageIndices[branchDetail.courts[selectedCourtIndex].id] || 0)
																					? "#60a5fa"
																					: "rgba(255,255,255,0.5)",
																				transition: "all 0.3s ease",
																			}}
																		/>
																	))}
																</Box>
															</>
														)}
													</Box>

													{branchDetail.courts[selectedCourtIndex].images[
														courtImageIndices[branchDetail.courts[selectedCourtIndex].id] || 0
													]?.shortDescription && (
															<Typography
																variant="body1"
																color="text.secondary"
																sx={{
																	textAlign: "center",
																	fontStyle: "italic",
																	mt: 2,
																	color: isDarkMode ? "#94a3b8" : "text.secondary",
																	fontSize: "1.05rem",
																}}
															>
																{branchDetail.courts[selectedCourtIndex].images[
																	courtImageIndices[branchDetail.courts[selectedCourtIndex].id] || 0
																].shortDescription}
															</Typography>
														)}
												</CardContent>
											</Card>
										)}
									</Grid>
								</Grid>
							)}

							{currentTab === 3 && (
								<Box>
									<Typography
										variant="h6"
										sx={{
											display: "flex",
											alignItems: "center",
											mb: 3,
											color: "text.primary",
										}}
									>
										<Tag
											size={20}
											color={theme.palette.primary.main}
											style={{ marginRight: "8px" }}
										/>
										Khuyến mãi hiện có
									</Typography>
									<Grid container spacing={3}>
										{branchDetail.vouchers?.map(
											(voucher) =>
												voucher.available && (
													<Grid
														size={{ xs: 12, sm: 6, md: 3.5 }}
														key={voucher.id}
													>
														<Card
															sx={{
																borderRadius: theme.shape.borderRadius,
																boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
																bgcolor: "background.paper",
																position: "relative",
																overflow: "visible",
																"&::before": {
																	content: '""',
																	position: "absolute",
																	top: 20,
																	left: -10,
																	width: 20,
																	height: 20,
																	borderRadius: "50%",
																	bgcolor: "background.default",
																	zIndex: 1,
																},
																"&::after": {
																	content: '""',
																	position: "absolute",
																	top: 20,
																	right: -10,
																	width: 20,
																	height: 20,
																	borderRadius: "50%",
																	bgcolor: "background.default",
																	zIndex: 1,
																},
															}}
														>
															<CardContent sx={{ p: 3, textAlign: "center" }}>
																<Box
																	sx={{
																		bgcolor: "primary.main",
																		color: "white",
																		py: 2,
																		borderRadius: "7px 7px 0 0",
																		mx: -3,
																		mt: -3,
																		mb: 1,
																	}}
																>
																	<Typography
																		variant="h6"
																		sx={{ fontWeight: "bold" }}
																	>
																		{voucher.discountRate}% OFF
																	</Typography>
																</Box>
																<Box sx={{ px: 2, pb: 1 }}>
																	<Typography
																		variant="body1"
																		color="text.secondary"
																		sx={{
																			minHeight: "60px",
																			display: "flex",
																			alignItems: "center",
																			justifyContent: "center",
																		}}
																	>
																		{voucher.event}
																	</Typography>
																	<Button
																		variant="contained"
																		onClick={() => {
																			setSelectedVoucher(voucher);
																		}}
																		disabled={
																			selectedVoucher?.id === voucher.id
																		}
																		sx={{
																			borderRadius: theme.shape.borderRadius,
																			px: 4,
																			fontWeight: "bold",
																			textTransform: "none",
																			boxShadow: "none",
																			"&:hover": {
																				boxShadow:
																					"0 2px 8px rgba(25, 118, 210, 0.4)",
																			},
																		}}
																	>
																		{selectedVoucher?.id === voucher.id
																			? "Đã thêm"
																			: "Sử dụng ngay"}
																	</Button>
																</Box>
															</CardContent>
														</Card>
													</Grid>
												)
										)}
									</Grid>
								</Box>
							)}

							{currentTab === 4 && (
								<>
									<Box>
										<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
											<Star size={20} color={theme.palette.primary.main} />
											<Typography
												variant="h6"
												sx={{ ml: 1, color: "text.primary" }}
											>
												Đánh giá từ khách hàng
											</Typography>
										</Box>
										<Card
											sx={{
												borderRadius: theme.shape.borderRadius,
												boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
											}}
										>
											<CardContent sx={{ p: { xs: 2, md: 3 } }}>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														justifyContent: "space-between",
														mb: 3,
														flexDirection: { xs: "column", sm: "row" },
														gap: { xs: 2, sm: 0 },
													}}
												>
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 2,
														}}
													>
														<Typography
															variant="h4"
															sx={{ fontWeight: "bold", color: "primary.main" }}
														>
															{branchDetail.reviews?.length > 0
																? +(
																	branchDetail.reviews.reduce(
																		(sum, { ratingLevel }) =>
																			sum + ratingLevel,
																		0
																	) / branchDetail.reviews.length
																).toFixed(1)
																: 0}
														</Typography>
														<Box>
															<Rating
																value={
																	branchDetail.reviews?.length > 0
																		? +(
																			branchDetail.reviews.reduce(
																				(sum, { ratingLevel }) =>
																					sum + ratingLevel,
																				0
																			) / branchDetail.reviews.length
																		).toFixed(1)
																		: 0
																}
																precision={0.1}
																readOnly
																sx={{ color: "primary.main" }}
															/>
															<Typography
																variant="body2"
																color="text.secondary"
															>
																{branchDetail.reviews?.length} đánh giá
															</Typography>
														</Box>
													</Box>
													{reviewOfUser ? (
														<Button
															variant="contained"
															color="primary"
															onClick={() => {
																if (!user) {
																	setOpenLoginModal(true);
																	return;
																} else {
																	setOpenWriteReviewModal(true);
																}
															}}
															startIcon={<SquarePen size={15} />}
															sx={{ borderRadius: theme.shape.borderRadius }}
														>
															Xem đánh giá của bạn
														</Button>
													) : (
														<Button
															variant="contained"
															color="primary"
															onClick={() => {
																if (!user) {
																	setOpenLoginModal(true);
																	return;
																} else {
																	setOpenWriteReviewModal(true);
																}
															}}
															startIcon={<Star size={15} />}
															sx={{ borderRadius: theme.shape.borderRadius }}
														>
															Viết đánh giá
														</Button>
													)}
												</Box>
												<Divider sx={{ mb: 3 }} />
												{branchDetail.reviews.map((review) => (
													<Box
														key={review.id}
														sx={{
															mb: 3,
															pb: 3,
															borderBottom: 1,
															borderColor: "divider",
														}}
													>
														<Box
															sx={{
																display: "flex",
																justifyContent: "space-between",
																alignItems: "center",
																mb: 1,
																flexDirection: { xs: "column", sm: "row" },
																alignItems: { xs: "flex-start", sm: "center" },
																gap: { xs: 1, sm: 0 },
															}}
														>
															<Box
																sx={{
																	display: "flex",
																	alignItems: "center",
																	gap: 1,
																}}
															>
																<Avatar
																	sx={{
																		bgcolor: "primary.main",
																		width: 36,
																		height: 36,
																	}}
																>
																	{review.username.charAt(0)}
																</Avatar>
																<Typography
																	variant="subtitle1"
																	color="text.primary"
																>
																	{review.username}
																</Typography>
															</Box>
															<Typography
																variant="body2"
																color="text.secondary"
															>
																{formatTimeDate(review.createAt)}
															</Typography>
														</Box>
														<Rating
															value={review.ratingLevel}
															size="small"
															readOnly
															sx={{ mb: 1, color: "primary.main" }}
														/>
														<Typography
															variant="body1"
															color="text.primary"
															dangerouslySetInnerHTML={{
																__html: DOMPurify.sanitize(review.content),
															}}
														/>
													</Box>
												))}
											</CardContent>
										</Card>
									</Box>

									<ReviewModal
										open={openWriteReviewModal}
										onClose={() => setOpenWriteReviewModal(false)}
										theme={theme}
										branch={branchDetail}
										review={reviewOfUser}
										player={profileData}
										onReviewSubmitted={handleReviewSubmitted}
									/>
								</>
							)}

							{currentTab === 5 && (
								<Box>
									<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
										<Calendar size={20} color={theme.palette.primary.main} />
										<Typography variant="h6" sx={{ ml: 1, color: "text.primary" }}>
											Đặt sân cầu lông
										</Typography>
									</Box>

									<Box sx={{ mb: 4 }}>
										<Tabs
											value={bookingTab}
											onChange={(e, newValue) => setBookinTab(newValue)}
											variant="scrollable"
											scrollButtons="auto"
											sx={{
												mb: 3,
												'& .MuiTabs-indicator': { backgroundColor: theme.palette.primary.main },
											}}
										>
											{bookingType.map((type) => (
												<Tab
													key={type.id}
													value={type.id}
													label={type.label}
													sx={{
														textTransform: 'none',
														fontWeight: 600,
														fontSize: '0.95rem',
														minWidth: 80,
														'&.Mui-selected': { color: theme.palette.primary.main },
													}}
												/>
											))}
										</Tabs>
									</Box>

									{bookingTab === '1' ? (
										<>
											<Box sx={{
												display: "flex",
												flexDirection: { xs: "column", md: "row" },
												justifyContent: "space-between",
												alignItems: { xs: "start", md: "center" },
												gap: 2,
												mb: 3,
												p: 2,
												bgcolor: "background.paper",
												borderRadius: theme.shape.borderRadius,
												boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
											}}>
												<Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
													<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
														<DatePicker
															label="Chọn ngày"
															value={selectedDate}
															onChange={(newDate) => {
																if (isDateValid(newDate)) {
																	setSelectedDate(newDate);
																	setSelectedSlots([]);
																}
															}}
															minDate={minDate}
															maxDate={addDays(new Date(), 13)}
															disablePast
															sx={{ width: { xs: "100%", sm: 220 } }}
														/>
													</LocalizationProvider>
													<Chip
														icon={<Info size={16} />}
														label={formatDisplayDate(selectedDate)}
														variant="outlined"
														color="primary"
														sx={{ height: 38, borderRadius: theme.shape.borderRadius, fontWeight: 500 }}
													/>
												</Box>
											</Box>

											{error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

											{loading ? (
												<Box sx={{ display: "flex", justifyContent: "center", my: 8 }}>
													<CircularProgress />
												</Box>
											) : (
												<>
													<Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: theme.shape.borderRadius, border: "1px solid", borderColor: "divider" }}>
														<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
															<Info size={16} color={colorPalette.textSecondary} />
															<Typography variant="body2">Chọn khung giờ mong muốn từ lịch bên dưới</Typography>
														</Box>
														<Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
															<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
																<Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: theme.palette.mode === "dark" ? "#1e293b" : colorPalette.available }} />
																<Typography variant="caption">Còn trống</Typography>
															</Box>
															<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
																<Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: theme.palette.primary.main }} />
																<Typography variant="caption">Đã chọn</Typography>
															</Box>
															<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
																<Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: theme.palette.mode === "dark" ? "#991b1b" : "#fee2e2" }} />
																<Typography variant="caption">Đã đặt</Typography>
															</Box>
														</Box>
													</Paper>

													<TableContainer
														component={Paper}
														sx={{
															maxHeight: "68vh",
															borderRadius: theme.shape.borderRadius,
															border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.2)" : "divider"}`,
															bgcolor: theme.palette.mode === "dark" ? "rgba(15, 23, 42, 0.9)" : "background.paper",
															backdropFilter: "blur(10px)",
															"&::-webkit-scrollbar": {
																width: "10px",
															},
															"&::-webkit-scrollbar-track": {
																background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "#f1f1f1",
																borderRadius: "10px",
															},
															"&::-webkit-scrollbar-thumb": {
																background: theme.palette.mode === "dark" ? "#64748b" : "#94a3b8",
																borderRadius: "10px",
																border: "2px solid transparent",
																backgroundClip: "content-box",
															},
															"&::-webkit-scrollbar-thumb:hover": {
																background: theme.palette.mode === "dark" ? "#94a3b8" : "#64748b",
																backgroundClip: "content-box",
															},
															overflowY: "auto",
															overflowX: "auto",
														}}
													>
														<Table stickyHeader sx={{ tableLayout: "fixed" }}>
															<TableHead>
																<TableRow>
																	<TableCell
																		sx={{
																			width: 250,
																			minWidth: 100,
																			maxWidth: 300,
																			bgcolor: theme.palette.primary.main,
																			color: "white",
																			fontWeight: 800,
																			position: "sticky",
																			left: 0,
																			zIndex: 10,
																			whiteSpace: "nowrap",
																		}}
																	>
																		Thời gian
																	</TableCell>

																	{[...courts]
																		.filter(court => court.available)
																		.sort((a, b) => a.ordinalNumber - b.ordinalNumber)
																		.map((court) => (
																			<TableCell key={court.id} align="center" sx={{
																				bgcolor: theme.palette.primary.main,
																				color: "white",
																				fontWeight: 800,
																			}}>
																				Sân {court.ordinalNumber}
																			</TableCell>
																		))}
																</TableRow>
															</TableHead>
															<TableBody>
																{timeSlots.map((timeSlot) => (
																	<TableRow key={timeSlot.id} hover>
																		<TableCell
																			sx={{
																				width: 250,
																				minWidth: 100,
																				maxWidth: 300,
																				position: "sticky",
																				left: 0,
																				bgcolor: theme.palette.mode === "dark"
																					? "rgba(30, 41, 59, 0.95)"
																					: "background.paper",
																				zIndex: 9,
																				fontWeight: 600,
																				whiteSpace: "nowrap",
																				overflow: "hidden",
																				textOverflow: "ellipsis",
																				borderRight: `1px solid ${theme.palette.mode === "dark"
																					? "rgba(255,255,255,0.12)"
																					: "divider"
																					}`,
																			}}
																		>

																			<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
																				<Clock size={16} color={theme.palette.primary.main} />
																				{timeSlot.displayLabel}
																			</Box>
																		</TableCell>

																		{[...courts]
																			.filter(court => court.available)
																			.sort((a, b) => a.ordinalNumber - b.ordinalNumber)
																			.map((court) => {
																				const isBooked = isSlotBooked(court.id, timeSlot.id);
																				const isSelected = isSlotSelected(court.id, timeSlot.id);

																				return (
																					<TableCell
																						key={`${court.id}-${timeSlot.id}`}
																						onClick={() => handleSlotClick(court.id, timeSlot.id)}
																						sx={{
																							cursor: isBooked ? "not-allowed" : "pointer",
																							bgcolor: isBooked
																								? (theme.palette.mode === "dark" ? "#991b1b" : "#fee2e2")
																								: isSelected
																									? theme.palette.primary.main
																									: (theme.palette.mode === "dark" ? "rgba(30, 41, 59, 0.7)" : "#f8fafc"),
																							color: isSelected || isBooked
																								? "white"
																								: (theme.palette.mode === "dark" ? "#94a3b8" : "text.secondary"),
																							"&:hover": !isBooked && !isSelected && {
																								bgcolor: theme.palette.mode === "dark"
																									? "rgba(59, 130, 246, 0.3)"
																									: "#eff6ff",
																							},
																							transition: "all 0.2s",

																							/* 👇 QUAN TRỌNG */
																							padding: 0,
																						}}
																					>
																						<Box
																							sx={{
																								width: "100%",
																								height: "100%",
																								minHeight: 48, // đảm bảo chiều cao ô
																								display: "flex",
																								alignItems: "center",
																								justifyContent: "center",
																							}}
																						>
																							{isBooked ? (
																								<XCircle size={22} />
																							) : isSelected ? (
																								<CheckCircle size={22} />
																							) : (
																								<Typography variant="body2" sx={{ opacity: 0.7 }}>
																									Trống
																								</Typography>
																							)}
																						</Box>
																					</TableCell>

																				);
																			})}
																	</TableRow>
																))}
															</TableBody>
														</Table>
													</TableContainer>

													{renderStatsCard()}
													{renderBookingSummary()}
												</>
											)}
										</>
									) : (
										<>
											{/* ==================== ĐẶT SÂN CỐ ĐỊNH ==================== */}
											<Box sx={{
												display: "flex",
												flexDirection: { xs: "column", md: "row" },
												justifyContent: "space-between",
												alignItems: { xs: "start", md: "center" },
												gap: 2,
												mb: 4,
												p: 3,
												bgcolor: "background.paper",
												borderRadius: theme.shape.borderRadius,
												boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
												border: `1px solid ${theme.palette.divider}`,
											}}>
												<Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
													<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
														<DatePicker
															label="Chọn tháng bắt đầu"
															value={fixedBookingDate}
															onChange={(newDate) => {
																if (newDate) {
																	setFixedBookingDate(newDate);
																	setFixedSelectedSlots([]);
																	setSelectedFixedCourts([]);
																	generateFixedTimeSlots();
																}
															}}
															minDate={(() => {
																const today = new Date();
																return new Date(today.getFullYear(), today.getMonth() + 1, 1);
															})()}
															views={['year', 'month']}
															openTo="month"
															sx={{ width: { xs: "100%", sm: 240 } }}
														/>
													</LocalizationProvider>
													{fixedBookingDate && (
														<Chip
															icon={<Calendar size={16} />}
															label={`Tháng ${format(fixedBookingDate, 'MM/yyyy')} (4 tuần)`}
															color="primary"
															variant="outlined"
															sx={{ height: 40, fontWeight: 600 }}
														/>
													)}
												</Box>
											</Box>

											{fixedBookingDate ? (
												<>
													{/* PHẦN CHỌN SÂN + SWITCH SIÊU HAY */}
													<Box sx={{
														mb: 4,
														p: 4,
														bgcolor: theme.palette.mode === "dark" ? "rgba(30, 41, 59, 0.8)" : "background.paper",
														borderRadius: theme.shape.borderRadius,
														border: `2px dashed ${theme.palette.primary.main}`,
														boxShadow: "0 8px 25px rgba(59, 130, 246, 0.15)",
													}}>
														<Typography variant="h6" fontWeight={800} sx={{ mb: 3, color: "primary.main" }}>
															Chọn sân đặt cố định (có thể chọn nhiều)
														</Typography>

														<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
															{courts
																.filter(court => court.available)
																.sort((a, b) => a.ordinalNumber - b.ordinalNumber)
																.map((court) => (
																	<Chip
																		key={court.id}
																		label={`Sân ${court.ordinalNumber}`}
																		avatar={<Avatar sx={{ bgcolor: theme.palette.primary.main }}>{court.ordinalNumber}</Avatar>}
																		onClick={() => handleBookingCourtSelection(court.id)}
																		color={selectedFixedCourts.includes(court.id) ? "primary" : "default"}
																		variant={selectedFixedCourts.includes(court.id) ? "filled" : "outlined"}
																		sx={{
																			fontWeight: 600,
																			fontSize: '1.05rem',
																			height: 40,
																			borderRadius: theme.shape.borderRadius,
																			transition: 'all 0.25s',
																			'&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
																		}}
																	/>
																))}
														</Box>

														{/* SWITCH ÁP DỤNG CHO TẤT CẢ */}
														<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
															<Checkbox
																checked={applyToAllCourts}
																onChange={(e) => setApplyToAllCourts(e.target.checked)}
																color="primary"
																size="large"
															/>
															<Box>
																<Typography variant="body1" fontWeight={700}>
																	Áp dụng khung giờ cho <strong style={{ color: theme.palette.primary.main }}>tất cả sân đã chọn</strong>
																</Typography>
																<Typography variant="caption" color="text.secondary">
																	Khi bật: Click 1 ô → tự động chọn cùng khung giờ ở tất cả sân bạn đã tick
																</Typography>
															</Box>
														</Box>

														{selectedFixedCourts.length === 0 && (
															<Alert severity="warning" sx={{ mt: 3, borderRadius: theme.shape.borderRadius }}>
																Vui lòng chọn ít nhất 1 sân để tiếp tục
															</Alert>
														)}
													</Box>

													{/* BẢNG ĐẶT CỐ ĐỊNH */}
													{fixedLoading ? (
														<Box sx={{ display: "flex", justifyContent: "center", my: 10 }}>
															<CircularProgress size={60} />
														</Box>
													) : (
														renderFixedBookingTable()
													)}

													{renderFixedStatsCard()}
													{renderFixedBookingSummary()}
												</>
											) : (
												<Alert severity="info" sx={{ borderRadius: theme.shape.borderRadius, fontSize: '1.1rem' }}>
													Vui lòng chọn tháng bắt đầu để xem lịch đặt sân cố định
												</Alert>
											)}
										</>
									)}
								</Box>
							)}
						</Box>
					</Fade>
				</Container>
			</UserLayout>

			{openLoginModal && (
				<LoginModal
					open={openLoginModal}
					isModal={true}
					onClose={() => setOpenLoginModal(false)}
					authService={authService}
					onLoginSuccess={handleLoginSuccess}
					onRegisterSuccess={handleRegisterSuccess}
					defaultTab="login"
					showTabs={true}
				/>
			)}

		</>
	);
};

export default BranchDetail;
