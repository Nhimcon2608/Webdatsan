import React, { useState, useMemo, useCallback } from "react";
import {
	Box,
	CssBaseline,
	Toolbar,
	IconButton,
	createTheme,
	ThemeProvider,
	useMediaQuery,
	Fab,
	Zoom,
	useScrollTrigger,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp"; // Icon quay lại đầu trang
import Sidebar from "../manager/Sidebar";
import Topbar from "../manager/Topbar";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const drawerWidth = 240;
const collapsedWidth = 80;

// === THIẾT KẾ THEME ===
const getDesignTokens = (mode) => ({
	palette: {
		mode,
		primary: { main: mode === "dark" ? "#4fc3a1" : "#1a3c34", contrastText: "#ffffff" },
		background: {
			default: mode === "dark" ? "#121212" : "#f4f6f8",
			paper: mode === "dark" ? "#1e1e1e" : "#ffffff",
		},
		text: {
			primary: mode === "dark" ? "#ffffff" : "#1a3c34",
			secondary: mode === "dark" ? "#b0b0b0" : "#555555",
		},
		divider: mode === "dark" ? "#333" : "rgba(0,0,0,0.12)",
	},
	components: {
		MuiCssBaseline: {
			styleOverrides: { body: { transition: "all 0.3s ease" } },
		},
		MuiPaper: {
			styleOverrides: { root: { transition: "all 0.3s ease" } },
		},
		MuiDrawer: {
			styleOverrides: {
				paper: {
					transition: "width 0.3s ease",
				},
			},
		},
	},
});

// Component nút quay lại đầu trang
function ScrollTop({ children }) {
	const trigger = useScrollTrigger({
		disableHysteresis: true,
		threshold: 300, // Hiện nút khi cuộn xuống 300px
	});

	const handleClick = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	return (
		<Zoom in={trigger}>
			<Box
				onClick={handleClick}
				role="presentation"
				sx={{
					position: "fixed",
					bottom: { xs: 16, sm: 24 },
					right: { xs: 16, sm: 24 },
					zIndex: 1300,
				}}
			>
				{children}
			</Box>
		</Zoom>
	);
}

const ManagerLayout = () => {
	const { user } = useAuth();

	// === QUẢN LÝ THEME ===
	const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
	const [mode, setMode] = useState(() => {
		const saved = localStorage.getItem("themeMode");
		return saved || (prefersDarkMode ? "dark" : "light");
	});

	const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

	const toggleTheme = useCallback(() => {
		const newMode = mode === "light" ? "dark" : "light";
		setMode(newMode);
		localStorage.setItem("themeMode", newMode);
	}, [mode]);

	// === QUẢN LÝ SIDEBAR ===
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const toggleSidebar = useCallback(() => {
		setIsSidebarCollapsed((prev) => !prev);
	}, []);

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<Box sx={{ display: "flex", minHeight: "100vh" }}>
				{/* Sidebar */}
				<Sidebar
					user={user}
					theme={theme}
					toggleTheme={toggleTheme}
					isCollapsed={isSidebarCollapsed}
					onToggleCollapse={toggleSidebar}
				/>

				{/* Nội dung chính */}
				<Box
					sx={{
						flexGrow: 1,
						display: "flex",
						flexDirection: "column",
						width: isSidebarCollapsed
							? `calc(100% - ${collapsedWidth}px)`
							: `calc(100% - ${drawerWidth}px)`,
						transition: "width 0.3s ease",
					}}
				>
					{/* Topbar */}
					<Topbar
						user={user}
						toggleSidebar={toggleSidebar}
						isSidebarCollapsed={isSidebarCollapsed}
					>
						<IconButton onClick={toggleTheme} color="inherit">
							{mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
						</IconButton>
					</Topbar>

					{/* Nội dung trang */}
					<Box
						component="main"
						sx={{
							flexGrow: 1,
							p: { xs: 2, md: 3 },
							bgcolor: "background.default",
							color: "text.primary",
							transition: "all 0.3s ease",
							minHeight: "100vh",
						}}
					>
						<Outlet />
					</Box>
				</Box>

				{/* NÚT QUAY LẠI ĐẦU TRANG - SIÊU ĐẸP & MƯỢT */}
				<ScrollTop>
					<Fab
						size="medium"
						aria-label="quay lại đầu trang"
						color="primary"
						sx={{
							boxShadow: "0 8px 25px rgba(16, 185, 129, 0.4)",
							"&:hover": {
								backgroundColor: mode === "dark" ? "#4ade80" : "#16a34a",
								transform: "translateY(-4px)",
								boxShadow: "0 12px 30px rgba(16, 185, 129, 0.6)",
							},
							transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
						}}
					>
						<KeyboardArrowUpIcon sx={{ fontSize: 28 }} />
					</Fab>
				</ScrollTop>
			</Box>
		</ThemeProvider>
	);
};

export default ManagerLayout;
