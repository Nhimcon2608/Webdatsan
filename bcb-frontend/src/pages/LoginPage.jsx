import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, styled } from '@mui/material';

import UserLayout from '../layouts/user/UserLayout';
import authService from '../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';

import LoginModal from '../components/modal/LoginModal';
//Hoan thien Login Page UI 

const LoginWrapper = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${theme.palette.background.default} 30%, ${theme.palette.primary.light}20 100%)`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    '&:before': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '200px',
        background: `radial-gradient(circle at 50% 100%, ${theme.palette.primary.main}10 0%, transparent 70%)`,
        opacity: 0.3,
    },
}));

const LoginPage = () => {
    const { login, user } = useAuth();
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            redirectUserBasedOnRole(user.role);
        }
    }, [user]);

    const redirectUserBasedOnRole = (role) => {
        switch (role) {
            case 'ADMIN':
                navigate('/admin/dashboard');
                break;
            case 'MANAGER':
                navigate('/manager/dashboard');
                break;
            default:
                navigate('/');
        }
    };

    const handleLoginSuccess = async (response) => {
        localStorage.setItem('authToken', response.token);
        const userLogged = await login();
        redirectUserBasedOnRole(userLogged.role);
    };

    const handleRegisterSuccess = () => {
        showSnackbar('Đăng ký thành công', 'success');
        navigate('/');
    };

    return (
        <UserLayout>
            <LoginWrapper>
                <LoginModal
                    authService={authService}
                    onLoginSuccess={handleLoginSuccess}
                    onRegisterSuccess={handleRegisterSuccess}
                    defaultTab="login"
                    showTabs={true}
                />
            </LoginWrapper>
        </UserLayout>
    );
};

export default LoginPage;