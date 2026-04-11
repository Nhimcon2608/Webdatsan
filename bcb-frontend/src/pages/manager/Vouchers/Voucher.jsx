// src/pages/VoucherManagement.jsx  (hoặc Voucher.jsx)
import React, { useEffect, useState, useCallback } from "react";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	DialogContentText,
	TextField,
	Typography,
	IconButton,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Card,
	CardContent,
	Snackbar,
	Alert,
	Tooltip,
	Chip,
	Skeleton,
	Stack,
	Avatar,
	useTheme,              // ← Dùng theme từ DashboardLayout
} from "@mui/material";
import {
	Delete,
	Edit,
	Add as AddIcon,
	Restore as RestoreIcon,
	ConfirmationNumber,
} from "@mui/icons-material";
import dayjs from "dayjs";
import voucherService from "../../../services/voucherService";
import branchService from "../../../services/branchServce";
import authService from "../../../services/authService";

const DATE_INPUT_FORMAT = "YYYY-MM-DD";

const getInitialForm = () => ({
	event: "",
	discountRate: "",
	startDate: dayjs().format(DATE_INPUT_FORMAT),
	endDate: dayjs().add(7, "day").format(DATE_INPUT_FORMAT),
});

const formatDateInput = (value, fallback) =>
	value ? dayjs(value).format(DATE_INPUT_FORMAT) : fallback;

const formatDisplayDate = (value) =>
	value ? dayjs(value).format("DD/MM/YYYY") : "Chưa đặt";

const getVoucherStatus = (voucher) => {
	if (!voucher.available) {
		return { label: "Đã khóa", color: "default" };
	}

	if (!voucher.startDate || !voucher.endDate) {
		return { label: "Thiếu ngày", color: "warning" };
	}

	const today = dayjs().startOf("day");
	const startDate = dayjs(voucher.startDate).startOf("day");
	const endDate = dayjs(voucher.endDate).startOf("day");

	if (today.isBefore(startDate)) {
		return { label: "Sắp diễn ra", color: "info" };
	}

	if (today.isAfter(endDate)) {
		return { label: "Hết hạn", color: "default" };
	}

	return { label: "Hoạt động", color: "success" };
};

const VoucherManagement = () => {
	const theme = useTheme(); // ← Lấy theme đúng từ DashboardLayout
	const [vouchers, setVouchers] = useState([]);
	const [open, setOpen] = useState(false);
	const [editingVoucher, setEditingVoucher] = useState(null);
	const [form, setForm] = useState(getInitialForm);
	const [errors, setErrors] = useState({});
	const [branchId, setBranchId] = useState(null);
	const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
	const [loading, setLoading] = useState(true);
	const [dialogLoading, setDialogLoading] = useState(false);
	const [confirmOpen, setConfirmOpen] = useState({ open: false, id: null, willActivate: false });

	const token = localStorage.getItem("authToken");

	// Load dữ liệu
	const loadVouchers = useCallback(async () => {
		if (!branchId || !token) return;
		try {
			const data = await voucherService.getAllVouchersOfBranch(branchId, token);
			setVouchers(data || []);
		} catch (err) {
			setSnackbar({ open: true, message: "Tải danh sách thất bại", severity: "error" });
		}
	}, [branchId, token]);

	useEffect(() => {
		const init = async () => {
			if (!token) return;
			try {
				const account = await authService.getCurrentAccount(token);
				const branch = await branchService.getBranchByAccountId(account.id, token);
				setBranchId(branch.id);
			} catch (err) {
				setSnackbar({ open: true, message: "Không lấy được chi nhánh", severity: "error" });
			}
		};
		init();
	}, [token]);

	useEffect(() => {
		if (branchId) {
			setLoading(true);
			loadVouchers().finally(() => setLoading(false));
		}
	}, [branchId, loadVouchers]);

	const showMessage = (msg, severity = "success") => {
		setSnackbar({ open: true, message: msg, severity });
	};

	const handleOpen = (voucher = null) => {
		setEditingVoucher(voucher);
		const initialForm = getInitialForm();
		setForm({
			event: voucher?.event || "",
			discountRate: voucher?.discountRate || "",
			startDate: formatDateInput(voucher?.startDate, initialForm.startDate),
			endDate: formatDateInput(voucher?.endDate, initialForm.endDate),
		});
		setErrors({});
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
		setEditingVoucher(null);
		setDialogLoading(false);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm(prev => ({ ...prev, [name]: value }));
		if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
	};

	const validate = () => {
		const err = {};
		const discountRate = Number(form.discountRate);
		if (!form.event.trim()) err.event = "Vui lòng nhập tên chương trình";
		if (!form.discountRate || Number.isNaN(discountRate) || discountRate < 1 || discountRate > 100)
			err.discountRate = "Giảm giá phải từ 1 đến 100%";
		if (!form.startDate) err.startDate = "Vui lòng chọn ngày bắt đầu";
		if (!form.endDate) err.endDate = "Vui lòng chọn ngày kết thúc";
		if (
			form.startDate &&
			form.endDate &&
			dayjs(form.endDate).isBefore(dayjs(form.startDate), "day")
		) {
			err.endDate = "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu";
		}
		setErrors(err);
		return Object.keys(err).length === 0;
	};

	const handleSubmit = async () => {
		if (!validate()) return;
		setDialogLoading(true);
		try {
			if (editingVoucher) {
				// ← GỬI KÈM available ĐÚNG NHƯ HIỆN TẠI
				await voucherService.updateVoucher(
					editingVoucher.id,
					{
						...form,
						branchId,
						available: editingVoucher.available, // ← Dòng quan trọng nhất!
					},
					token
				);
				showMessage("Cập nhật voucher thành công!");
			} else {
				await voucherService.createVoucher(
					{ ...form, branchId, available: true },
					token
				);
				showMessage("Tạo voucher thành công!");
			}
			handleClose();
			loadVouchers();
		} catch (err) {
			showMessage(err.response?.data?.message || "Lưu thất bại", "error");
		} finally {
			setDialogLoading(false);
		}
	};
	const handleToggle = (id, currentStatus) => {
		setConfirmOpen({ open: true, id, willActivate: !currentStatus });
	};

	const confirmToggle = async () => {
		try {
			await voucherService.toggleVoucherAvailability(confirmOpen.id, confirmOpen.willActivate, token);
			loadVouchers();
			showMessage(confirmOpen.willActivate ? "Đã kích hoạt voucher" : "Đã vô hiệu hóa voucher");
		} catch (err) {
			showMessage("Thao tác thất bại", "error");
		} finally {
			setConfirmOpen({ open: false });
		}
	};

	return (
		<Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh" }}>
			<Box sx={{ maxWidth: 1200, mx: "auto" }}>

				{/* Header Card */}
				<Card sx={{ mb: 4, borderRadius: 4, boxShadow: 3 }}>
					<CardContent sx={{ p: 4 }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Stack direction="row" alignItems="center" spacing={3}>
								<Avatar sx={{ bgcolor: "primary.main", width: 60, height: 60 }}>
									<ConfirmationNumber sx={{ fontSize: 36 }} />
								</Avatar>
								<Box>
									<Typography variant="h4" fontWeight="bold" color="text.primary">
										Quản lý Voucher
									</Typography>
									<Typography variant="body1" color="text.secondary">
										Tạo và quản lý chương trình khuyến mãi
									</Typography>
								</Box>
							</Stack>
							<Button
								variant="contained"
								size="large"
								startIcon={<AddIcon />}
								onClick={() => handleOpen()}
								sx={{
									borderRadius: 3,
									px: 4,
									py: 1.5,
									fontSize: "1.1rem",
									fontWeight: 600,
								}}
							>
								Tạo Voucher Mới
							</Button>
						</Stack>
					</CardContent>
				</Card>

				{/* Table Card */}
				<Card sx={{ borderRadius: 4, overflow: "hidden" }}>
					<CardContent sx={{ p: 0 }}>
						{loading ? (
							<Box sx={{ p: 4 }}>
								{[...Array(6)].map((_, i) => (
									<Skeleton key={i} height={70} sx={{ mb: 1, borderRadius: 2 }} />
								))}
							</Box>
						) : (
							<TableContainer>
								<Table>
									<TableHead>
										<TableRow sx={{ backgroundColor: theme.palette.mode === "dark" ? "#1a3c34" : "#f0f7f4" }}>
											<TableCell sx={{ fontWeight: 700, color: theme.palette.primary.main }}>Chương trình</TableCell>
											<TableCell align="center" sx={{ fontWeight: 700 }}>Giảm giá</TableCell>
											<TableCell sx={{ fontWeight: 700 }}>Bắt đầu</TableCell>
											<TableCell sx={{ fontWeight: 700 }}>Kết thúc</TableCell>
											<TableCell sx={{ fontWeight: 700 }}>Ngày tạo</TableCell>
											<TableCell align="center" sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
											<TableCell align="center" sx={{ fontWeight: 700 }}>Hành động</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{vouchers.map((v) => {
											const voucherStatus = getVoucherStatus(v);

											return (
												<TableRow key={v.id} hover>
													<TableCell>
														<Typography fontWeight={600} color="text.primary">
															{v.event}
														</Typography>
													</TableCell>
													<TableCell align="center">
														<Chip label={`${v.discountRate}%`} color="primary" size="small" sx={{ fontWeight: "bold", minWidth: 64 }} />
													</TableCell>
													<TableCell>{formatDisplayDate(v.startDate)}</TableCell>
													<TableCell>{formatDisplayDate(v.endDate)}</TableCell>
													<TableCell>{dayjs(v.createAt).format("DD/MM/YYYY HH:mm")}</TableCell>
													<TableCell align="center">
														<Chip
															label={voucherStatus.label}
															color={voucherStatus.color}
															size="small"
															sx={{ minWidth: 100, fontWeight: 600 }}
														/>
													</TableCell>
													<TableCell align="center">
														<Tooltip title="Chỉnh sửa">
															<IconButton color="primary" onClick={() => handleOpen(v)}>
																<Edit />
															</IconButton>
														</Tooltip>
														<Tooltip title={v.available ? "Vô hiệu hóa" : "Kích hoạt lại"}>
															<IconButton
																color={v.available ? "error" : "success"}
																onClick={() => handleToggle(v.id, v.available)}
															>
																{v.available ? <Delete /> : <RestoreIcon />}
															</IconButton>
														</Tooltip>
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</TableContainer>
						)}

						{vouchers.length === 0 && !loading && (
							<Box sx={{ py: 10, textAlign: "center" }}>
								<Typography variant="h6" color="text.secondary" gutterBottom>
									Chưa có voucher nào
								</Typography>
								<Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
									Tạo voucher đầu tiên
								</Button>
							</Box>
						)}
					</CardContent>
				</Card>
			</Box>

			{/* Dialog tạo/sửa */}
			<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ fontWeight: 700, fontSize: "1.6rem" }}>
					{editingVoucher ? "Chỉnh sửa Voucher" : "Tạo Voucher Mới"}
				</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						fullWidth
						label="Tên chương trình khuyến mãi"
						name="event"
						value={form.event}
						onChange={handleChange}
						error={!!errors.event}
						helperText={errors.event}
						sx={{ mt: 2 }}
					/>
					<TextField
						fullWidth
						label="Tỷ lệ giảm giá (%)"
						name="discountRate"
						type="number"
						value={form.discountRate}
						onChange={handleChange}
						error={!!errors.discountRate}
						helperText={errors.discountRate || "Từ 1 đến 100"}
						inputProps={{ min: 1, max: 100 }}
						sx={{ mt: 3 }}
					/>
					<Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
						<TextField
							fullWidth
							label="Ngày bắt đầu"
							name="startDate"
							type="date"
							value={form.startDate}
							onChange={handleChange}
							error={!!errors.startDate}
							helperText={errors.startDate}
							InputLabelProps={{ shrink: true }}
						/>
						<TextField
							fullWidth
							label="Ngày kết thúc"
							name="endDate"
							type="date"
							value={form.endDate}
							onChange={handleChange}
							error={!!errors.endDate}
							helperText={errors.endDate}
							InputLabelProps={{ shrink: true }}
							inputProps={{ min: form.startDate || undefined }}
						/>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 3 }}>
					<Button onClick={handleClose} disabled={dialogLoading}>Hủy</Button>
					<Button variant="contained" onClick={handleSubmit} disabled={dialogLoading}>
						{dialogLoading ? "Đang lưu..." : editingVoucher ? "Cập nhật" : "Tạo mới"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Confirm Dialog + Snackbar giữ nguyên như cũ */}
			<Dialog open={confirmOpen.open} onClose={() => setConfirmOpen({ open: false })}>
				<DialogTitle>Xác nhận</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Bạn có chắc muốn <strong>{confirmOpen.willActivate ? "kích hoạt" : "vô hiệu hóa"}</strong> voucher này?
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setConfirmOpen({ open: false })}>Hủy</Button>
					<Button onClick={confirmToggle} variant="contained" color={confirmOpen.willActivate ? "success" : "error"}>
						Xác nhận
					</Button>
				</DialogActions>
			</Dialog>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={4000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
				anchorOrigin={{ vertical: "top", horizontal: "center" }}
			>
				<Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ minWidth: 300 }}>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Box>
	);
};

export default VoucherManagement;
