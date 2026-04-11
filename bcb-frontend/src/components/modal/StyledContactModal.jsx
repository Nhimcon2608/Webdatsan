import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
	Box,
	Typography,
	Backdrop,
	TextField,
	Modal,
	Fade,
	Button,
	FormControl,
	InputLabel,
	Select,
	Paper,
	Grid,
	Divider,
	IconButton,
	InputAdornment,
} from '@mui/material';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SendIcon from '@mui/icons-material/Send';

import StyledMenuItem from '../../components/common/StyledMenuItem';
import getProvince from '../../services/getProvince';
import partnershipRequestService from '../../services/partnershipRequestService';
import ErrorModal from './ErrorModal';

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1
		}
	}
};

const itemVariants = {
	hidden: { y: 20, opacity: 0 },
	visible: {
		y: 0,
		opacity: 1,
		transition: { duration: 0.4 }
	}
};

function StyledContactModal({ open, handleClose, theme, ownerData }) {
	const navigate = useNavigate();

	useEffect(() => {
		fetchProvinces();
	}, []);

	const [ownerInput, setOwnerInput] = useState({
		id: ownerData?.id || '',
		ownerName: ownerData?.ownerName || '',
		phoneNumber: ownerData?.phoneNumber || '',
		email: ownerData?.email || '',
	});

	const [branchInput, setBranchInput] = useState({
		branchName: '',
		phoneNumber: '',
		province: '',
		district: '',
		ward: '',
		detailAddress: '',
	});

	const [addressOptions, setAddressOptions] = useState({
		provinces: [],
		districts: [],
		wards: []
	});

	const [openErrorModal, setOpenErrorModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formErrors, setFormErrors] = useState({});

	useEffect(() => {
		if (ownerData) {
			setOwnerInput({
				id: ownerData.id || '',
				ownerName: ownerData.ownerName || '',
				phoneNumber: ownerData.phoneNumber || '',
				email: ownerData.email || '',
			});
		}
	}, [ownerData]);

	const handleOpenErrorModal = () => {
		setOpenErrorModal(true);
	};

	const handleCloseErrorModal = () => {
		setOpenErrorModal(false);
	};

	const fetchProvinces = async () => {
		try {
			const provinces = await getProvince();
			setAddressOptions(prev => ({ ...prev, provinces: provinces }));
		} catch (error) {
			console.error('Error fetching provinces:', error);
		}
	};

	const fetchDistricts = async (provinceName) => {
		const districts = addressOptions.provinces.find(p => p.name === provinceName).districts;
		setAddressOptions(prev => ({ ...prev, districts: districts }));
		setBranchInput(prev => ({ ...prev, district: '', ward: '' }));
	};

	const fetchWards = async (districtName) => {
		const wards = addressOptions.districts.find(d => d.name === districtName).wards;
		setAddressOptions(prev => ({ ...prev, wards: wards }));
		setBranchInput(prev => ({ ...prev, ward: '' }));
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setBranchInput(prev => ({ ...prev, [name]: value }));

		if (formErrors[name]) {
			setFormErrors(prev => ({ ...prev, [name]: null }));
		}

		if (name === 'province' && value) {
			fetchDistricts(value);
		} else if (name === 'district' && value) {
			fetchWards(value);
		}
	};

	const validateForm = () => {
		const errors = {};

		if (!branchInput.branchName.trim()) {
			errors.branchName = 'Vui lòng nhập tên chi nhánh';
		}


		const phoneRegex = /^[0-9]{10}$/;
		if (!phoneRegex.test(branchInput.phoneNumber)) {
			errors.phoneNumber = 'Số điện thoại không hợp lệ (cần 10 chữ số)';
		}

		if (!branchInput.province) errors.province = 'Vui lòng chọn tỉnh/thành phố';
		if (!branchInput.district) errors.district = 'Vui lòng chọn quận/huyện';
		if (!branchInput.ward) errors.ward = 'Vui lòng chọn phường/xã';
		if (!branchInput.detailAddress.trim()) errors.detailAddress = 'Vui lòng nhập địa chỉ chi tiết';

		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);

		const formData = {
			owner: ownerInput,
			partner: {
				branchName: branchInput.branchName,
				address:
					branchInput.detailAddress + ', ' +
					branchInput.ward + ', ' +
					branchInput.district + ', ' +
					branchInput.province,
				phoneNumber: branchInput.phoneNumber,
			}
		};

		try {
			await partnershipRequestService.postPartnershipRequest(formData);
			// console.log('Form data submitted:', formData);
			navigate('/contact/request-sents-successfully');
		} catch {
			handleOpenErrorModal();
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<Modal
				open={open}
				onClose={handleClose}
				closeAfterTransition
				slots={{ backdrop: Backdrop }}
				slotProps={{
					backdrop: {
						timeout: 500,
						sx: { backdropFilter: 'blur(3px)', backgroundColor: 'rgba(0, 0, 0, 0.5)' }
					},
				}}
			>
				<Fade in={open}>
					<Box sx={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						width: '90%',
						maxWidth: 1200,
						maxHeight: '90vh',
						overflowY: 'auto',
						bgcolor: 'background.default',
						boxShadow: theme.shadows[10],
						borderRadius: theme.shape.borderRadius,
						p: 0,
						'&::-webkit-scrollbar': {
							width: '8px',
						},
						'&::-webkit-scrollbar-thumb': {
							backgroundColor: theme.palette.primary.light,
							borderRadius: '4px',
						}
					}}>
						<Paper
							elevation={0}
							sx={{
								p: { xs: 2, sm: 3, md: 4 },
								backgroundColor: theme.palette.background.default,
								borderRadius: theme.shape.borderRadius,
								position: 'relative'
							}}
						>
							<IconButton
								onClick={handleClose}
								sx={{
									position: 'absolute',
									right: 16,
									top: 16,
									color: theme.palette.secondary.main,
									backgroundColor: theme.palette.background.paper,
									'&:hover': {
										backgroundColor: theme.palette.divider,
										color: theme.palette.primary.main
									},
									transition: 'all 0.2s ease'
								}}
							>
								<CloseIcon />
							</IconButton>

							<motion.div
								variants={containerVariants}
								initial="hidden"
								animate="visible"
							>
								<motion.div variants={itemVariants}>
									<Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
										<BusinessIcon sx={{ fontSize: 32, color: theme.palette.primary.main, mr: 2 }} />
										<Typography
											variant="h4"
											align="center"
											sx={{
												fontWeight: 700,
												background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
												backgroundClip: 'text',
												color: 'transparent',
												WebkitBackgroundClip: 'text'
											}}
										>
											Đăng ký chi nhánh mới
										</Typography>
									</Box>
								</motion.div>

								<form onSubmit={handleSubmit}>
									<Grid container spacing={4}>

										<Grid size={{ xs: 12, md: 6 }}>
											<motion.div variants={itemVariants}>
												<Paper
													elevation={0}
													sx={{
														p: 3,
														backgroundColor: theme.palette.background.paper,
														borderRadius: theme.shape.borderRadius,
														border: `1px solid ${theme.palette.divider}`,
														height: '100%'
													}}
												>
													<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
														<PersonIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
														<Typography variant="h6" sx={{ fontWeight: 600 }}>
															Thông Tin Chủ Sở Hữu
														</Typography>
													</Box>

													<Divider sx={{ mb: 3 }} />

													<motion.div variants={containerVariants}>
														<motion.div variants={itemVariants}>
															<TextField
																fullWidth
																label="Họ và tên chủ sân"
																name="ownerName"
																value={ownerInput.ownerName}
																onChange={(e) =>
																	setOwnerInput((prev) => ({
																		...prev, [e.target.name]: e.target.value,
																	}))
																}
																margin="normal"
																variant="outlined"
																type='text'
																required
																disabled={Boolean(ownerInput.id)}
																InputProps={{
																	startAdornment: (
																		<InputAdornment position="start">
																			<PersonIcon sx={{ color: theme.palette.primary.main }} />
																		</InputAdornment>
																	),
																}}
																sx={{
																	'& .MuiOutlinedInput-root': {
																		'&:hover fieldset': {
																			borderColor: theme.palette.primary.light,
																		},
																	},
																}}
															/>
														</motion.div>

														<motion.div variants={itemVariants}>
															<TextField
																fullWidth
																label="Số điện thoại"
																name="phoneNumber"
																value={ownerInput.phoneNumber}
																margin="normal"
																variant="outlined"
																type="tel"
																required
																disabled={true}
																InputProps={{
																	startAdornment: (
																		<InputAdornment position="start">
																			<PhoneIcon sx={{ color: theme.palette.primary.main }} />
																		</InputAdornment>
																	),
																}}
															/>
														</motion.div>

														<motion.div variants={itemVariants}>
															<TextField
																fullWidth
																label="Email"
																name="email"
																value={ownerInput.email}
																onChange={(e) =>
																	setOwnerInput((prev) => ({
																		...prev, [e.target.name]: e.target.value,
																	}))
																}
																margin="normal"
																variant="outlined"
																type="email"
																required
																disabled={Boolean(ownerInput.id)}
																InputProps={{
																	startAdornment: (
																		<InputAdornment position="start">
																			<EmailIcon sx={{ color: theme.palette.primary.main }} />
																		</InputAdornment>
																	),
																}}
															/>
														</motion.div>
													</motion.div>
												</Paper>
											</motion.div>
										</Grid>

										<Grid size={{ xs: 12, md: 6 }}>
											<motion.div variants={itemVariants}>
												<Paper
													elevation={0}
													sx={{
														p: 3,
														backgroundColor: theme.palette.background.paper,
														borderRadius: theme.shape.borderRadius,
														border: `1px solid ${theme.palette.divider}`,
														height: '100%'
													}}
												>
													<Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
														<BusinessIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
														<Typography variant="h6" sx={{ fontWeight: 600 }}>
															Thông Tin Chi Nhánh
														</Typography>
													</Box>

													<Divider sx={{ mb: 3 }} />

													<motion.div variants={containerVariants}>
														<motion.div variants={itemVariants}>
															<TextField
																fullWidth
																label="Tên chi nhánh"
																name="branchName"
																value={branchInput.branchName}
																onChange={handleChange}
																margin="normal"
																variant="outlined"
																required
																error={!!formErrors.branchName}
																helperText={formErrors.branchName}
																InputProps={{
																	startAdornment: (
																		<InputAdornment position="start">
																			<BusinessIcon sx={{ color: theme.palette.primary.main }} />
																		</InputAdornment>
																	),
																}}
															/>
														</motion.div>

														<Box sx={{ mt: 2, mb: 1 }}>
															<Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1, display: 'flex', alignItems: 'center' }}>
																<LocationOnIcon sx={{ fontSize: 18, mr: 0.5, color: theme.palette.primary.main }} />
																Địa chỉ chi nhánh
															</Typography>
														</Box>

														<motion.div variants={itemVariants}>
															<FormControl margin="normal" fullWidth error={!!formErrors.province}>
																<InputLabel>Tỉnh/Thành phố</InputLabel>
																<Select
																	name="province"
																	value={branchInput.province}
																	onChange={handleChange}
																	label="Tỉnh/Thành phố"
																	required
																>
																	{addressOptions.provinces.map((province) => (
																		<StyledMenuItem key={province.code} value={province.name}>
																			{province.name}
																		</StyledMenuItem>
																	))}
																</Select>
																{formErrors.province && (
																	<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
																		{formErrors.province}
																	</Typography>
																)}
															</FormControl>
														</motion.div>

														<motion.div variants={itemVariants}>
															<FormControl margin="normal" disabled={!branchInput.province} fullWidth error={!!formErrors.district}>
																<InputLabel>Quận/Huyện</InputLabel>
																<Select
																	name="district"
																	value={branchInput.district}
																	onChange={handleChange}
																	label="Quận/Huyện"
																	required
																>
																	{addressOptions.districts.map((district) => (
																		<StyledMenuItem key={district.code} value={district.name}>
																			{district.name}
																		</StyledMenuItem>
																	))}
																</Select>
																{formErrors.district && (
																	<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
																		{formErrors.district}
																	</Typography>
																)}
															</FormControl>
														</motion.div>

														<motion.div variants={itemVariants}>
															<FormControl margin="normal" disabled={!branchInput.district} fullWidth error={!!formErrors.ward}>
																<InputLabel>Phường/Xã</InputLabel>
																<Select
																	name="ward"
																	value={branchInput.ward}
																	onChange={handleChange}
																	label="Phường/Xã"
																	required
																>
																	{addressOptions.wards.map((ward) => (
																		<StyledMenuItem key={ward.code} value={ward.name}>
																			{ward.name}
																		</StyledMenuItem>
																	))}
																</Select>
																{formErrors.ward && (
																	<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
																		{formErrors.ward}
																	</Typography>
																)}
															</FormControl>
														</motion.div>

														<motion.div variants={itemVariants}>
															<TextField
																fullWidth
																label="Địa chỉ chi tiết"
																name="detailAddress"
																value={branchInput.detailAddress}
																onChange={handleChange}
																margin="normal"
																variant="outlined"
																placeholder="Số nhà, tên đường..."
																required
																error={!!formErrors.detailAddress}
																helperText={formErrors.detailAddress}
																InputProps={{
																	startAdornment: (
																		<InputAdornment position="start">
																			<LocationOnIcon sx={{ color: theme.palette.primary.main }} />
																		</InputAdornment>
																	),
																}}
															/>
														</motion.div>

														<motion.div variants={itemVariants}>
															<TextField
																fullWidth
																label="Số điện thoại chi nhánh"
																name="phoneNumber"
																value={branchInput.phoneNumber}
																onChange={handleChange}
																margin="normal"
																variant="outlined"
																required
																type="tel"
																error={!!formErrors.phoneNumber}
																helperText={formErrors.phoneNumber}
																InputProps={{
																	startAdornment: (
																		<InputAdornment position="start">
																			<PhoneIcon sx={{ color: theme.palette.primary.main }} />
																		</InputAdornment>
																	),
																}}
															/>
														</motion.div>
													</motion.div>
												</Paper>
											</motion.div>
										</Grid>
									</Grid>

									<motion.div variants={itemVariants}>
										<Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
											<Button
												type="submit"
												variant="contained"
												size="large"
												disabled={isSubmitting}
												startIcon={<SendIcon />}
												sx={{
													px: 6,
													py: 1.8,
													fontWeight: 700,
													borderRadius: 9999,
													background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
													transition: 'all 0.3s ease',
													boxShadow: '0px 4px 12px rgba(59, 130, 246, 0.25)',
													'&:hover': {
														transform: 'translateY(-3px)',
														boxShadow: '0px 8px 20px rgba(59, 130, 246, 0.4)',
													},
													'&:active': {
														transform: 'translateY(-1px)',
													}
												}}
											>
												{isSubmitting ? 'Đang gửi...' : 'Gửi Thông Tin'}
											</Button>
										</Box>
									</motion.div>
								</form>
							</motion.div>
						</Paper>
					</Box>
				</Fade>
			</Modal>

			<ErrorModal open={openErrorModal} handleCloseErrorModal={handleCloseErrorModal} />
		</>
	);
}

export default StyledContactModal;
