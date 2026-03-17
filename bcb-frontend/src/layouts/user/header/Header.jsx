import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
	AppBar,
	Toolbar,
	Typography,
	Button,
	IconButton,
	Drawer,
	List,
	ListItem,
	ListItemText,
	Box,
	Avatar,
	Container,
	ListItemIcon,
	Tooltip,
	Fade,
	Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import MenuIcon from '@mui/icons-material/Menu';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ContactSupportRoundedIcon from '@mui/icons-material/ContactSupportRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CloseIcon from '@mui/icons-material/Close';

// Icon Dark/Light Mode
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import { CircleFadingPlus } from 'lucide-react';

import authService from '../../../services/authService';
import { useAuth } from '../../../../context/AuthContext';
import BadmintonIcon from '../../../components/common/BadmintonIcon';

const Header = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { user, logout } = useAuth();
	const theme = useTheme();

	const [mobileOpen, setMobileOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 20);
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

	const handleLogout = async () => {
		try {
			await authService.logout();
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			await logout();
			navigate('/login');
		}
	};

	const handleProfileNavigation = () => {
		if (!user) {
			navigate('/login');
			return;
		}

		switch (user.role) {
			case 'ADMIN':
				navigate('/admin/dashboard');
				return;
			case 'MANAGER':
				navigate('/manager/dashboard');
				return;
			default:
				navigate('/profile');
		}
	};

	const profileTooltipTitle = user?.role === 'USER' ? 'Hồ sơ' : 'Tài khoản';

	const isActive = (path) => location.pathname === path;

	const menuItems = [
		{ text: 'Trang chủ', href: '/', icon: <HomeRoundedIcon /> },
		{ text: 'Tìm sân', href: '/badminton-branchs', icon: <BadmintonIcon /> },
		{ text: 'Vãng lai', href: '/temporary-recruitment', icon: <CircleFadingPlus size={20} /> },
		{ text: 'Liên hệ', href: '/contact', icon: <ContactSupportRoundedIcon /> },
	];

	const drawerContent = (
		<Box
			sx={{
				width: 280,
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				p: 2
			}}
		>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					<img
						src="/images/logo.png"
						alt="Logo"
						style={{ width: 32, height: 32, marginRight: 8 }}
					/>
					<Typography
						variant="h6"
						sx={{
							fontWeight: 'bold',
							background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
						}}
					>
						BcB
					</Typography>
				</Box>
				<IconButton onClick={handleDrawerToggle} edge="end">
					<CloseIcon />
				</IconButton>
			</Box>

			<Divider sx={{ mb: 2 }} />

			<List>
				{menuItems.map((item) => (
					<ListItem
						button
						key={item.text}

						onClick={() => {
							navigate(item.href);
							handleDrawerToggle();
						}}
						sx={{
							borderRadius: theme.shape.borderRadius,
							mb: 1,
							backgroundColor: isActive(item.href) ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
							color: isActive(item.href) ? theme.palette.primary.main : theme.palette.text.primary,
							'&:hover': {
								backgroundColor: 'rgba(59, 130, 246, 0.12)',
								color: theme.palette.primary.main,
							},
							transition: 'all 0.3s ease',
							cursor: 'pointer'
						}}
					>
						<ListItemIcon sx={{
							color: isActive(item.href) ? theme.palette.primary.main : theme.palette.text.secondary,
							minWidth: 40,
						}}>
							{item.icon}
						</ListItemIcon>
						<ListItemText
							primary={item.text}
							primaryTypographyProps={{
								fontWeight: isActive(item.href) ? 600 : 500,
							}}
						/>
					</ListItem>
				))}
			</List>

			<Box sx={{ mt: 'auto' }}>
				{user && (
					<Box sx={{
						display: 'flex',
						alignItems: 'center',
						p: 2,
						borderRadius: theme.shape.borderRadius,
						backgroundColor: 'rgba(59, 130, 246, 0.05)',
						mb: 2
					}}>
						{user.imagePath ? (
							<Avatar
								src={`${import.meta.env.VITE_API_URL}/${user.imagePath}`}
								alt={user.username}
								sx={{ width: 40, height: 40 }}
							/>
						) : (
							<Avatar sx={{ width: 40, height: 40, bgcolor: theme.palette.primary.main }}>
								{user.username?.charAt(0).toUpperCase()}
							</Avatar>
						)}
						<Box sx={{ ml: 2 }}>
							<Typography variant="subtitle2" fontWeight={600}>
								{user.username}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{user.email || 'User'}
							</Typography>
						</Box>
					</Box>
				)}

				<Button
					fullWidth
					variant={user ? "outlined" : "contained"}
					startIcon={user ? <LogoutRoundedIcon /> : <AccountCircleIcon />}
					onClick={user ? handleLogout : () => navigate('/login')}
					sx={{
						py: 1,
						borderRadius: theme.shape.borderRadius,
						textTransform: 'none',
						fontWeight: 600,
					}}
				>
					{user ? 'Đăng xuất' : 'Đăng nhập'}
				</Button>
			</Box>
		</Box>
	);

	return (
		<AppBar
			position="sticky"
			elevation={scrolled ? 4 : 0}
			sx={{
				bgcolor: scrolled
					? 'background.paper'
					: 'background.default',
				backdropFilter: 'blur(12px)',
				background: theme.palette.mode === 'dark'
					? 'rgba(15, 23, 42, 0.92)'
					: 'rgba(255, 255, 255, 0.85)',
				borderBottom: `1px solid ${theme.palette.divider}`,
				transition: 'all 0.4s ease',
			}}
		>
			<Container maxWidth="lg">
				<Toolbar disableGutters sx={{ py: { xs: 1.5, md: 2 }, justifyContent: 'space-between' }}>

					{/* Logo */}
					<Box
						onClick={() => navigate('/')}
						sx={{
							display: 'flex',
							alignItems: 'center',
							cursor: 'pointer',
							transition: '0.2s',
							'&:hover': { transform: 'scale(1.05)' }
						}}
					>
						<img src="/images/logo.png" alt="Logo" style={{ width: 40, height: 40, marginRight: 10 }} />
						<Typography
							variant="h5"
							sx={{
								fontWeight: 'bold',
								background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
							}}
						>
							BcB
						</Typography>
					</Box>

					{/* Menu Desktop */}
					<Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
						{menuItems.map((item) => (
							<Button
								key={item.text}
								startIcon={item.icon}
								onClick={() => navigate(item.href)}
								sx={{
									color: isActive(item.href) ? 'primary.main' : 'text.primary',
									fontWeight: 600,
									textTransform: 'none',
									borderRadius: 2,
									px: 2.5,
									py: 1,
									backgroundColor: isActive(item.href) ? 'rgba(59,130,246,0.1)' : 'transparent',
									'&:hover': {
										backgroundColor: 'rgba(59,130,246,0.15)',
										color: 'primary.main',
										transform: 'translateY(-2px)',
									},
									transition: 'all 0.3s ease',
								}}
							>
								{item.text}
							</Button>
						))}
					</Box>

					{/* Right Side: Theme Toggle + User + Mobile Menu */}
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>

						{/* NÚT CHUYỂN DARK/LIGHT MODE - ĐẸP NHẤT 2025 */}
						<Tooltip
							title={window.__isDarkMode ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
							arrow
							TransitionComponent={Fade}
						>
							<IconButton
								onClick={() => window.__toggleDarkMode?.()}
								sx={{
									width: 44,
									height: 44,
									bgcolor: window.__isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
									color: 'primary.main',
									backdropFilter: 'blur(10px)',
									boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
									'&:hover': {
										bgcolor: window.__isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(59,130,246,0.15)',
										transform: 'rotate(30deg) scale(1.12)',
									},
									transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
								}}
							>
								{window.__isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
							</IconButton>
						</Tooltip>

						{/* User Avatar / Login */}
						{user ? (
							<>
								<Tooltip title={profileTooltipTitle} arrow TransitionComponent={Fade}>
									<IconButton onClick={handleProfileNavigation}>
										{user.imagePath ? (
											<Avatar
												src={`${import.meta.env.VITE_API_URL}/${user.imagePath}`}
												sx={{ width: 40, height: 40, border: `2px solid ${theme.palette.primary.main}` }}
											/>
										) : (
											<Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
												{user.username?.[0]?.toUpperCase()}
											</Avatar>
										)}
									</IconButton>
								</Tooltip>

								<Tooltip title="Đăng xuất" arrow TransitionComponent={Fade}>
									<IconButton
										onClick={handleLogout}
										sx={{ display: { xs: 'none', sm: 'flex' }, color: 'text.secondary' }}
									>
										<LogoutRoundedIcon />
									</IconButton>
								</Tooltip>
							</>
						) : (
							<Button
								variant="contained"
								startIcon={<AccountCircleIcon />}
								onClick={() => navigate('/login')}
								sx={{
									display: { xs: 'none', sm: 'flex' },
									textTransform: 'none',
									fontWeight: 600,
									background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
									boxShadow: '0 4px 15px rgba(59,130,246,0.35)',
									'&:hover': { boxShadow: '0 6px 20px rgba(59,130,246,0.45)', transform: 'translateY(-2px)' },
								}}
							>
								Đăng nhập
							</Button>
						)}

						{/* Mobile Menu Button */}
						<IconButton
							onClick={handleDrawerToggle}
							sx={{
								display: { xs: 'flex', md: 'none' },
								color: 'text.primary',
							}}
						>
							<MenuIcon />
						</IconButton>
					</Box>
				</Toolbar>
			</Container>

			<Drawer
				anchor="right"
				open={mobileOpen}
				onClose={handleDrawerToggle}
				PaperProps={{
					sx: {
						borderRadius: '16px 0 0 16px',
						boxShadow: '-5px 0 25px rgba(0, 0, 0, 0.05)'
					},
				}}
			>
				{drawerContent}
			</Drawer>
		</AppBar>
	);
};

export default Header;
