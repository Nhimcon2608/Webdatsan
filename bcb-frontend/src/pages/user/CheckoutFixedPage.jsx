import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from "@mui/material";
import {
	Box,
	Typography,
	Card,
	CardContent,
	Divider,
	Button,
	Chip,
	Stack,
	CircularProgress,
	Alert,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogContentText,
	DialogActions,
	Paper,
	LinearProgress,
	IconButton,
	Tooltip
} from '@mui/material';
import { formatVND } from "../../utils/format";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import LabelIcon from '@mui/icons-material/Label';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import UserLayout from "../../layouts/user/UserLayout";
import reservationService from "../../services/reservationService";
import { useSnackbar } from "../../../context/SnackbarContext";

const CheckoutFixedPage = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const location = useLocation();
	const { showSnackbar } = useSnackbar();
	const { search } = location;

	const [timeLeft, setTimeLeft] = useState(600); // 10 phút
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [openCancelDialog, setOpenCancelDialog] = useState(false);
	const [paymentContent, setPaymentContent] = useState('');
	const [isProcessing, setIsProcessing] = useState(false); // ← THÊM state xử lý

	// Copy states
	const [copiedNumber, setCopiedNumber] = useState(false);
	const [copiedContent, setCopiedContent] = useState(false);

	const queryParams = useMemo(() => new URLSearchParams(search), [search]);
	const session = queryParams.get('session');

	// Lấy dữ liệu từ navigation state
	const branchDetail = location.state?.branchDetail;
	const reservationIds = location.state?.reservationIds || [];
	const totalPrice = location.state?.totalPrice || 0;
	const originalPrice = location.state?.originalPrice || totalPrice; // ← Thêm giá gốc
	const selectedVoucher = location.state?.selectedVoucher;
	const weeklySchedule = location.state?.weeklySchedule || [];
	const startDate = location.state?.startDate;

	// Lấy thông tin ngân hàng
	const bankInfo = useMemo(() => ({
		bankName: branchDetail?.bankName || 'Chưa cập nhật ngân hàng',
		bankNumber: branchDetail?.bankNumber || '',
		bankId: branchDetail?.bankId || '970422',
	}), [branchDetail]);

	// Copy to clipboard
	const copyToClipboard = (text, type) => {
		navigator.clipboard.writeText(text);
		if (type === 'number') {
			setCopiedNumber(true);
			setTimeout(() => setCopiedNumber(false), 2000);
		} else if (type === 'content') {
			setCopiedContent(true);
			setTimeout(() => setCopiedContent(false), 2000);
		}
	};

	useEffect(() => {
		const validateSession = () => {
			try {
				const storedSession = sessionStorage.getItem('checkoutSession');
				if (!session || session !== storedSession || !branchDetail || reservationIds.length === 0) {
					throw new Error('Phiên thanh toán không hợp lệ hoặc đã hết hạn');
				}

				// Tạo nội dung chuyển khoản
				const content = `DatCoDinh ${reservationIds[0]}`;
				setPaymentContent(content);

				setIsLoading(false);
			} catch (err) {
				setError(err.message);
				setIsLoading(false);
				setTimeout(() => navigate('/badminton-branchs'), 3000);
			}
		};

		validateSession();
	}, [session, branchDetail, reservationIds, navigate]);

	// Timer
	useEffect(() => {
		if (!session || isLoading) return;

		const timer = setInterval(() => {
			setTimeLeft(prev => {
				if (prev <= 1) {
					clearInterval(timer);
					sessionStorage.removeItem('checkoutSession');
					navigate('/badminton-branchs', { state: { sessionExpired: true } });
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [session, isLoading, navigate]);

	const formatTimeLeft = (seconds) => {
		const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
		const secs = (seconds % 60).toString().padStart(2, '0');
		return `${mins}:${secs}`;
	};

	const handleCancelPayment = () => setOpenCancelDialog(true);
	const handleCloseCancelDialog = () => setOpenCancelDialog(false);

	// ===== XÁC NHẬN ĐÃ CHUYỂN KHOẢN (HÀNG LOẠT) =====
	const handleConfirmPayment = async () => {
		if (isProcessing) return; // tránh double-click

		try {
			setIsProcessing(true);
			// ⚙️ Gọi API duy nhất để cập nhật trạng thái của cả 4 reservation cùng lúc
			await reservationService.updateFixedBookingStatus(reservationIds, "waiting");

			// ✅ Xoá session cũ để tránh reload lại
			sessionStorage.removeItem('checkoutSession');

			// ✅ Điều hướng sang trang thành công
			navigate('/booking-successfully', {
				state: {
					branchDetail,
					reservationIds,
					isFixedBooking: true,
					totalPrice,
				}
			});
		} catch (err) {
			console.error("❌ Lỗi xác nhận thanh toán:", err);
			showSnackbar("Có lỗi xảy ra khi xác nhận thanh toán: " + err.message, "error");
			setIsProcessing(false);
		}
	};

	// ===== HỦY ĐẶT SÂN CỐ ĐỊNH (HÀNG LOẠT) =====
	const confirmCancelPayment = async () => {
		if (isProcessing) return;

		try {
			setIsProcessing(true);

			// Gọi API hủy HÀNG LOẠT
			await reservationService.updateFixedBookingStatus(reservationIds, "cancel");

			sessionStorage.removeItem('checkoutSession');
			navigate('/badminton-branchs');
		} catch (err) {
			console.error("❌ Lỗi hủy đặt cố định:", err);
			showSnackbar("Có lỗi xảy ra khi hủy: " + err.message, "error");
			setIsProcessing(false);
		}
	};

	const getTimerColor = () => {
		if (timeLeft > 300) return 'success.main';
		if (timeLeft > 120) return 'warning.main';
		return 'error.main';
	};

	if (isLoading) {
		return (
			<UserLayout>
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
					<CircularProgress size={60} />
					<Typography variant="h6" sx={{ mt: 3 }}>Đang tải...</Typography>
				</Box>
			</UserLayout>
		);
	}

	if (error) {
		return (
			<UserLayout>
				<Box sx={{ p: 4, textAlign: 'center' }}>
					<Alert severity="error" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>{error}</Alert>
					<CircularProgress />
				</Box>
			</UserLayout>
		);
	}

	return (
		<UserLayout>
			<Box sx={{ p: { xs: 2, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
				{/* Header */}
				<Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
						<IconButton onClick={() => navigate(-1)} disabled={isProcessing}>
							<ArrowBackIcon />
						</IconButton>
						<Typography variant="h5" fontWeight={700} ml={1}>
							Thanh toán đặt sân cố định (4 tuần)
						</Typography>
					</Box>
					<LinearProgress
						variant="determinate"
						value={(timeLeft / 600) * 100}
						sx={{
							height: 10,
							borderRadius: 5,
							mb: 2,
							'& .MuiLinearProgress-bar': { bgcolor: getTimerColor() }
						}}
					/>
					<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<Typography variant="body2">Vui lòng chuyển khoản trong thời gian còn lại</Typography>
						<Typography variant="h6" color={getTimerColor()} fontWeight={600}>
							<AccessTimeIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} /> {formatTimeLeft(timeLeft)}
						</Typography>
					</Box>
				</Paper>

				<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: 4 }}>
					{/* Left: Payment Info */}
					<Box>
						<Card sx={{ height: '100%', borderRadius: 3, overflow: 'hidden' }}>
							<Box sx={{ p: 2.5, bgcolor: 'primary.main', color: 'white' }}>
								<Typography variant="h6" fontWeight={600}>Thông Tin Chuyển Khoản</Typography>
							</Box>
							<CardContent sx={{ p: 3 }}>
								<Stack spacing={3} alignItems="center">
									{/* Bank Info */}
									<Paper elevation={2} sx={{ p: 3, width: '100%', borderRadius: 3, bgcolor: 'background.paper' }}>
										<Stack spacing={2.5}>
											<Box textAlign="center">
												<AccountBalanceIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
												<Typography variant="subtitle1" fontWeight={600} color="primary">
													{bankInfo.bankName}
												</Typography>
											</Box>

											<Divider />

											<Box>
												<Typography variant="body2" color="text.secondary">Số tài khoản</Typography>
												<Box display="flex" alignItems="center" justifyContent="space-between" mt={0.5}>
													<Typography variant="h6" fontWeight={700}>{bankInfo.bankNumber || 'Chưa có'}</Typography>
													{bankInfo.bankNumber && (
														<Tooltip title={copiedNumber ? "Đã copy!" : "Copy"}>
															<IconButton size="small" onClick={() => copyToClipboard(bankInfo.bankNumber, 'number')}>
																{copiedNumber ? <CheckCircleIcon color="success" /> : <ContentCopyIcon fontSize="small" />}
															</IconButton>
														</Tooltip>
													)}
												</Box>
											</Box>

											<Box>
												<Typography variant="body2" color="text.secondary">Nội dung chuyển khoản</Typography>
												<Paper variant="outlined" sx={{ p: 1.5, mt: 1, bgcolor: 'action.selected' }}>
													<Box display="flex" alignItems="center" justifyContent="space-between">
														<Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>
															{paymentContent}
														</Typography>
														<Tooltip title={copiedContent ? "Đã copy!" : "Copy"}>
															<IconButton size="small" onClick={() => copyToClipboard(paymentContent, 'content')}>
																{copiedContent ? <CheckCircleIcon color="success" /> : <ContentCopyIcon fontSize="small" />}
															</IconButton>
														</Tooltip>
													</Box>
												</Paper>
											</Box>
										</Stack>
									</Paper>

									{/* QR Code */}
									{bankInfo.bankNumber && (
										<Box textAlign="center">
											<Typography variant="subtitle2" fontWeight={600} mb={2}>Quét mã QR để thanh toán nhanh</Typography>
											<Paper elevation={3} sx={{ p: 3, display: 'inline-block', borderRadius: 3 }}>
												<img
													src={`https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.bankNumber}-qr_only.png?amount=${totalPrice}&addInfo=${paymentContent}`}
													alt="QR Thanh toán"
													style={{ width: '100%', maxWidth: '220px' }}
												/>
											</Paper>
										</Box>
									)}

									{/* Amount - 100% */}
									<Paper sx={{ p: 3, width: '100%', bgcolor: 'primary.main', color: 'white', borderRadius: 3, textAlign: 'center' }}>
										<CurrencyExchangeIcon sx={{ fontSize: 32, mb: 1 }} />
										<Typography variant="h6">Tổng thanh toán (100%):</Typography>
										<Typography variant="h5" fontWeight={700}>
											{formatVND(totalPrice)}
										</Typography>
									</Paper>
								</Stack>
							</CardContent>
						</Card>
					</Box>

					{/* Right: Booking Details */}
					<Box>
						<Card sx={{ height: '100%', borderRadius: 3 }}>
							<Box sx={{ p: 2.5, bgcolor: 'primary.main', color: 'white' }}>
								<Typography variant="h6" fontWeight={600}>Chi Tiết Đặt Sân Cố Định</Typography>
							</Box>
							<CardContent sx={{ p: 3 }}>
								{/* Thông tin tổng quan */}
								<Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: 'info.light' + '20' }}>
									<Box display="flex" alignItems="center" mb={2}>
										<CalendarMonthIcon color="primary" sx={{ mr: 1 }} />
										<Typography variant="subtitle1" fontWeight={600}>Thông tin đặt sân</Typography>
									</Box>
									<Stack spacing={1.5}>
										<Box display="flex" justifyContent="space-between">
											<Typography>Bắt đầu từ:</Typography>
											<Typography fontWeight={600}>{startDate}</Typography>
										</Box>
										<Box display="flex" justifyContent="space-between">
											<Typography>Thời gian:</Typography>
											<Typography fontWeight={600}>4 tuần (28 ngày)</Typography>
										</Box>
										<Box display="flex" justifyContent="space-between">
											<Typography>Số đơn đặt:</Typography>
											<Typography fontWeight={600}>{reservationIds.length} đơn</Typography>
										</Box>
									</Stack>
								</Paper>

								{/* Price Summary */}
								<Paper elevation={2} sx={{ p: 3, mt: 3, borderRadius: 3 }}>
									<Typography variant="h6" fontWeight={600} mb={2}>Tổng kết thanh toán</Typography>
									<Stack spacing={2}>
										<Box display="flex" justifyContent="space-between">
											<Typography>Tổng tiền (4 tuần):</Typography>
											<Typography fontWeight={500}>
												{formatVND(originalPrice)}
											</Typography>
										</Box>

										{selectedVoucher && (
											<>
												<Box display="flex" justifyContent="space-between" color="success.main">
													<Box display="flex" alignItems="center">
														<LabelIcon sx={{ mr: 1 }} /> Giảm giá {selectedVoucher.discountRate}%:
													</Box>
													<Typography fontWeight={600}>
														-{formatVND(originalPrice * (selectedVoucher.discountRate / 100))}
													</Typography>
												</Box>
												<Divider />
											</>
										)}

										<Box display="flex" justifyContent="space-between">
											<Typography variant="h6" fontWeight={700}>Tổng thanh toán (100%):</Typography>
											<Typography variant="h6" fontWeight={700} color="primary.main">
												{formatVND(totalPrice)}
											</Typography>
										</Box>
									</Stack>
								</Paper>

								<Alert severity="info" sx={{ mt: 3 }}>
									<Typography variant="body2">
										💳 Thanh toán toàn bộ <strong>100%</strong> ngay - Không cần thanh toán thêm tại sân
									</Typography>
								</Alert>

								{/* Actions */}
								<Box mt={5} display="flex" gap={2} justifyContent="center">
									<Button
										variant="outlined"
										color="error"
										size="large"
										onClick={handleCancelPayment}
										disabled={isProcessing}
										sx={{ borderRadius: 30, px: 4, py: 1.5 }}
									>
										Hủy thanh toán
									</Button>
									<Button
										variant="contained"
										size="large"
										onClick={handleConfirmPayment}
										disabled={isProcessing}
										sx={{ borderRadius: 30, px: 5, py: 1.5, boxShadow: 6 }}
									>
										{isProcessing ? (
											<CircularProgress size={24} color="inherit" />
										) : (
											"Tôi đã chuyển khoản"
										)}
									</Button>
								</Box>
							</CardContent>
						</Card>
					</Box>
				</Box>

				{/* Cancel Dialog */}
				<Dialog open={openCancelDialog} onClose={handleCloseCancelDialog}>
					<DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>Xác nhận hủy</DialogTitle>
					<DialogContent sx={{ pt: 3 }}>
						<DialogContentText>
							Bạn có chắc muốn hủy thanh toán? <strong>Tất cả {reservationIds.length} đơn đặt cố định</strong> sẽ bị hủy.
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button onClick={handleCloseCancelDialog} disabled={isProcessing}>Quay lại</Button>
						<Button
							onClick={confirmCancelPayment}
							color="error"
							variant="contained"
							disabled={isProcessing}
						>
							{isProcessing ? <CircularProgress size={20} /> : "Xác nhận hủy"}
						</Button>
					</DialogActions>
				</Dialog>
			</Box>
		</UserLayout>
	);
};

export default CheckoutFixedPage;