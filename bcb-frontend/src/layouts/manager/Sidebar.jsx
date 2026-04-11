import React, { useMemo } from "react";
import {
	Drawer,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Toolbar,
	Typography,
	Divider,
	Box,
	Avatar,
	Stack,
	IconButton,
	Tooltip,
} from "@mui/material";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useAuth } from "../../../context/AuthContext";

const drawerWidth = 240;
const collapsedWidth = 80;

const menuItems = [
	{ text: "Tổng quan", icon: <HomeIcon />, path: "/manager/dashboard", badge: 0 },
	{ text: "Chi nhánh", icon: <StorefrontIcon />, path: "/manager/branchs", badge: 0 },
	{ text: "Quản lí sân", icon: <SportsTennisIcon />, path: "/manager/courts", badge: 0 },
	{ text: "Lịch đặt", icon: <CalendarMonthIcon />, path: "/manager/bookings", badge: 3 },
	{ text: "Voucher", icon: <ConfirmationNumberIcon />, path: "/manager/vouchers", badge: 0 },
	{ text: "Hóa đơn", icon: <AttachMoneyIcon />, path: "/manager/invoices", badge: 2 },
];

const Sidebar = ({ user, theme, toggleTheme, isCollapsed: parentCollapsed, onToggleCollapse }) => {
	const location = useLocation();
	const navigate = useNavigate();
	const { logout } = useAuth();
	const displayName = user?.username || user?.name || "Manager";
	const displayRole = user?.role || "MANAGER";
	const avatarSrc = user?.imagePath ? `${import.meta.env.VITE_API_URL}/${user.imagePath}` : "";
	const avatarInitial = displayName.charAt(0).toUpperCase();

	const isCollapsed = parentCollapsed;
	const toggleCollapse = onToggleCollapse;

	const handleLogout = async () => {
		try {
			await logout();
			navigate("/login");
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	const memoizedMenuItems = useMemo(() => menuItems, []);

	return (
		<Drawer
			variant="permanent"
			sx={{
				width: isCollapsed ? collapsedWidth : drawerWidth,
				flexShrink: 0,
				"& .MuiDrawer-paper": {
					width: isCollapsed ? collapsedWidth : drawerWidth,
					boxSizing: "border-box",
					bgcolor: "background.paper",
					borderRight: 1,
					borderColor: "divider",
					overflowX: "hidden",
					transition: "width 0.3s ease", // fallback an toàn
				},
			}}
		>
			{/* HEADER */}
			<Toolbar sx={{ justifyContent: isCollapsed ? "center" : "space-between", px: 2 }}>
				{!isCollapsed && (
					<Typography variant="h6" fontWeight="bold" color="text.primary">
						Manager Menu
					</Typography>
				)}
				<IconButton onClick={toggleCollapse}>
					{isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
				</IconButton>
			</Toolbar>

			{/* USER INFO */}
			{!isCollapsed && (
				<Box sx={{ px: 2, py: 1 }}>
					<Stack direction="row" spacing={2} alignItems="center">
						<Avatar
							alt={displayName}
							src={avatarSrc}
							sx={{
								bgcolor: "primary.main",
								color: "primary.contrastText",
								transition: "transform 0.2s",
								"&:hover": { transform: "scale(1.1)" },
							}}
						>
							{!avatarSrc && avatarInitial}
						</Avatar>
						<Box>
							<Typography variant="subtitle1" fontWeight="600" color="text.primary">
								{displayName}
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
								{displayRole}
							</Typography>
						</Box>
					</Stack>
				</Box>
			)}

			<Divider sx={{ my: 1 }} />

			{/* MENU ITEMS */}
			<List sx={{ flexGrow: 1 }}>
				{memoizedMenuItems.map(({ text, icon, path }) => {
					const selected = location.pathname === path;
					return (
						<Tooltip key={path} title={isCollapsed ? text : ""} placement="right">
							<ListItemButton
								component={NavLink}
								to={path}
								selected={selected}
								sx={{
									mb: 0.5,
									mx: isCollapsed ? 1 : 2,
									borderRadius: 1,
									transition: "all 0.2s ease",
									"&.Mui-selected": {
										bgcolor: "primary.main",
										color: "primary.contrastText",
										"& .MuiListItemIcon-root, & .MuiListItemText-primary": {
											color: "primary.contrastText",
										},
										"&:hover": {
											bgcolor: "primary.dark",
										},
									},
									"&:hover": {
										bgcolor: "action.hover",
										transform: "translateX(4px)",
									},
								}}
							>
								<ListItemIcon
									sx={{
										color: selected ? "primary.contrastText" : "text.primary",
										minWidth: isCollapsed ? 40 : 56,
									}}
								>
									{icon}
								</ListItemIcon>
								{!isCollapsed && (
									<ListItemText
										primary={text}
										primaryTypographyProps={{
											fontWeight: selected ? 600 : 400,
											color: selected ? "primary.contrastText" : "text.primary",
										}}
									/>
								)}
							</ListItemButton>
						</Tooltip>
					);
				})}

				<Divider sx={{ my: 2 }} />

				{/* TÀI KHOẢN */}
				<Tooltip title={isCollapsed ? "Tài khoản" : ""} placement="right">
					<ListItemButton
						component={NavLink}
						to="/manager/account"
						selected={location.pathname === "/manager/account"}
						sx={{
							mb: 0.5,
							mx: isCollapsed ? 1 : 2,
							borderRadius: 1,
							transition: "all 0.2s ease",
							"&.Mui-selected": {
								bgcolor: "primary.main",
								color: "primary.contrastText",
								"& .MuiListItemIcon-root, & .MuiListItemText-primary": {
									color: "primary.contrastText",
								},
								"&:hover": {
									bgcolor: "primary.dark",
								},
							},
							"&:hover": {
								bgcolor: "action.hover",
								transform: "translateX(4px)",
							},
						}}
					>
						<ListItemIcon
							sx={{
								color: location.pathname === "/manager/account" ? "primary.contrastText" : "text.primary",
								minWidth: isCollapsed ? 40 : 56,
							}}
						>
							<SettingsIcon />
						</ListItemIcon>
						{!isCollapsed && (
							<ListItemText
								primary="Tài khoản"
								primaryTypographyProps={{
									fontWeight: location.pathname === "/manager/account" ? 600 : 400,
									color: location.pathname === "/manager/account" ? "primary.contrastText" : "text.primary",
								}}
							/>
						)}
					</ListItemButton>
				</Tooltip>
			</List>

			<Divider />

			{/* DARK MODE + LOGOUT */}
			<Box sx={{ p: 1 }}>
				{/* Nút chuyển theme */}
				<Tooltip
					title={isCollapsed ? (theme?.palette?.mode === "dark" ? "Chế độ sáng" : "Chế độ tối") : ""}
					placement="right"
				>
					<IconButton
						onClick={toggleTheme}
						sx={{
							width: 40,
							height: 40,
							mx: "auto",
							display: "block",
							color: "text.primary",
							transition: "all 0.3s ease",
							"&:hover": {
								bgcolor: "action.hover",
								transform: "rotate(180deg)",
							},
						}}
					>
						{theme?.palette?.mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
					</IconButton>
				</Tooltip>

				{/* Đăng xuất */}
				<Tooltip title={isCollapsed ? "Đăng xuất" : ""} placement="right">
					<ListItemButton
						onClick={handleLogout}
						sx={{
							mt: 1,
							mx: isCollapsed ? 1 : 2,
							borderRadius: 1,
							transition: "all 0.2s ease",
							"&:hover": {
								bgcolor: "error.main",
								color: "white",
								transform: "translateX(4px)",
								"& .MuiListItemIcon-root": { color: "white" },
							},
						}}
					>
						<ListItemIcon sx={{ color: "text.primary", minWidth: isCollapsed ? 40 : 56 }}>
							<LogoutIcon />
						</ListItemIcon>
						{!isCollapsed && (
							<ListItemText
								primary="Đăng xuất"
								primaryTypographyProps={{
									fontWeight: 500,
									color: "error.main",
								}}
							/>
						)}
					</ListItemButton>
				</Tooltip>
			</Box>
		</Drawer>
	);
};

export default Sidebar;
