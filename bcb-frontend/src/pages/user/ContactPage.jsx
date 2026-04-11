import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
	Box,
	Button,
	TextField,
	Container,
	Typography,
	Grid,
	IconButton,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import UserLayout from '../../layouts/user/UserLayout';
import StyledContactModal from '../../components/modal/StyledContactModal';
import ownerService from '../../services/ownerService';

import theme from '../../theme/Theme';


const ContactPage = () => {
	const [open, setOpen] = useState(false);
	const [showInput, setShowInput] = useState(false);
	const [ownerData, setOwnerData] = useState({ id: '', phoneNumber: '', ownerName: '', email: '' });
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');

	const handleClick = () => {
		setShowInput((prev) => !prev);
		setError('');
	};

	const handleInputChange = (e) => {
		setOwnerData({ ...ownerData, [e.target.name]: e.target.value });
		setError('');
	};

	const handleSearch = async () => {
		const phoneNumber = ownerData.phoneNumber.trim();

		if (!phoneNumber) {
			setError('Vui lòng nhập số điện thoại');
			return;
		}

		if (!/^[0-9]{10}$/.test(phoneNumber)) {
			setError('Số điện thoại không hợp lệ (cần 10 chữ số)');
			return;
		}

		setIsLoading(true);
		try {
			const ownerResponse = await ownerService.getOwnerByPhoneNumber(phoneNumber);
			if (ownerResponse.data) {
				setOwnerData({
					id: ownerResponse.data.id,
					phoneNumber: ownerResponse.data.phoneNumber || phoneNumber,
					ownerName: ownerResponse.data.ownerName,
					email: ownerResponse.data.email
				});
			}
			handleOpenModal();
		} catch (error) {
			if (error.response?.status === 404) {
				setOwnerData({
					id: '',
					phoneNumber,
					ownerName: '',
					email: ''
				});
				handleOpenModal();
				return;
			}

			setError('Không thể kiểm tra số điện thoại. Vui lòng thử lại.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyDown = async (event) => {
		if (event.key === 'Enter') {
			handleSearch();
		}
	};

	const handleOpenModal = () => setOpen(true);
	const handleCloseModal = () => setOpen(false);

	return (
		<UserLayout>
			<Box
				sx={{
					position: 'relative',
					height: '100vh',
					display: 'flex',
					alignItems: 'center',
					overflow: 'hidden',
					// background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(34, 211, 238, 0.8))'
				}}
			>
				<Box
					sx={{
						position: "absolute",
						inset: 0,
						zIndex: 0,
						backgroundImage:
							'url("https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80")',
						backgroundSize: "cover",
						backgroundPosition: "center",
						opacity: 0.4,
					}}
				/>
				<Box className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent backdrop-blur-sm"></Box>

				<Box
					sx={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						zIndex: 0,
						opacity: 0.25,
						backgroundImage: 'url("https://images.unsplash.com/photo-1613922421835-b9e4c704ee8e?auto=format&fit=crop&w=1600&q=80")',
						backgroundSize: 'cover',
						backgroundPosition: 'center',
						filter: 'blur(2px)'
					}}
				/>

				<Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
					<Grid container spacing={4} alignItems="center">
						<Grid size={{ xs: 12, md: 6 }}>
							<motion.div
								initial={{ opacity: 0, y: 50 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8 }}
							>
								<Typography
									variant="h1"
									component="h1"
									sx={{
										fontSize: { xs: '3rem', md: '4rem', lg: '5rem' },
										fontWeight: 800,
										color: 'white',
										textShadow: '0px 2px 4px rgba(0,0,0,0.2)',
										mb: 2,
										letterSpacing: '-0.5px'
									}}
								>
									BcB
								</Typography>

								<Typography
									variant="h2"
									sx={{
										fontSize: { xs: '1.5rem', md: '2rem' },
										fontWeight: 700,
										color: 'white',
										textShadow: '0px 2px 4px rgba(0,0,0,0.2)',
										mb: 3
									}}
								>
									Badminton court Booking
								</Typography>

								<Typography
									variant="h5"
									sx={{
										fontSize: { xs: '1rem', md: '1.2rem' },
										fontWeight: 400,
										color: 'white',
										mb: 5,
										maxWidth: '600px'
									}}
								>
									Hệ thống đặt sân cầu lông hiện đại giúp kết nối người chơi và chủ sân trên toàn quốc.
									Liên hệ hợp tác để cùng nhau phát triển cộng đồng cầu lông.
								</Typography>

								<Box sx={{ position: 'relative' }}>
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.6, delay: 0.4 }}
									>
										<Button
											onClick={handleClick}
											variant="contained"
											size="large"
											sx={{
												borderRadius: '50px',
												backgroundColor: 'white',
												color: '#3b82f6',
												boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
												padding: '12px 32px',
												fontWeight: 600,
												transition: 'all 0.3s ease',
												'&:hover': {
													backgroundColor: 'rgba(255, 255, 255, 0.9)',
													transform: 'translateY(-3px)',
													boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)'
												}
											}}
										>
											Liên hệ ngay
										</Button>
									</motion.div>

									<AnimatePresence>
										{showInput && (
											<motion.div
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: 20 }}
												transition={{ duration: 0.3 }}
												style={{
													marginTop: '16px',
													display: 'flex',
													alignItems: 'center',
													maxWidth: '400px'
												}}
											>
												<TextField
													fullWidth
													placeholder="Nhập số điện thoại của bạn"
													variant="outlined"
													type="tel"
													name="phoneNumber"
													value={ownerData.phoneNumber}
													onChange={handleInputChange}
													onKeyDown={handleKeyDown}
													error={!!error}
													helperText={error}
													disabled={isLoading}
													sx={{
														backgroundColor: 'rgba(255, 255, 255, 0.95)',
														borderRadius: '30px',
														'& .MuiOutlinedInput-root': {
															borderRadius: '30px',
															'& fieldset': {
																borderColor: 'transparent'
															},
															'&:hover fieldset': {
																borderColor: 'transparent'
															},
															'&.Mui-focused fieldset': {
																borderColor: '#3b82f6'
															}
														}
													}}
													InputProps={{
														endAdornment: (
															<IconButton
																onClick={handleSearch}
																disabled={isLoading}
																sx={{
																	backgroundColor: '#3b82f6',
																	color: 'white',
																	'&:hover': {
																		backgroundColor: '#2563eb'
																	},
																	width: 36,
																	height: 36
																}}
															>
																<ArrowForwardIcon />
															</IconButton>
														)
													}}
												/>
											</motion.div>
										)}
									</AnimatePresence>
								</Box>
							</motion.div>
						</Grid>

						<Grid size={{ xs: 12, md: 6 }} sx={{ display: { xs: 'none', md: 'block' } }}>
							<motion.div
								initial={{ opacity: 0, x: 50 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.8, delay: 0.2 }}
							>
								<Box
									component="img"
									src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80"
									alt="Badminton Court"
									sx={{
										width: '100%',
										maxHeight: '500px',
										objectFit: 'cover',
										borderRadius: '20px',
										boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
									}}
								/>
							</motion.div>
						</Grid>
					</Grid>
				</Container>
			</Box>

			<StyledContactModal open={open} handleClose={handleCloseModal} ownerData={ownerData} theme={theme} />
		</UserLayout>
	);
};

export default ContactPage;
