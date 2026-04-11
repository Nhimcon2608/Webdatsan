import React, { useState, useEffect } from "react";
import {
	AppBar,
	Toolbar,
	Typography,
	Box,
	Avatar,
	Stack,
	IconButton,
	Tooltip,
	Badge,
} from "@mui/material";
import { Logout, Notifications, Menu as MenuIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const Topbar = ({ user, toggleSidebar, isSidebarCollapsed, children, theme }) => {
	const navigate = useNavigate();
	const { logout } = useAuth();
	const [currentTime, setCurrentTime] = useState(
		new Date().toLocaleString("vi-VN", {
			timeZone: "Asia/Ho_Chi_Minh",
			hour12: false,
		})
	);
	const notifications = 0;
	const ownerName = user?.username || "Chủ sân";
	const avatarSrc = user?.imagePath ? `${import.meta.env.VITE_API_URL}/${user.imagePath}` : "";

	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTime(
				new Date().toLocaleString("vi-VN", {
					timeZone: "Asia/Ho_Chi_Minh",
					hour12: false,
				})
			);
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	const handleLogout = async () => {
		await logout();
		navigate("/login");
	};

	return (
		<AppBar
			position="sticky"
			elevation={0}
			sx={{
				bgcolor: "background.paper",
				color: "text.primary",
				boxShadow: theme?.shadows?.[1] || "0 1px 3px rgba(0,0,0,0.1)",
				borderBottom: 1,
				borderColor: "divider",
				transition: "all 0.3s ease",
			}}
		>
			<Toolbar
				sx={{
					display: "flex",
					justifyContent: "space-between",
					px: { xs: 2, md: 4 },
					py: 1.5,
				}}
			>
				{/* LEFT: Menu + Avatar + Tên */}
				<Stack direction="row" spacing={2} alignItems="center">
					<IconButton
						onClick={toggleSidebar}
						sx={{
							display: {
								xs: "block",
								md: isSidebarCollapsed ? "block" : "none",
							},
						}}
					>
						<MenuIcon />
					</IconButton>

					<Avatar
						alt={ownerName}
						src={avatarSrc}
						sx={{
							bgcolor: "primary.main",
							color: "primary.contrastText",
							transition: "transform 0.2s ease",
							"&:hover": { transform: "scale(1.1)" },
						}}
					>
						{!avatarSrc && ownerName.charAt(0).toUpperCase()}
					</Avatar>

					<Box>
						<Typography variant="h6" fontWeight="600" color="text.primary">
							Xin chào, {ownerName}
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
							Quản lý sân cầu lông
						</Typography>
					</Box>
				</Stack>

				{/* RIGHT: Thời gian + Thông báo + Đăng xuất + Children (Dark Mode) */}
				<Stack direction="row" spacing={1} alignItems="center">
					<Typography
						variant="body1"
						sx={{
							color: "text.primary",
							fontWeight: "500",
							display: { xs: "none", sm: "block" },
						}}
					>
						{currentTime}
					</Typography>

					<Tooltip title="Thông báo">
						<IconButton>
							<Badge badgeContent={notifications} color="error">
								<Notifications />
							</Badge>
						</IconButton>
					</Tooltip>

					<Tooltip title="Đăng xuất">
						<IconButton onClick={handleLogout}>
							<Logout />
						</IconButton>
					</Tooltip>

					{/* Nút Dark Mode từ ManagerLayout */}
					{children}
				</Stack>
			</Toolbar>
		</AppBar>
	);
};

export default Topbar;
