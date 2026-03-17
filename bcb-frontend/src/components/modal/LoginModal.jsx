import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Fade,
    Link,
    styled,
    Tabs,
    Tab,
    Paper,
    Dialog,
    DialogContent,
    IconButton,
    InputAdornment,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-container': {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    '& .MuiDialog-paper': {
        margin: 0,
        width: '100%',
        maxWidth: '450px',
        maxHeight: '90vh',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: theme.shadows[10],
        '&::-webkit-scrollbar': {
            display: 'none',
        },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
    },
}));

const LoginPaper = styled(Paper)(({ theme }) => ({
    padding: '40px',
    maxWidth: '450px',
    width: '100%',
    borderRadius: '16px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
    overflow: 'hidden',
    '&::-webkit-scrollbar': {
        display: 'none',
    },
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
}));


const StyledTextField = styled(TextField)(({ theme }) => ({
    marginBottom: '24px',
    '& .MuiInputBase-root': {
        borderRadius: '8px',
        transition: 'all 0.3s ease',
    },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
    },
    '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
        boxShadow: `0 0 8px ${theme.palette.primary.main}50`,
    },
}));

const StyledButton = styled(Button)(({ theme }) => ({
    borderRadius: '8px',
    padding: '12px 0',
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
    fontWeight: 600,
    textTransform: 'none',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
    },
}));

const FormContainer = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'active'
})(({ active }) => ({
    transform: active ? 'translateX(0)' : 'translateX(-100%)',
    opacity: active ? 1 : 0,
    transition: 'transform 0.5s ease, opacity 0.5s ease',
    position: active ? 'relative' : 'absolute',
    width: '100%',
}));

const LoginModal = ({
    open,
    isModal = false,
    onClose,
    authService,
    onLoginSuccess,
    onRegisterSuccess,
    showTabs = true,
    defaultTab = 'login',
    showHeader = true
}) => {
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [registerData, setRegisterData] = useState({
        username: '',
        fullName: '',
        email: '',
        password: '',
        phoneNumber: '',
        confirmPassword: ''
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [generalError, setGeneralError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
            setIsExiting(false);
        }, 500);
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue === 0 ? 'login' : 'register');
        setFieldErrors({});
        setGeneralError('');
    };

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleRegisterChange = (e) => {
        setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    };

    const validateLoginForm = () => {
        const errors = {};
        if (!loginData.username.trim()) errors.username = "Tên đăng nhập là bắt buộc";
        if (!loginData.password.trim()) errors.password = "Mật khẩu là bắt buộc";
        return errors;
    };

    const validateRegisterForm = () => {
        const errors = {};
        if (!registerData.username.trim()) errors.username = "Tên đăng nhập là bắt buộc";
        if (!registerData.fullName.trim()) errors.fullName = "Họ và tên là bắt buộc";
        if (!registerData.email.trim()) {
            errors.email = "Email là bắt buộc";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email.trim())) {
            errors.email = "Email không hợp lệ";
        }
        if (!registerData.password.trim()) errors.password = "Mật khẩu là bắt buộc";
        if (!registerData.phoneNumber.trim()) errors.phoneNumber = "Số điện thoại là bắt buộc";
        if (registerData.password !== registerData.confirmPassword) {
            errors.confirmPassword = "Mật khẩu xác nhận không khớp";
        }
        return errors;
    };

    const handleLoginSubmit = async () => {
        const errors = validateLoginForm();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setIsLoading(true);
        setFieldErrors({});
        setGeneralError('');

        try {
            const response = await authService.login({
                username: loginData.username,
                password: loginData.password,
            });

            if (onLoginSuccess) {
                onLoginSuccess(response.data);
            }
        } catch (error) {
            handleAuthError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async () => {
        const errors = validateRegisterForm();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setIsLoading(true);
        setFieldErrors({});
        setGeneralError('');

        try {
            const response = await authService.register({
                username: registerData.username,
                fullName: registerData.fullName,
                email: registerData.email,
                password: registerData.password,
                phoneNumber: registerData.phoneNumber
            });

            if (onRegisterSuccess) {
                onRegisterSuccess(response.data);
            }
        } catch (error) {
            handleAuthError(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuthError = (error) => {
        console.error('Authentication error:', error);

        if (!error?.response) {
            setGeneralError('Không thể kết nối tới máy chủ. Hãy kiểm tra backend đang chạy tại http://localhost:8080.');
            return;
        }

        if (error?.response?.data?.fieldErrors) {
            setFieldErrors(error.response.data.fieldErrors);
        } else {
            setGeneralError(error?.response?.data?.message ||
                (activeTab === 'login'
                    ? 'Đăng nhập thất bại. Vui lòng thử lại.'
                    : 'Đăng ký thất bại. Vui lòng thử lại.'));
        }
    };

    const content = (
        <LoginPaper>
            <Box>
                {showHeader && (
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                        <LockOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                    </Box>
                )}
                {showHeader && (
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {activeTab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                    </Typography>
                )}
                {showHeader && (
                    <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
                        {activeTab === 'login'
                            ? 'Vui lòng nhập thông tin tài khoản của bạn'
                            : 'Tạo tài khoản mới để bắt đầu'}
                    </Typography>
                )}

                {showTabs && (
                    <Tabs
                        value={activeTab === 'login' ? 0 : 1}
                        onChange={handleTabChange}
                        centered
                        sx={{ mb: 4 }}
                        textColor="primary"
                        indicatorColor="primary"
                    >
                        <Tab label="Đăng nhập" />
                        <Tab label="Đăng ký" />
                    </Tabs>
                )}

                {generalError && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {generalError}
                    </Typography>
                )}

                <Box sx={{ position: 'relative', minHeight: '300px' }}>
                    <FormContainer active={activeTab === 'login'}>
                        <StyledTextField
                            fullWidth
                            label="Tên đăng nhập"
                            variant="outlined"
                            type="text"
                            name="username"
                            value={loginData.username}
                            onChange={handleLoginChange}
                            required
                            error={!!fieldErrors.username}
                            helperText={fieldErrors.username || 'Nhập tên đăng nhập bạn đã tạo khi đăng ký'}
                            disabled={isLoading}
                        />
                        <StyledTextField
                            fullWidth
                            label="Mật khẩu"
                            variant="outlined"
                            type={showLoginPassword ? 'text' : 'password'}
                            name="password"
                            value={loginData.password}
                            onChange={handleLoginChange}
                            required
                            error={!!fieldErrors.password}
                            helperText={fieldErrors.password}
                            disabled={isLoading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowLoginPassword((prev) => !prev)}
                                            edge="end"
                                            tabIndex={-1}
                                        >
                                            {showLoginPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <StyledButton
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={handleLoginSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                        </StyledButton>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                            <Link href="#" variant="body2" sx={{ color: 'text.secondary' }}>
                                Quên mật khẩu?
                            </Link>
                        </Box>
                    </FormContainer>

                    <FormContainer active={activeTab === 'register'}>
                        <StyledTextField
                            fullWidth
                            label="Tên đăng nhập"
                            variant="outlined"
                            type="text"
                            name="username"
                            value={registerData.username}
                            onChange={handleRegisterChange}
                            required
                            error={!!fieldErrors.username}
                            helperText={fieldErrors.username || 'Tên dùng để đăng nhập, ví dụ: quangthien26'}
                            disabled={isLoading}
                        />
                        <StyledTextField
                            fullWidth
                            label="Họ và tên"
                            variant="outlined"
                            type="text"
                            name="fullName"
                            value={registerData.fullName}
                            onChange={handleRegisterChange}
                            required
                            error={!!fieldErrors.fullName}
                            helperText={fieldErrors.fullName}
                            disabled={isLoading}
                        />
                        <StyledTextField
                            fullWidth
                            label="Email"
                            variant="outlined"
                            type="email"
                            name="email"
                            value={registerData.email}
                            onChange={handleRegisterChange}
                            required
                            error={!!fieldErrors.email}
                            helperText={fieldErrors.email || 'Email dùng để nhận thông tin và tự điền vào hồ sơ'}
                            disabled={isLoading}
                        />
                        <StyledTextField
                            fullWidth
                            label="Số điện thoại"
                            variant="outlined"
                            type="tel"
                            name="phoneNumber"
                            value={registerData.phoneNumber}
                            onChange={handleRegisterChange}
                            required
                            error={!!fieldErrors.phoneNumber}
                            helperText={fieldErrors.phoneNumber}
                            disabled={isLoading}
                        />
                        <StyledTextField
                            fullWidth
                            label="Mật khẩu"
                            variant="outlined"
                            type={showRegisterPassword ? 'text' : 'password'}
                            name="password"
                            value={registerData.password}
                            onChange={handleRegisterChange}
                            required
                            error={!!fieldErrors.password}
                            helperText={fieldErrors.password}
                            disabled={isLoading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowRegisterPassword((prev) => !prev)}
                                            edge="end"
                                            tabIndex={-1}
                                        >
                                            {showRegisterPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <StyledTextField
                            fullWidth
                            label="Xác nhận mật khẩu"
                            variant="outlined"
                            type={showRegisterConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={registerData.confirmPassword}
                            onChange={handleRegisterChange}
                            required
                            error={!!fieldErrors.confirmPassword}
                            helperText={fieldErrors.confirmPassword}
                            disabled={isLoading}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowRegisterConfirmPassword((prev) => !prev)}
                                            edge="end"
                                            tabIndex={-1}
                                        >
                                            {showRegisterConfirmPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <StyledButton
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={handleRegisterSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
                        </StyledButton>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Bằng cách đăng ký, bạn đồng ý với{' '}
                                <Link href="#" sx={{ color: 'primary.main' }}>
                                    Điều khoản dịch vụ
                                </Link>
                            </Typography>
                        </Box>
                    </FormContainer>
                </Box>
            </Box>
        </LoginPaper>
    );

    if (isModal) {
        return (
            <StyledDialog
                open={open && !isExiting}
                onClose={handleClose}
                scroll="paper"
                disableScrollLock={false}
            >
                <DialogContent dividers sx={{ p: 0 }}>
                    <Fade in={!isExiting} timeout={300}>
                        {content}
                    </Fade>
                </DialogContent>
            </StyledDialog>
        );
    }
    return content;
};

export default LoginModal;
