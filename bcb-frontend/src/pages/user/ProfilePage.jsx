import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import {
	Avatar,
	Box,
	Typography,
	Grid,
	TextField,
	Divider,
	IconButton,
	Radio,
	RadioGroup,
	FormControlLabel,
	FormControl,
	FormLabel,
	Fade,
	Card,
	CardContent,
	Container,
	Button,
	useTheme,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Alert,
	Snackbar,
	Chip,
	Drawer,
	List,
	InputLabel,
	Select,
	Tooltip,
	useMediaQuery,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import EventIcon from '@mui/icons-material/Event';
import RateReviewIcon from '@mui/icons-material/RateReview';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PasswordIcon from '@mui/icons-material/Password';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import MenuIcon from '@mui/icons-material/Menu';
import RefreshIcon from '@mui/icons-material/Refresh';
import EventNoteIcon from '@mui/icons-material/EventNote'
import LockResetIcon from '@mui/icons-material/LockReset';
import Skeleton from '@mui/material/Skeleton';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import vi from 'date-fns/locale/vi';

import DrawerItem from '../../components/common/DrawerItem';
import StyledMenuItem from '../../components/common/StyledMenuItem';
import BookingDetail from '../../components/modal/BookingDetail';
import ReviewModal from '../../components/modal/WriteReviewModal';
import ChangePasswordModal from '../../components/modal/ChangePasswordModal';

import UserLayout from '../../layouts/user/UserLayout';
import userService from '../../services/userService';
import reservationService from '../../services/reservationService';
import reviewService from '../../services/reviewService';
import branchService from '../../services/branchServce'
import { useAuth } from '../../../context/AuthContext';


const ProfilePage = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const { setUser } = useAuth();

	const [profile, setProfile] = useState(null);
	const [account, setAccount] = useState(null);
	const [error, setError] = useState(null);
	const [editMode, setEditMode] = useState(false);
	const [editedProfile, setEditedProfile] = useState({});
	const [isLoading, setIsLoading] = useState(true);
	const [reservations, setReservations] = useState([]);
	const [reviews, setReviews] = useState([]);
	const [branches, setBranches] = useState({});
	const [passwordData, setPasswordData] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	});
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		severity: 'success'
	});
	const [activeTab, setActiveTab] = useState('profile');
	const [mobileOpen, setMobileOpen] = useState(false);
	const [filterStatus, setFilterStatus] = useState('all');
	const [filterDate, setFilterDate] = useState(null);
	const [filterBranch, setFilterBranch] = useState('all');

	const [filteredReservations, setFilteredReservations] = useState();
	const [branchesInReservations, setbranchesInReservations] = useState();

	const [selectedReservation, setSelectedReservation] = useState(null);
	const [openReservationModal, setOpenReservaitonModal] = useState(false);
	const [selectedBranchInfo, setSelectedBranchInfo] = useState(null);

	const [selectedReview, setSelectedReview] = useState(null);
	const [openReviewModal, setOpenReviewModal] = useState(false);
	const [refreshFlag, setRefreshFlag] = useState(false);

	const [isOpenChangePasswordModal, setOpenChangePasswordModal] = useState(false);


	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try {
				const accountData = (await userService.getAccount()).data;
				const profileData = (await userService.getProfile(accountData.id)).data;
				const reservationsData = (await reservationService.getAllReservationsOfUser('all'));
				const reviewsData = (await reviewService.getAllReviewsOfUser());
				const branchesData = await branchService.getAllBranches('all');

				const branchMap = {};
				branchesData.forEach(b => {
					branchMap[b.id] = b.branchName;
				});

				setbranchesInReservations(Array.from(
					new Set(reservationsData.map(r => String(r.branchId)))
				).map(id => ({ id, name: branchMap[id] || 'Unknown' })));

				setAccount(accountData);
				setProfile(profileData);
				setBranches(branchesData);

				setEditedProfile({ ...profileData });
				setReservations(reservationsData.map(r => {
					return {
						...r,
						branchName: branchMap[r.branchId] || 'Unknown'
					};
				}));
				setReviews(reviewsData.map(r => {
					return {
						...r,
						branchName: branchMap[r.branchId] || 'Unknown'
					};
				}));

				setFilteredReservations(reservationsData);

			} catch (err) {
				setError(err);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	useEffect(() => {
		const applyReservaionFilters = () => {
			let result = [...reservations];

			if (filterDate) {
				result = result.filter(item => (dayjs(item.bookAt).format('DD/MM/YYYY') == dayjs(filterDate).format('DD/MM/YYYY')));
			}

			if (filterStatus !== 'all') {
				result = result.filter(item => item.status === filterStatus);
			}

			if (filterBranch !== 'all') {
				result = result.filter(item => item.branchId === filterBranch);
			}

			setFilteredReservations(result);
		};

		applyReservaionFilters();

	}, [filterDate, filterStatus, filterBranch, reservations]);

	useEffect(() => {
		const fetchReviews = async () => {
			const reviewsResponse = await reviewService.getAllReviewsOfUser();
			setReviews(reviewsResponse);
		};
		fetchReviews();
	}, [refreshFlag]);

	useEffect(() => {
		const fetchBranch = async () => {
			if (!selectedBranchInfo) {
				return;
			}

			const branch = await branchService.getBranchById(selectedBranchInfo.id);
			setSelectedBranchInfo({ ...selectedBranchInfo, phoneNumber: branch.phoneNumber });
		}
		fetchBranch();
	}, [selectedReservation, selectedReview]);

	const handleEditClick = () => {
		setEditMode(true);
	};

	const handleSaveClick = async () => {
		try {
			const updatedProfile = { ...editedProfile };
			let nextAccount = account;

			if (editedProfile.avatarFile) {
				const formData = new FormData();
				formData.append('file', editedProfile.avatarFile);
				const uploadResponse = await userService.uploadAvatar(formData);
				nextAccount = uploadResponse;
				setAccount(uploadResponse);
				setUser(uploadResponse);
			}

			const profilePayload = {
				fullName: updatedProfile.fullName?.trim() || '',
				dob: updatedProfile.dob || null,
				gender: updatedProfile.gender === ''
					? null
					: updatedProfile.gender === 'true'
						? true
						: updatedProfile.gender === 'false'
							? false
							: updatedProfile.gender,
				email: updatedProfile.email?.trim() || '',
			};

			const profileResponse = await userService.updateProfile(profilePayload);
			setProfile(profileResponse.data);
			setEditedProfile({
				...profileResponse.data,
				imagePath: nextAccount?.imagePath,
			});
			setEditMode(false);
			showSnackbar('Cập nhật thông tin thành công', 'success');
		} catch (err) {
			console.error('Profile update failed:', err);
			showSnackbar('Cập nhật thông tin thất bại', 'error');
		}
	};

	const handleCancelClick = () => {
		setEditedProfile({ ...profile });
		setEditMode(false);
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setEditedProfile(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleAvatarChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setEditedProfile(prev => ({
					...prev,
					imagePath: reader.result,
					avatarFile: file
				}));
			};
			reader.readAsDataURL(file);
		}
	};

	const handleViewReview = (review) => {
		setSelectedReview(review);
		setSelectedBranchInfo(branches.find(b => b.id == review.branchId));
		setOpenReviewModal(true);
	};

	const handleViewReservation = (reservation) => {
		setSelectedReservation(reservation);
		setSelectedBranchInfo(branches.find(b => b.id == reservation.branchId));
		setOpenReservaitonModal(true);
	};

	const handleUpdateReview = async () => {
		setRefreshFlag(prev => !prev);
	};

	const handleDrawerToggle = () => {
		setMobileOpen(!mobileOpen);
	};

	const handleCloseSnackbar = () => {
		setSnackbar(prev => ({ ...prev, open: false }));
	};

	const showSnackbar = (message, severity) => {
		setSnackbar({
			open: true,
			message,
			severity
		});
	};

	const getProfileFieldInputProps = (isOutlined) => ({
		...(isOutlined ? {} : { disableUnderline: true }),
		style: { minHeight: '56px' }
	});

	const avatarSrc = editedProfile.avatarFile && editedProfile.imagePath
		? editedProfile.imagePath
		: account?.imagePath
			? `${import.meta.env.VITE_API_URL}/${account.imagePath}`
			: '/default-avatar.jpg';

	if (error) {
		return (
			<UserLayout>
				<Container maxWidth="lg" sx={{ py: 4 }}>
					<Card
						elevation={2}
						sx={{
							p: 3,
							borderRadius: theme.shape.borderRadius,
							bgcolor: theme.palette.background.paper
						}}
					>
						<Typography color="error" variant="h6" textAlign="center">
							Error: {error.message}
						</Typography>
					</Card>
				</Container>
			</UserLayout>
		);
	}

	const renderStatusChip = (status) => {
		switch (status) {
			case 'awaiting_payment':
				return <Chip label="Đợi thanh toán" color="warning" size="small" />;
			case 'finish':
				return <Chip label="Đã kết thúc" color="success" size="small" />;
			case 'cancel':
				return <Chip label="Đã hủy" color="error" size="small" />;
			case 'waiting':
				return <Chip label="Chờ ghé sân" color="info" size="small" />;
			default:
				return <Chip label={status} size="small" />;
		}
	};

	const renderContent = () => {
		switch (activeTab) {
			case 'profile':
				return (
					<Container maxWidth="lg" sx={{ py: 2 }}>
						{isLoading ? (
							<CardContent sx={{ p: 4 }}>
								<Stack spacing={4}>
									<Grid size={{ xs: 12, md: 4 }}>
										<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
											<Skeleton variant="circular" width={150} height={150} />
											<Skeleton variant="text" width={120} height={30} sx={{ mt: 2 }} />
										</Box>
									</Grid>
									<Grid size={{ xs: 12, md: 8 }}>
										<Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
										<Skeleton variant="rectangular" height={300} sx={{ borderRadius: theme.shape.borderRadius }} />
									</Grid>
								</Stack>
							</CardContent>
						) : (
							<Fade in={!isLoading} timeout={500}>
								<CardContent>
									<Grid sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
										<Box sx={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											position: 'relative'
										}}>
											<Box sx={{ position: 'relative', mb: 1 }}>
												<Avatar
													src={avatarSrc}
													sx={{
														width: 150,
														height: 150,
														border: `4px solid ${theme.palette.primary.light}`,
														boxShadow: theme.palette.mode === 'dark'
															? '0 4px 20px rgba(96, 172, 242, 0.3)'
															: '0 4px 20px rgba(0,0,0,0.1)',
													}}
												/>

												{editMode && (
													<>
														<input
															accept="image/*"
															type="file"
															id="avatar-upload"
															style={{ display: 'none' }}
															onChange={handleAvatarChange}
														/>
														<label htmlFor="avatar-upload">
															<IconButton
																component="span"
																sx={{
																	position: 'absolute',
																	bottom: 0,
																	right: 0,
																	backgroundColor: theme.palette.primary.main,
																	color: theme.palette.primary.contrastText,
																	'&:hover': {
																		backgroundColor: theme.palette.primary.dark,
																	},
																	width: 40,
																	height: 40,
																}}
															>
																<PhotoCameraIcon fontSize="small" />
															</IconButton>
														</label>
													</>
												)}
											</Box>

											<Typography
												variant="h6"
												sx={{
													mt: 1,
													fontWeight: 'bold',
													color: theme.palette.text.primary
												}}
											>
												{account?.username}
											</Typography>

											{!editMode ? (
												<Button
													variant="outlined"
													startIcon={<EditIcon />}
													onClick={handleEditClick}
													sx={{
														mt: 1,
														mb: 3,
														borderRadius: '20px',
														textTransform: 'none',
														px: 3,
														height: '40px',
														borderColor: theme.palette.divider,
														color: theme.palette.text.primary,
														'&:hover': {
															borderColor: theme.palette.primary.main,
															bgcolor: theme.palette.action.hover,
														}
													}}
												>
													Chỉnh sửa
												</Button>
											) : (
												<Stack direction="row" spacing={1} sx={{ mt: 1, mb: 3 }}>
													<Button
														variant="contained"
														startIcon={<SaveIcon />}
														onClick={handleSaveClick}
														sx={{
															borderRadius: '20px',
															textTransform: 'none',
															backgroundColor: '#10b981',
															'&:hover': {
																backgroundColor: '#059669',
															},
															height: '40px'
														}}
													>
														Lưu
													</Button>
													<Button
														variant="outlined"
														startIcon={<CancelIcon />}
														onClick={handleCancelClick}
														color="secondary"
														sx={{
															borderRadius: '20px',
															textTransform: 'none',
															height: '40px'
														}}
													>
														Hủy
													</Button>
												</Stack>
											)}
										</Box>
									</Grid>

									<Grid size={{ xs: 12, md: 8 }}>
										<Card
											elevation={0}
											sx={{
												backgroundColor: theme.palette.background.paper,
												border: `1px solid ${theme.palette.divider}`,
												borderRadius: theme.shape.borderRadius,
												height: '100%'
											}}
										>
											<CardContent sx={{ height: '100%' }}>
												<Typography
													variant="h5"
													gutterBottom
													sx={{
														pb: 1,
														mb: 2,
														borderBottom: `2px solid ${theme.palette.divider}`,
														display: 'flex',
														alignItems: 'center',
														gap: 1,
														fontWeight: 600,
														color: theme.palette.text.primary,
													}}
												>
													<PersonIcon color="primary" />
													Thông tin cá nhân
												</Typography>

												<Grid container spacing={3}>
													<Grid size={{ xs: 12 }}>
														<TextField
															label="Họ và tên"
															name="fullName"
															value={editedProfile.fullName || ''}
															onChange={handleInputChange}
															fullWidth
															disabled={!editMode}
															variant={editMode ? "outlined" : "filled"}
															InputProps={getProfileFieldInputProps(editMode)}
															sx={{
																mb: 1,
																'& .MuiFilledInput-root': {
																	backgroundColor: editMode
																		? theme.palette.background.default
																		: theme.palette.background.paper,
																}
															}}
														/>
													</Grid>

													<Grid size={{ xs: 12, sm: 6 }}>
														<TextField
															label="Ngày sinh"
															name="dob"
															type="date"
															value={editedProfile.dob || ''}
															onChange={handleInputChange}
															fullWidth
															disabled={!editMode}
															variant={editMode ? "outlined" : "filled"}
															InputLabelProps={{
																shrink: true,
															}}
															InputProps={getProfileFieldInputProps(editMode)}
															inputProps={{
																min: "1900-01-01",
																max: dayjs().subtract(7, 'year').format('YYYY-MM-DD')
															}}
															sx={{
																'& .MuiFilledInput-root': {
																	backgroundColor: editMode
																		? theme.palette.background.default
																		: theme.palette.background.paper,
																}
															}}
														/>
													</Grid>

													<Grid size={{ xs: 12, sm: 6 }}>
														<Box sx={{
															height: '100%',
															minHeight: '56px',
															display: 'flex',
															flexDirection: 'column',
															justifyContent: 'center'
														}}>
															<FormControl
																disabled={!editMode}
																fullWidth
																sx={{
																	p: editMode ? 0 : 1,
																	backgroundColor: editMode
																		? 'transparent'
																		: theme.palette.background.paper,
																	minHeight: '56px',
																	display: 'flex',
																	justifyContent: 'center'
																}}
															>
																<FormLabel
																	id="gender-label"
																	sx={{
																		color: theme.palette.text.primary,
																		fontWeight: 500,
																		mb: 0.5
																	}}
																>
																	Giới tính
																</FormLabel>
																<RadioGroup
																	row
																	aria-labelledby="gender-label"
																	name="gender"
																	value={editedProfile.gender || ''}
																	onChange={handleInputChange}
																>
																	<FormControlLabel
																		value={false}
																		control={<Radio color="primary" />}
																		label="Nữ"
																	/>
																	<FormControlLabel
																		value={true}
																		control={<Radio color="primary" />}
																		label="Nam"
																	/>
																	<FormControlLabel
																		value=""
																		control={<Radio color="primary" />}
																		label="Khác"
																	/>
																</RadioGroup>
															</FormControl>
														</Box>
													</Grid>

													<Grid size={{ xs: 12 }}>
														<Divider sx={{ my: 1 }} />
													</Grid>

													<Grid size={{ xs: 12, sm: 6 }}>
														<TextField
															label="Số điện thoại"
															name="phoneNumber"
															value={account?.phoneNumber || ''}
															fullWidth
															disabled={true}
															variant="filled"
															InputProps={{
																disableUnderline: true,
																style: { minHeight: '56px' }
															}}
															sx={{
																'& .MuiFilledInput-root': {
																	backgroundColor: theme.palette.background.paper,
																}
															}}
														/>
													</Grid>

													<Grid size={{ xs: 12, sm: 6 }}>
														<TextField
															label="Email"
															name="email"
															value={editedProfile.email || ''}
															onChange={handleInputChange}
															fullWidth
															disabled={!editMode}
															variant={editMode ? "outlined" : "filled"}
															InputProps={getProfileFieldInputProps(editMode)}
															sx={{
																'& .MuiFilledInput-root': {
																	backgroundColor: editMode
																		? theme.palette.background.default
																		: theme.palette.background.paper,
																}
															}}
														/>
													</Grid>
												</Grid>
											</CardContent>
										</Card>
									</Grid>
								</CardContent>
							</Fade>
						)}
					</Container>
				);

			case 'privacy':
				return (
					<>
						<Container maxWidth="lg" sx={{ py: 2 }}>
							{isLoading ? (
								<CardContent sx={{ p: 4 }}>
									<Grid size={{ xs: 12, md: 8 }}>
										<Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
										<Skeleton variant="rectangular" height={300} sx={{ borderRadius: theme.shape.borderRadius }} />
									</Grid>
								</CardContent>
							) : (
								<CardContent sx={{ height: '100%' }}>
									<Typography
										variant="h5"
										gutterBottom
										sx={{
											pb: 1,
											mb: 3,
											borderBottom: `2px solid ${theme.palette.divider}`,
											display: 'flex',
											alignItems: 'center',
											gap: 1,
											fontWeight: 600,
											color: theme.palette.text.primary,
										}}
									>
										<LockIcon color="primary" fontSize="medium" />
										Quyền riêng tư và bảo mật
									</Typography>

									<Box sx={{ pl: 2 }}>
										<Box sx={{ mb: 4 }}>
											<Typography
												variant="subtitle1"
												gutterBottom
												sx={{
													pb: 1,
													mb: 2,
													display: 'flex',
													alignItems: 'center',
													gap: 1,
													fontWeight: 500,
													color: theme.palette.text.primary
												}}
											>
												<PasswordIcon color="primary" fontSize="small" />
												Mật khẩu
											</Typography>

											<Box sx={{ pl: 4 }}>
												<Button
													variant="outlined"
													color="primary"
													onClick={() => setOpenChangePasswordModal(true)}
													startIcon={<LockResetIcon />}
													sx={{
														margin: '8px',
														padding: '8px 16px',
														borderRadius: '8px',
														textTransform: 'none',
														fontWeight: 600,
														borderColor: theme.palette.divider,
														color: theme.palette.text.primary,
														'&:hover': {
															borderColor: theme.palette.primary.main,
															bgcolor: theme.palette.action.hover,
														}
													}}
												>
													Đổi mật khẩu
												</Button>
											</Box>
										</Box>

										<Box sx={{ mb: 4 }}>
											<Typography
												variant="subtitle1"
												gutterBottom
												sx={{
													pb: 1,
													mb: 2,
													display: 'flex',
													alignItems: 'center',
													gap: 1,
													fontWeight: 500,
													color: theme.palette.text.primary
												}}
											>
												<NotificationsIcon color="primary" fontSize="small" />
												Cài đặt thông báo
											</Typography>

											<Box sx={{ pl: 4 }}>
												{/* Add notification settings components here */}
											</Box>
										</Box>

										<Box sx={{ mb: 2 }}>
											<Typography
												variant="subtitle1"
												gutterBottom
												sx={{
													pb: 1,
													mb: 2,
													display: 'flex',
													alignItems: 'center',
													gap: 1,
													fontWeight: 500,
													color: theme.palette.text.primary
												}}
											>
												<PrivacyTipIcon color="primary" fontSize="small" />
												Cài đặt riêng tư
											</Typography>

											<Box sx={{ pl: 4 }}>
												{/* Add privacy settings components here */}
											</Box>
										</Box>
									</Box>
								</CardContent>
							)}
						</Container>

						<ChangePasswordModal
							open={isOpenChangePasswordModal}
							onClose={() => setOpenChangePasswordModal(false)}
						/>
					</>
				);

			case 'reservations':
				const totalReservations = reservations?.length || 0;
				const pendingCount = reservations?.filter(r => r.status === 'waiting').length || 0;
				const confirmedCount = reservations?.filter(r => r.status === 'finish').length || 0;
				const cancelledCount = reservations?.filter(r => r.status === 'cancel').length || 0;

				return (
					<>
						<Container maxWidth="lg" sx={{ py: 2 }}>
							{isLoading ? (
								<CardContent sx={{ p: 4 }}>
									<Grid size={{ xs: 12, md: 8 }}>
										<Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
										<Skeleton variant="rectangular" height={300} sx={{ borderRadius: theme.shape.borderRadius }} />
									</Grid>
								</CardContent>
							) : (
								<CardContent sx={{ height: '100%' }}>
									<Typography
										variant="h5"
										gutterBottom
										sx={{
											pb: 1,
											mb: 3,
											borderBottom: `2px solid ${theme.palette.divider}`,
											display: 'flex',
											alignItems: 'center',
											gap: 1,
											fontWeight: 600,
											color: theme.palette.text.primary,
										}}
									>
										<EventIcon color="primary" fontSize="medium" />
										Lịch đặt sân của bạn
									</Typography>

									<Grid container spacing={2} sx={{ mb: 4 }}>
										<Grid size={{ xs: 12, sm: 3 }}>
											<Card sx={{
												boxShadow: theme.palette.mode === 'dark'
													? '0 2px 8px rgba(96, 172, 242, 0.2)'
													: '0 2px 8px rgba(0,0,0,0.1)',
												backgroundColor: theme.palette.background.paper
											}}>
												<CardContent>
													<Typography variant="body2" color={theme.palette.text.secondary}>
														Tổng số đặt sân
													</Typography>
													<Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
														{totalReservations}
													</Typography>
												</CardContent>
											</Card>
										</Grid>
									</Grid>

									<Box gap={2} sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
										<Button
											variant="text"
											onClick={() => setFilterDate(null)}
											sx={{
												color: theme.palette.text.primary,
												'&:hover': {
													bgcolor: theme.palette.action.hover,
												}
											}}
										>
											<RefreshIcon sx={{
												transition: 'transform 0.3s ease',
												'.MuiButton-root:hover &': {
													transform: 'rotate(240deg)',
												}
											}} />
										</Button>

										<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
											<DatePicker
												label="Chọn ngày"
												value={filterDate}
												onChange={(newValue) => setFilterDate(newValue)}
												format="dd/MM/yyyy"
												sx={{
													width: { xs: '100%', sm: 220 },
													'& .MuiOutlinedInput-root': {
														bgcolor: theme.palette.background.paper,
													}
												}}
											/>
										</LocalizationProvider>

										<FormControl sx={{ minWidth: 200 }}>
											<InputLabel>Lọc theo trạng thái</InputLabel>
											<Select
												value={filterStatus}
												label="Lọc theo trạng thái"
												onChange={(e) => setFilterStatus(e.target.value)}
												sx={{
													bgcolor: theme.palette.background.paper,
												}}
											>
												<StyledMenuItem value="all">Tất cả</StyledMenuItem>
												<StyledMenuItem value="waiting">Chờ ghé sân</StyledMenuItem>
												<StyledMenuItem value="finish">Đã kết thúc</StyledMenuItem>
												<StyledMenuItem value="cancel">Đã hủy</StyledMenuItem>
											</Select>
										</FormControl>

										<FormControl sx={{ minWidth: 200, maxWidth: 300 }}>
											<InputLabel>Lọc theo sân cầu</InputLabel>
											<Select
												value={filterBranch}
												label="Lọc theo sân cầu"
												onChange={(e) => setFilterBranch(e.target.value)}
												sx={{
													bgcolor: theme.palette.background.paper,
												}}
											>
												<StyledMenuItem value="all">Tất cả</StyledMenuItem>
												{branchesInReservations?.map(r => (
													<StyledMenuItem key={r.id} value={r.id}>{r.name}</StyledMenuItem>
												))}
											</Select>
										</FormControl>
									</Box>

									<TableContainer
										component={Paper}
										sx={{
											boxShadow: 'none',
											backgroundColor: theme.palette.background.paper,
											borderRadius: 2,
											border: `1px solid ${theme.palette.divider}`,
											maxHeight: 'calc(100vh - 200px)',
											overflow: 'auto'
										}}
									>
										<Table sx={{ minWidth: 650 }} stickyHeader>
											<TableHead>
												<TableRow>
													<TableCell sx={{
														fontWeight: 600,
														color: theme.palette.text.primary,
														bgcolor: theme.palette.background.paper,
													}}>Mã đặt sân</TableCell>
													<TableCell sx={{
														fontWeight: 600,
														color: theme.palette.text.primary,
														bgcolor: theme.palette.background.paper,
													}}>Sân cầu</TableCell>
													<TableCell sx={{
														fontWeight: 600,
														color: theme.palette.text.primary,
														bgcolor: theme.palette.background.paper,
													}}>Ngày</TableCell>
													<TableCell sx={{
														fontWeight: 600,
														color: theme.palette.text.primary,
														bgcolor: theme.palette.background.paper,
													}}>Trạng thái</TableCell>
													<TableCell sx={{
														fontWeight: 600,
														color: theme.palette.text.primary,
														bgcolor: theme.palette.background.paper,
													}}>Hành động</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{filteredReservations?.length === 0 ? (
													<TableRow>
														<TableCell colSpan={5} align="center" sx={{
															py: 6,
															color: theme.palette.text.secondary,
															fontSize: '1rem'
														}}>
															<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
																<EventNoteIcon sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 1 }} />
																Bạn chưa có lịch đặt sân nào
															</Box>
														</TableCell>
													</TableRow>
												) : (
													[...filteredReservations]
														.sort((a, b) => new Date(b.bookAt) - new Date(a.bookAt))
														.map((reservation) => (
															<TableRow
																key={reservation.id}
																sx={{
																	'&:hover': {
																		backgroundColor: theme.palette.action.hover,
																	},
																	transition: 'background-color 0.2s',
																	'&:last-child td': { borderBottom: 'none' }
																}}
															>
																<TableCell sx={{
																	color: theme.palette.text.primary,
																	fontWeight: 500,
																	py: 2
																}}>#{reservation.id}</TableCell>
																<TableCell sx={{
																	color: theme.palette.text.primary,
																	py: 2
																}}>{reservation.branchName}</TableCell>
																<TableCell sx={{
																	color: theme.palette.text.primary,
																	py: 2
																}}>
																	{dayjs(reservation.bookAt).format('DD/MM/YYYY')}
																</TableCell>
																<TableCell sx={{ py: 2 }}>{renderStatusChip(reservation.status)}</TableCell>
																<TableCell sx={{ py: 2 }}>
																	<Tooltip title="Xem chi tiết">
																		<IconButton
																			onClick={() => handleViewReservation(reservation)}
																			sx={{
																				color: theme.palette.primary.main,
																				'&:hover': {
																					backgroundColor: theme.palette.primary.light,
																					color: 'white'
																				},
																				transition: 'all 0.3s'
																			}}
																		>
																			<VisibilityIcon />
																		</IconButton>
																	</Tooltip>
																</TableCell>
															</TableRow>
														))
												)}
											</TableBody>
										</Table>
									</TableContainer>
								</CardContent>
							)}
						</Container>
						{openReservationModal && (
							<BookingDetail
								reservationData={selectedReservation}
								reservationDetails={selectedReservation.reservationDetails}
								branchInfo={selectedBranchInfo}
								status={selectedReservation.status}
								isModal={true}
								onClose={() => setOpenReservaitonModal(false)}
							/>
						)}
					</>
				);

			case 'reviews':
				return (
					<>
						<Container maxWidth="lg" sx={{ py: 2 }}>
							{isLoading ? (
								<CardContent sx={{ p: 4 }}>
									<Grid size={{ xs: 12, md: 8 }}>
										<Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
										<Skeleton variant="rectangular" height={300} sx={{ borderRadius: theme.shape.borderRadius }} />
									</Grid>
								</CardContent>
							) : (
								<CardContent sx={{ height: '100%' }}>
									<Typography
										variant="h5"
										gutterBottom
										sx={{
											pb: 1,
											mb: 3,
											borderBottom: `2px solid ${theme.palette.divider}`,
											display: 'flex',
											alignItems: 'center',
											gap: 1,
											fontWeight: 600,
											color: theme.palette.text.primary,
										}}
									>
										<RateReviewIcon color="primary" fontSize="medium" />
										Các đánh giá sân của bạn
									</Typography>

									<TableContainer
										component={Paper}
										sx={{
											boxShadow: 'none',
											backgroundColor: theme.palette.background.paper,
											borderRadius: 2,
											border: `1px solid ${theme.palette.divider}`,
											maxHeight: 'calc(100vh - 200px)',
											overflow: 'auto'
										}}
									>
										<Table sx={{ minWidth: 650 }} stickyHeader>
											<TableHead>
												<TableRow>
													<TableCell sx={{
														fontWeight: 600,
														color: theme.palette.text.primary,
														bgcolor: theme.palette.background.paper,
													}}>Sân cầu</TableCell>
													<TableCell sx={{
														fontWeight: 600,
														color: theme.palette.text.primary,
														bgcolor: theme.palette.background.paper,
													}}>Đánh giá</TableCell>
													<TableCell sx={{
														fontWeight: 600,
														color: theme.palette.text.primary,
														bgcolor: theme.palette.background.paper,
													}}>Ngày đánh giá</TableCell>
													<TableCell sx={{
														fontWeight: 600,
														color: theme.palette.text.primary,
														bgcolor: theme.palette.background.paper,
													}}>Hành động</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{reviews?.length === 0 ? (
													<TableRow>
														<TableCell colSpan={4} align="center" sx={{
															py: 4,
															color: theme.palette.text.secondary
														}}>
															Bạn chưa có đánh giá nào
														</TableCell>
													</TableRow>
												) : (
													reviews?.map((review) => (
														<TableRow
															key={review.id}
															sx={{
																'&:hover': {
																	backgroundColor: theme.palette.action.hover
																},
																transition: 'background-color 0.2s',
															}}
														>
															<TableCell sx={{ color: theme.palette.text.primary }}>
																{review.branchName}
															</TableCell>
															<TableCell>
																<Box display="flex" alignItems="center" gap={1}>
																	{Array.from({ length: 5 }).map((_, i) => (
																		<Typography
																			key={i}
																			component="span"
																			sx={{
																				color: i < review.ratingLevel ? '#facc15' : theme.palette.text.secondary,
																				fontSize: '1.2rem',
																			}}
																		>
																			★
																		</Typography>
																	))}
																</Box>
																<Typography
																	variant="body2"
																	sx={{
																		mt: 0.5,
																		color: theme.palette.text.secondary,
																		maxWidth: '300px',
																		whiteSpace: 'nowrap',
																		overflow: 'hidden',
																		textOverflow: 'ellipsis',
																	}}
																	dangerouslySetInnerHTML={{
																		__html: DOMPurify.sanitize(review.content.substring(0, 50)),
																	}}
																/>
															</TableCell>
															<TableCell sx={{ color: theme.palette.text.primary }}>
																{dayjs(review.createAt).format('DD/MM/YYYY')}
															</TableCell>
															<TableCell>
																<IconButton
																	onClick={() => handleViewReview(review)}
																	sx={{
																		color: theme.palette.primary.main,
																		'&:hover': {
																			color: theme.palette.primary.light,
																			bgcolor: theme.palette.action.hover,
																		},
																	}}
																>
																	<EditIcon />
																</IconButton>
															</TableCell>
														</TableRow>
													))
												)}
											</TableBody>
										</Table>
									</TableContainer>
								</CardContent>
							)}
						</Container>
						{openReviewModal && (
							<ReviewModal
								open={openReviewModal}
								onClose={() => setOpenReviewModal(false)}
								branch={selectedBranchInfo}
								theme={theme}
								review={selectedReview}
								player={profile}
								onReviewSubmitted={handleUpdateReview}
							/>
						)}
					</>
				);

			default:
				return null;
		}
	};

	const drawer = (
		<List sx={{ bgcolor: theme.palette.background.paper, width: '100%' }}>
			<DrawerItem
				icon={<PersonIcon fontSize="small" />}
				label="Thông tin cá nhân"
				tabKey="profile"
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				isMobile={isMobile}
				setMobileOpen={setMobileOpen}
				theme={theme}
			/>
			<DrawerItem
				icon={<LockIcon fontSize="small" />}
				label="Quyền riêng tư và bảo mật"
				tabKey="privacy"
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				isMobile={isMobile}
				setMobileOpen={setMobileOpen}
				theme={theme}
			/>
			<DrawerItem
				icon={<EventIcon fontSize="small" />}
				label="Lịch đặt sân"
				tabKey="reservations"
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				isMobile={isMobile}
				setMobileOpen={setMobileOpen}
				theme={theme}
			/>
			<DrawerItem
				icon={<RateReviewIcon fontSize="small" />}
				label="Đánh giá của tôi"
				tabKey="reviews"
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				isMobile={isMobile}
				setMobileOpen={setMobileOpen}
				theme={theme}
			/>
		</List>
	);

	return (
		<UserLayout>
			<Container maxWidth="lg" sx={{ py: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
				{isMobile && (
					<Button
						variant="outlined"
						color="primary"
						onClick={handleDrawerToggle}
						startIcon={<MenuIcon />}
						sx={{
							mb: 2,
							alignSelf: 'flex-start',
							borderRadius: 2,
							boxShadow: theme.palette.mode === 'dark'
								? '0 2px 8px rgba(96, 172, 242, 0.2)'
								: 2,
							borderColor: theme.palette.divider,
							color: theme.palette.text.primary,
							'&:hover': {
								borderColor: theme.palette.primary.main,
								bgcolor: theme.palette.action.hover,
							}
						}}
					>
						Menu
					</Button>
				)}

				<Drawer
					variant="temporary"
					open={mobileOpen}
					onClose={handleDrawerToggle}
					ModalProps={{
						keepMounted: true,
					}}
					sx={{
						display: { xs: 'block', md: 'none' },
						'& .MuiDrawer-paper': {
							boxSizing: 'border-box',
							width: 250,
							boxShadow: theme.palette.mode === 'dark'
								? '0px 3px 15px rgba(96, 172, 242, 0.2)'
								: '0px 3px 15px rgba(0,0,0,0.1)',
							borderRight: `1px solid ${theme.palette.divider}`,
							bgcolor: theme.palette.background.paper,
						},
					}}
				>
					{drawer}
				</Drawer>

				<Box
					sx={{
						flexShrink: 0,
						display: { xs: 'none', md: 'block' },
						overflow: 'auto'
					}}
				>
					{drawer}
				</Box>

				<Box
					sx={{
						flexGrow: 1,
						overflow: 'hidden'
					}}
				>
					{renderContent()}
				</Box>
			</Container>
		</UserLayout>
	);
}

export default ProfilePage;
