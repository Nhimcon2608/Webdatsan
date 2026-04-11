// src/pages/AccountProfile.jsx
import React, { useState, useEffect } from "react";
import {
	Container,
	Typography,
	Avatar,
	Grid,
	Box,
	Card,
	CardContent,
	Button,
	IconButton,
	Divider,
	Tooltip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Snackbar,
	Alert,
	Skeleton,
	useTheme, // ← DÙNG CHUNG THEME TỪ DASHBOARD
} from "@mui/material";
import {
	Edit as EditIcon,
	PhoneIphone as PhoneIphoneIcon,
	Person as PersonIcon,
	Shield as ShieldIcon,
	Verified as VerifiedIcon,
	LockReset as LockResetIcon,
	CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";

import { useAuth } from "../../../../context/AuthContext";
import ChangePasswordModal from "../../../components/modal/ChangePasswordModal";
import authService from "../../../services/authService";
import managerService from "../../../services/managerService";

const AccountProfile = () => {
	const theme = useTheme(); // ← LẤY THEME TỪ ManagerLayout (Dashboard)
	const { user, setUser } = useAuth();

	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false);
	const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
	const [phoneNumber, setPhoneNumber] = useState("");
	const [phoneError, setPhoneError] = useState("");
	const [selectedFile, setSelectedFile] = useState(null);
	const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
	const token = localStorage.getItem("authToken");

	useEffect(() => {
		const fetchUser = async () => {
			setLoading(true);
			try {
				const u = await authService.getCurrentAccount(token);
				setUser(u);
				setPhoneNumber(u.phoneNumber || "");
			} catch {
				setSnackbar({ open: true, message: "Không tải được thông tin", severity: "error" });
			} finally {
				setLoading(false);
			}
		};
		if (token) fetchUser();
	}, [token, setUser]);

	const handleUpdatePhone = async () => {
		if (!/^\d{10,11}$/.test(phoneNumber)) {
			setPhoneError("Số điện thoại phải có 10-11 chữ số");
			return;
		}
		try {
			await authService.updatePhoneNumber(phoneNumber, token);
			setUser(prev => ({ ...prev, phoneNumber }));
			setSnackbar({ open: true, message: "Cập nhật số điện thoại thành công!", severity: "success" });
			setIsPhoneDialogOpen(false);
		} catch {
			setSnackbar({ open: true, message: "Cập nhật thất bại", severity: "error" });
		}
	};

	const handleAvatarChange = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setSelectedFile(file);
		const formData = new FormData();
		formData.append("file", file);
		try {
			const res = await managerService.uploadAvatar(formData, token);
			setUser(prev => ({ ...prev, ...res }));
			setSnackbar({ open: true, message: "Đổi avatar thành công!", severity: "success" });
			setIsImageDialogOpen(false);
		} catch {
			setSnackbar({ open: true, message: "Đổi avatar thất bại", severity: "error" });
		}
	};

	return (
		<Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
			<Card
				sx={{
					borderRadius: "24px",
					boxShadow: theme.palette.mode === "dark"
						? "0 8px 32px rgba(0,0,0,0.5)"
						: "0 6px 24px rgba(0,0,0,0.1)",
					transition: "all 0.4s ease",
					"&:hover": {
						transform: "translateY(-8px)",
						boxShadow: theme.palette.mode === "dark"
							? "0 20px 50px rgba(0,0,0,0.6)"
							: "0 16px 40px rgba(0,0,0,0.18)",
					},
				}}
			>
				<CardContent sx={{ p: { xs: 4, md: 6 } }}>
					{loading ? (
						<Grid container spacing={6}>
							<Grid size={{ xs: 12, md: 5 }} textAlign="center">
								<Skeleton variant="circular" width={180} height={180} sx={{ mx: "auto" }} />
								<Skeleton variant="text" width="70%" height={40} sx={{ mx: "auto", mt: 3 }} />
							</Grid>
							<Grid size={{ xs: 12, md: 7 }}>
								<Skeleton variant="text" width="60%" height={50} sx={{ mb: 4 }} />
								{[...Array(4)].map((_, i) => (
									<Skeleton key={i} variant="text" width="90%" height={45} sx={{ mb: 3 }} />
								))}
							</Grid>
						</Grid>
					) : (
						<Grid container spacing={6} alignItems="center">
							{/* AVATAR + NÚT UPLOAD */}
							<Grid size={{ xs: 12, md: 5 }} textAlign="center">
								<Box position="relative" display="inline-block">
									<Avatar
										alt={user?.username}
										src={user?.imagePath ? `${import.meta.env.VITE_API_URL}/${user.imagePath}` : ""}
										sx={{
											width: 180,
											height: 180,
											border: 8,
											borderColor: "primary.main",
											boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
										}}
									/>
									<Tooltip title="Đổi hình đại diện">
										<IconButton
											onClick={() => setIsImageDialogOpen(true)}
											sx={{
												position: "absolute",
												bottom: 16,
												right: 16,
												bgcolor: "background.paper",
												border: "5px solid",
												borderColor: "primary.main",
												width: 56,
												height: 56,
												"&:hover": {
													bgcolor: "primary.main",
													"& svg": { color: "white" },
												},
											}}
										>
											<CloudUploadIcon sx={{ color: "primary.main", fontSize: 30 }} />
										</IconButton>
									</Tooltip>
								</Box>

								<Typography variant="h5" fontWeight="bold" mt={4} color="text.primary">
									{user?.username}
								</Typography>
								<Typography variant="body1" color="text.secondary">
									Quản lý sân cầu lông
								</Typography>
							</Grid>

							{/* THÔNG TIN TÀI KHOẢN */}
							<Grid size={{ xs: 12, md: 7 }}>
								<Typography variant="h5" fontWeight="bold" color="primary.main" gutterBottom>
									Thông tin tài khoản
								</Typography>
								<Divider sx={{ mb: 4 }} />

								{[
									{ icon: PersonIcon, label: "Tên đăng nhập", value: user?.username },
									{ icon: PhoneIphoneIcon, label: "Số điện thoại", value: user?.phoneNumber || "Chưa cập nhật", edit: true },
									{ icon: ShieldIcon, label: "Vai trò", value: (user?.role || "MANAGER").toUpperCase() },
									{ icon: VerifiedIcon, label: "Trạng thái", value: user?.activated ? "Đã kích hoạt" : "Chưa kích hoạt", color: user?.activated ? "success.main" : "error.main" },
								].map((item, i) => (
									<Box key={i} display="flex" alignItems="center" mb={4}>
										<item.icon color="primary" sx={{ mr: 3, fontSize: 32 }} />
										<Box flex={1}>
											<Typography fontWeight="medium" color="text.secondary" variant="body2">
												{item.label}:
											</Typography>
											<Typography variant="h6" color={item.color || "text.primary"}>
												{item.value}
											</Typography>
										</Box>
										{item.edit && (
											<IconButton color="primary" onClick={() => setIsPhoneDialogOpen(true)}>
												<EditIcon />
											</IconButton>
										)}
									</Box>
								))}

								<Box textAlign="center" mt={6}>
									<Button
										variant="contained"
										size="large"
										startIcon={<LockResetIcon />}
										onClick={() => setIsModalOpen(true)}
										sx={{
											minWidth: 280,
											py: 2,
											borderRadius: "30px",
											fontSize: "1.1rem",
											fontWeight: 600,
											bgcolor: "#1a3c34",
											"&:hover": {
												bgcolor: "#2e5a50",
												transform: "translateY(-4px)",
												boxShadow: "0 12px 30px rgba(26,60,52,0.4)",
											},
										}}
									>
										Đổi mật khẩu
									</Button>
								</Box>
							</Grid>
						</Grid>
					)}
				</CardContent>
			</Card>

			{/* Dialog Số điện thoại */}
			<Dialog open={isPhoneDialogOpen} onClose={() => setIsPhoneDialogOpen(false)} maxWidth="xs" fullWidth>
				<DialogTitle>Chỉnh sửa số điện thoại</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						fullWidth
						label="Số điện thoại mới"
						value={phoneNumber}
						onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 11))}
						error={!!phoneError}
						helperText={phoneError || "Chỉ nhập số, 10-11 chữ số"}
						inputProps={{ maxLength: 11 }}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setIsPhoneDialogOpen(false)}>Hủy</Button>
					<Button variant="contained" onClick={handleUpdatePhone}>Lưu thay đổi</Button>
				</DialogActions>
			</Dialog>

			{/* Dialog Upload Avatar */}
			<Dialog open={isImageDialogOpen} onClose={() => setIsImageDialogOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle>Đổi hình đại diện</DialogTitle>
				<DialogContent>
					<Box textAlign="center" py={3}>
						<input
							accept="image/*"
							style={{ display: "none" }}
							id="avatar-upload"
							type="file"
							onChange={handleAvatarChange}
						/>
						<label htmlFor="avatar-upload">
							<Button variant="contained" component="span" startIcon={<CloudUploadIcon />} size="large">
								Chọn ảnh từ máy tính
							</Button>
						</label>
						{selectedFile && (
							<Typography mt={2} color="primary">
								Đã chọn: {selectedFile.name}
							</Typography>
						)}
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setIsImageDialogOpen(false)}>Đóng</Button>
				</DialogActions>
			</Dialog>

			<ChangePasswordModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />

			<Snackbar
				open={snackbar.open}
				autoHideDuration={3000}
				onClose={() => setSnackbar({ ...snackbar, open: false })}
				anchorOrigin={{ vertical: "top", horizontal: "center" }}
			>
				<Alert severity={snackbar.severity} sx={{ width: "100%" }}>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Container>
	);
};

export default AccountProfile;
