import React, { useState } from 'react';

import {
	Box,
	Typography,
	Grid,
	Link,
	Divider,
	IconButton,
	TextField,
	Button,
	Container,
	useMediaQuery
} from '@mui/material';
import {
	Facebook,
	Instagram,
	Twitter,
	LinkedIn,
	Email,
	Phone,
	LocationOn,
	Send
} from '@mui/icons-material';
import { Stack, styled, useTheme } from '@mui/system';

const FooterContainer = styled(Box)(({ theme }) => ({
	background: 'linear-gradient(135deg, #444444 0%, #333333 100%)',
	color: '#ffffff',
	padding: '5rem 0 2rem',
	boxShadow: '0 -5px 20px rgba(0, 0, 0, 0.05)',
	position: 'relative',
	'&::before': {
		content: '""',
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: '4px',
		background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
	},
}));

const SocialIcon = styled(IconButton)(({ theme }) => ({
	color: '#ffffff',
	backgroundColor: 'rgba(255, 255, 255, 0.1)',
	padding: '12px',
	margin: '0 8px',
	borderRadius: '12px',
	transition: 'all 0.3s ease',
	'&:hover': {
		transform: 'translateY(-5px)',
		backgroundColor: theme.palette.primary.main,
		boxShadow: '0 10px 15px rgba(59, 130, 246, 0.3)',
	},
}));

const FooterLink = styled(Link)(({ theme }) => ({
	color: '#d1d5db',
	textDecoration: 'none',
	fontWeight: 500,
	padding: '5px 0',
	transition: 'all 0.3s ease',
	display: 'inline-block',
	'&:hover': {
		color: theme.palette.primary.light,
		transform: 'translateX(5px)',
	},
}));

const GradientText = styled(Typography)(({ theme }) => ({
	background: `linear-gradient(135deg, ${theme.palette.primary.main} 20%, ${theme.palette.primary.light} 80%)`,
	WebkitBackgroundClip: 'text',
	WebkitTextFillColor: 'transparent',
	backgroundClip: 'text',
	textFillColor: 'transparent',
	fontWeight: 700,
}));

const InfoBox = styled(Box)(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	marginBottom: '16px',
	transition: 'transform 0.3s ease',
	'&:hover': {
		transform: 'translateX(5px)',
	},
}));

const AnimatedDivider = styled(Divider)(({ theme }) => ({
	backgroundColor: 'rgba(255, 255, 255, 0.1)',
	margin: '3rem 0',
	position: 'relative',
	'&::after': {
		content: '""',
		position: 'absolute',
		top: 0,
		left: '50%',
		transform: 'translateX(-50%)',
		width: '80px',
		height: '3px',
		background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
	},
}));

const Footer = () => {
	const theme = useTheme();
	const [email, setEmail] = useState('');
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));

	const handleEmailChange = (e) => {
		setEmail(e.target.value);
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		// Handle the newsletter subscription
		console.log('Subscribed email:', email);
		setEmail('');
	};

	return (
		<FooterContainer>
			<Container maxWidth="lg">
				<Grid container spacing={4} justifyContent="space-between">

					<Grid size={{ xs: 12, md: 4 }} sx={{ mb: { xs: 4, md: 0 } }}>
						<Stack >
							<GradientText variant="h5" sx={{ mb: 1, fontSize: '2rem', letterSpacing: '0.5px' }}>
								BcB
							</GradientText>
							<GradientText variant="h4" sx={{ mb: 3, fontSize: '1rem', letterSpacing: '0.5px' }}>
								Badminton Court Booking
							</GradientText>
						</Stack>

						<Typography variant="body2" sx={{ mb: 4, color: '#d1d5db', lineHeight: 1.8 }}>
							Nơi kết nối cộng đồng yêu cầu lông với những trải nghiệm tuyệt vời nhất.
							Đặt sân dễ dàng, thanh toán nhanh chóng, và tận hưởng niềm vui chơi cầu lông.
						</Typography>

						<Box sx={{ mb: 4 }}>
							<InfoBox>
								<LocationOn sx={{ mr: 2, color: theme.palette.primary.light }} />
								<Typography variant="body2" sx={{ color: '#d1d5db' }}>
									Badminton Court Booking Hutech
								</Typography>
							</InfoBox>

							<InfoBox>
								<Phone sx={{ mr: 2, color: theme.palette.primary.light }} />
								<Typography variant="body2" sx={{ color: '#d1d5db' }}>
									0971 202 857
								</Typography>
							</InfoBox>
							<InfoBox>
								<Phone sx={{ mr: 2, color: theme.palette.primary.light }} />
								<Typography variant="body2" sx={{ color: '#d1d5db' }}>
									0354 491 594
								</Typography>
							</InfoBox>

							<InfoBox>
								<Email sx={{ mr: 2, color: theme.palette.primary.light }} />
								<Typography variant="body2" sx={{ color: '#d1d5db' }}>
									BookingBadmintonCourt@gmail.com
								</Typography>
							</InfoBox>
						</Box>
					</Grid>

					<Grid size={{ xs: 12, md: 3 }}>
						<Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#ffffff' }}>
							Liên kết nhanh
						</Typography>

						<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
							{['Trang chủ', 'Về chúng tôi', 'Dịch vụ', 'Đặt sân', 'Liên hệ'].map((item) => (
								<FooterLink href="#" key={item}>
									{item}
								</FooterLink>
							))}
						</Box>
					</Grid>

					<Grid size={{ xs: 12, md: 4 }}>
						<Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#ffffff' }}>
							Nhận tin khuyến mãi
						</Typography>

						<Typography variant="body2" sx={{ mb: 3, color: '#d1d5db' }}>
							Đăng ký để nhận thông tin ưu đãi và sự kiện mới nhất từ chúng tôi.
						</Typography>

						<Box
							component="form"
							onSubmit={handleSubmit}
							sx={{
								display: 'flex',
								mb: 4,
								position: 'relative',
								boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)'
							}}
						>
							<TextField
								placeholder="Email của bạn"
								type="email"
								value={email}
								onChange={handleEmailChange}
								fullWidth
								required
								InputProps={{
									sx: {
										borderRadius: '10px',
										backgroundColor: 'rgba(255, 255, 255, 0.05)',
										color: '#ffffff',
										'& input': {
											padding: '15px 20px',
											color: '#ffffff',
											'&::placeholder': {
												color: 'rgba(255, 255, 255, 0.5)',
												opacity: 1,
											},
										},
										'& fieldset': {
											borderColor: 'rgba(255, 255, 255, 0.2)',
										},
										'&:hover fieldset': {
											borderColor: theme.palette.primary.light,
										},
										'&.Mui-focused fieldset': {
											borderColor: theme.palette.primary.main,
										},
									}
								}}
							/>

							<Button
								type="submit"
								sx={{
									position: 'absolute',
									right: '8px',
									top: '50%',
									transform: 'translateY(-50%)',
									minWidth: 'auto',
									width: '40px',
									height: '40px',
									borderRadius: '8px',
									background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
									color: '#ffffff',
									transition: 'all 0.3s ease',
									'&:hover': {
										transform: 'translateY(-50%) scale(1.05)',
										boxShadow: '0 5px 15px rgba(59, 130, 246, 0.4)',
									},
								}}
							>
								<Send fontSize="small" />
							</Button>
						</Box>

						<Typography variant="subtitle2" sx={{ mb: 2, color: '#ffffff' }}>
							Kết nối với chúng tôi
						</Typography>

						<Box sx={{ display: 'flex' }}>
							{[
								{ icon: <Facebook fontSize="small" />, label: 'Facebook' },
								{ icon: <Instagram fontSize="small" />, label: 'Instagram' },
								{ icon: <Twitter fontSize="small" />, label: 'Twitter' },
								{ icon: <LinkedIn fontSize="small" />, label: 'LinkedIn' }
							].map((social, index) => (
								<SocialIcon key={index} aria-label={social.label}>
									{social.icon}
								</SocialIcon>
							))}
						</Box>
					</Grid>
				</Grid>

				<AnimatedDivider />

				<Box
					sx={{
						display: 'flex',
						flexDirection: { xs: 'column', md: 'row' },
						justifyContent: 'space-between',
						alignItems: { xs: 'center', md: 'center' },
						textAlign: { xs: 'center', md: 'left' },
					}}
				>
					<Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: { xs: 2, md: 0 } }}>
						© {new Date().getFullYear()} BcB by QTQT
					</Typography>

					<Box sx={{ display: 'flex', gap: { xs: 2, md: 4 } }}>
						{['Điều khoản', 'Bảo mật', 'FAQ'].map((item) => (
							<FooterLink href="#" key={item} sx={{ fontWeight: 400, fontSize: '0.875rem' }}>
								{item}
							</FooterLink>
						))}
					</Box>
				</Box>
			</Container>
		</FooterContainer>
	);
};

export default Footer;