import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
	Container,
	Box,
	Typography,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Chip,
	Avatar,
	Divider,
	CircularProgress,
	Alert,
	IconButton,
	Collapse,
	Stack,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	FormControl,
	InputLabel,
	OutlinedInput,
	InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
	ExpandMore as ExpandMoreIcon,
	ExpandLess as ExpandLessIcon,
	Email as EmailIcon,
	Phone as PhoneIcon,
	Business as BusinessIcon,
	Person as PersonIcon
} from '@mui/icons-material';

import adminTheme from '../../../theme/adminTheme';

import { useSnackbar } from '../../../../context/SnackbarContext';

import ownerService from '../../../services/ownerService';

import StatusCell from './StatusCell';
import ActionButton from './ActionButton';
import branchService from '../../../services/branchServce';
import partnershipRequestService from '../../../services/partnershipRequestService';

const getRequestTime = (request) => {
	const time = new Date(request.createAt).getTime();
	return Number.isNaN(time) ? 0 : time;
};

const sortOwnersByLatestRequest = (owners) => {
	return [...owners]
		.map((owner) => ({
			...owner,
			partnershipRequest: [...(owner.partnershipRequest || [])].sort(
				(a, b) => getRequestTime(b) - getRequestTime(a)
			),
		}))
		.sort((a, b) => {
			const latestA = a.partnershipRequest[0] ? getRequestTime(a.partnershipRequest[0]) : 0;
			const latestB = b.partnershipRequest[0] ? getRequestTime(b.partnershipRequest[0]) : 0;
			return latestB - latestA;
		});
};


const PartnershipRequestPage = () => {
	const navigate = useNavigate();
	const { showSnackbar } = useSnackbar();
	const [owners, setOwners] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [expandedOwners, setExpandedOwners] = useState({});
	const [refreshFlag, setRefreshFlag] = useState(false);
	const [openAcceptRequestModal, setOpenAcceptRequestModal] = useState(false);
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [formData, setFormData] = useState({
		username: '',
		phoneNumber: '',
		password: '',
		showPassword: false
	});


	useEffect(() => {
		fetchAllOwners();
	}, [refreshFlag]);

	useEffect(() => {
		const refreshWhenVisible = () => {
			if (document.visibilityState === 'visible') {
				fetchAllOwners();
			}
		};

		window.addEventListener('focus', refreshWhenVisible);
		document.addEventListener('visibilitychange', refreshWhenVisible);

		return () => {
			window.removeEventListener('focus', refreshWhenVisible);
			document.removeEventListener('visibilitychange', refreshWhenVisible);
		};
	}, []);

	const fetchAllOwners = async () => {
		try {
			setLoading(true);
			const response = await ownerService.getAllOwner();
			const sortedOwners = sortOwnersByLatestRequest(response);
			setOwners(sortedOwners);

			const initialExpandedState = {};
			sortedOwners.forEach(owner => {
				initialExpandedState[owner.id] = true;
			});
			setExpandedOwners(initialExpandedState);

			setError(null);
		} catch (error) {
			console.error('Failed to fetch owners:', error);
			setError('Không thể tải dữ liệu chủ sở hữu. Vui lòng thử lại sau.');
			setOwners([]);
		} finally {
			setLoading(false);
		}
	};

	// console.log('owner: ', owners);

	const handleCloseModal = () => {
		setOpenAcceptRequestModal(false);
		setSelectedRequest(null);
	};

	const handleChange = (prop) => (event) => {
		setFormData({ ...formData, [prop]: event.target.value });
	};

	const handleClickShowPassword = () => {
		setFormData({ ...formData, showPassword: !formData.showPassword });
	};

	const handleMouseDownPassword = (event) => {
		event.preventDefault();
	};

	const generateUsername = (branchName) => {
		const cleanName = branchName.toLowerCase().replace(/\s+/g, '');
		return `${cleanName}_${Math.floor(1000 + Math.random() * 9000)}`;
	};

	const generatePassword = () => {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let password = '';
		for (let i = 0; i < 10; i++) {
			password += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return password;
	};

	const changeStatus = async (requestId, status) => {
		try {
			await partnershipRequestService.updateStatus(requestId, { status });
			setRefreshFlag(flag => !flag);
			showSnackbar('Cập nhật trạng thái thành công', 'success');
		} catch (error) {
			console.error('Failed to update status:', error);
			showSnackbar('Cập nhật trạng thái thất bại', 'error');
		}
	};

	const handleApprove = (requestId) => {
		changeStatus(requestId, 'pending');
	};

	const handleCancel = (requestId) => {
		changeStatus(requestId, 'refused');
	};

	const handleAccept = (request) => {
		setSelectedRequest(request);
		setFormData({
			username: generateUsername(request.branchName),
			phoneNumber: request.phoneNumber,
			password: generatePassword(),
			showPassword: false
		});
		setOpenAcceptRequestModal(true);
	};

	const handleViewDetail = async (requestId) => {
		const res = await branchService.getBranchByPartnershipRequest(requestId);
		navigate(`/admin/branches/${res.id}`);
	};

	const handleAcceptRequest = async () => {
		try {

			const requestData = {
				branchName: selectedRequest.branchName,
				email: '',
				address: selectedRequest.address,
				accountRequest: {
					username: formData.username,
					password: formData.password,
					phoneNumber: formData.phoneNumber,
				},
				partnershipRequestId: selectedRequest.id,
			}

			const res = await branchService.createBranch(requestData);

			console.log('respone data: ', res);
			console.log('Accepting request:', { requestData });

			showSnackbar('Chấp nhận hợp tác thành công', 'success');
			setRefreshFlag(flag => !flag);
			handleCloseModal();

			navigate(`/admin/branches/${res.id}`);

		} catch (error) {
			console.error('Error accepting request:', error);
		}
	};

	const toggleOwnerExpansion = (ownerId) => {
		setExpandedOwners(prev => ({
			...prev,
			[ownerId]: !prev[ownerId]
		}));
	};

	const toggleAllOwners = (expand) => {
		const newExpandedState = {};
		owners.forEach(owner => {
			newExpandedState[owner.id] = expand;
		});
		setExpandedOwners(newExpandedState);
	};

	if (loading) {
		return (
			<Box sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				height: '300px'
			}}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error" sx={{ mb: 3 }}>
					{error}
				</Alert>
			</Box>
		);
	}

	return (
		<Container maxWidth="xl" sx={{ py: 3 }}>
			<Box sx={{ mb: 4 }}>
				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
				>
					<Typography
						variant="h4"
						gutterBottom
						sx={{
							fontWeight: 'bold',
							color: adminTheme.palette.primary.main
						}}
					>
						Quản lý Chủ sở hữu
					</Typography>
					{owners.length > 0 && (
						<Stack direction="row" spacing={1}>
							<Chip
								label="Thu gọn tất cả"
								onClick={() => toggleAllOwners(false)}
								variant="outlined"
								size="small"
							/>
							<Chip
								label="Mở rộng tất cả"
								onClick={() => toggleAllOwners(true)}
								variant="outlined"
								size="small"
							/>
						</Stack>
					)}
				</Stack>
				<Typography variant="body1" color="text.secondary">
					Danh sách các chủ sở hữu và yêu cầu hợp tác của họ
				</Typography>
			</Box>



			{owners.length === 0 ? (
				<Paper sx={{ p: 3, textAlign: 'center' }}>
					<Typography variant="body1" color="text.secondary">
						Không có dữ liệu chủ sở hữu
					</Typography>
				</Paper>
			) : (
				owners.map((owner) => (
					<Paper
						key={owner.id}
						sx={{
							mb: 2,
							borderRadius: 2,
							overflow: 'hidden',
							boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
							'&:hover': {
								boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
							}
						}}
					>
						<Box
							sx={{
								p: 2,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								cursor: 'pointer',
								backgroundColor: expandedOwners[owner.id] ? 'background.paper' : 'background.default',
								'&:hover': {
									backgroundColor: 'action.hover'
								}
							}}
							onClick={() => toggleOwnerExpansion(owner.id)}
						>
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<Avatar sx={{
									bgcolor: 'primary.main',
									mr: 2,
									width: 40,
									height: 40
								}}>
									<PersonIcon fontSize="small" />
								</Avatar>
								<Box>
									<Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
										{owner.ownerName}
									</Typography>
									<Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
										<Typography variant="body2" sx={{
											display: 'flex',
											alignItems: 'center',
											color: 'text.secondary'
										}}>
											<EmailIcon fontSize="small" sx={{ mr: 0.5 }} />
											{owner.email}
										</Typography>
										<Typography variant="body2" sx={{
											display: 'flex',
											alignItems: 'center',
											color: 'text.secondary'
										}}>
											<PhoneIcon fontSize="small" sx={{ mr: 0.5 }} />
											{owner.phoneNumber}
										</Typography>
									</Stack>
								</Box>
							</Box>

							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<Chip
									label={`${owner.partnershipRequest?.length || 0} yêu cầu`}
									color="secondary"
									size="small"
									sx={{ mr: 2 }}
								/>
								<IconButton size="small">
									{expandedOwners[owner.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
								</IconButton>
							</Box>
						</Box>

						<Collapse in={expandedOwners[owner.id]}>
							<Divider />

							<Box sx={{ p: 2 }}>
								<Typography variant="subtitle2" sx={{
									mb: 2,
									fontWeight: 500,
									color: 'text.secondary',
									textTransform: 'uppercase',
									letterSpacing: '0.5px'
								}}>
									Yêu cầu hợp tác
								</Typography>

								{owner.partnershipRequest?.length > 0 ? (
									<TableContainer component={Paper} variant="outlined">
										<Table size="small">
											<TableHead>

												<TableRow sx={{ bgcolor: 'background.default' }}>
													<TableCell sx={{ fontWeight: 500, width: '13%' }}>Ngày tạo</TableCell>
													<TableCell sx={{ fontWeight: 500, width: '15%' }}>Chi nhánh</TableCell>
													<TableCell sx={{ fontWeight: 500, width: '35%' }}>Địa chỉ</TableCell>
													<TableCell sx={{ fontWeight: 500, width: '10%' }}>Điện thoại</TableCell>
													<TableCell sx={{ fontWeight: 500, width: '10%' }}>Trạng thái</TableCell>
													<TableCell sx={{ fontWeight: 500, width: '20%' }}>Action</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{owner.partnershipRequest.map((request) => (
													<TableRow key={request.id} hover>
														<TableCell>
															{new Date(request.createAt).toLocaleDateString('vi-VN', {
																day: '2-digit',
																month: '2-digit',
																year: 'numeric',
																hour: '2-digit',
																minute: '2-digit'
															})}
														</TableCell>
														<TableCell>
															<Box sx={{ display: 'flex', alignItems: 'center' }}>
																<BusinessIcon color="action" sx={{ mr: 1, fontSize: '16px' }} />
																{request.branchName}
															</Box>
														</TableCell>
														<TableCell>{request.address}</TableCell>
														<TableCell>{request.phoneNumber}</TableCell>
														<StatusCell status={request.status} />
														<TableCell>
															<ActionButton
																status={request.status}
																onApprove={() => handleApprove(request.id)}
																onAccept={() => handleAccept(request)}
																onViewDetail={() => handleViewDetail(request.id)}
																onCancel={() => handleCancel(request.id)}
															/>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								) : (
									<Typography variant="body2" sx={{
										p: 2,
										textAlign: 'center',
										color: 'text.secondary',
										fontStyle: 'italic'
									}}>
										Không có yêu cầu hợp tác nào
									</Typography>
								)}
							</Box>
						</Collapse>
					</Paper>
				))
			)}

			<Dialog
				open={openAcceptRequestModal}
				onClose={handleCloseModal}
				fullWidth
				maxWidth="sm"
				disableEnforceFocus
				slotProps={{
					paper: {
						sx: {
							borderRadius: 3,
						}
					}
				}}
			>
				<DialogTitle>Tạo tài khoản cho chi nhánh</DialogTitle>
				<DialogContent>
					<Box sx={{ mt: 2 }}>
						<TextField
							fullWidth
							label="Tên chi nhánh"
							value={selectedRequest?.branchName || ''}
							margin="normal"
							disabled
						/>

						<TextField
							fullWidth
							label="Username"
							value={formData.username}
							onChange={handleChange('username')}
							margin="normal"
						/>

						<TextField
							fullWidth
							label="Số điện thoại"
							value={formData.phoneNumber}
							onChange={handleChange('phoneNumber')}
							margin="normal"
						/>

						<FormControl fullWidth margin="normal" variant="outlined">
							<InputLabel htmlFor="outlined-adornment-password">Mật khẩu</InputLabel>
							<OutlinedInput
								id="outlined-adornment-password"
								type={formData.showPassword ? 'text' : 'password'}
								value={formData.password}
								onChange={handleChange('password')}
								endAdornment={
									<InputAdornment position="end">
										<IconButton
											aria-label="toggle password visibility"
											onClick={handleClickShowPassword}
											onMouseDown={handleMouseDownPassword}
											edge="end"
										>
											{formData.showPassword ? <VisibilityOff /> : <Visibility />}
										</IconButton>
									</InputAdornment>
								}
								label="Mật khẩu"
							/>
						</FormControl>
					</Box>
				</DialogContent>
				<DialogActions sx={{ p: 3 }}>
					<Button onClick={handleCloseModal} variant="outlined">
						Hủy bỏ
					</Button>
					<Button
						onClick={handleAcceptRequest}
						variant="contained"
						color="primary"
					>
						Xác nhận
					</Button>
				</DialogActions>
			</Dialog>
		</Container>
	);
};

export default PartnershipRequestPage;
