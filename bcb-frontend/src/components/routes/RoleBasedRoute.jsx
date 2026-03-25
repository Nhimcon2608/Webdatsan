import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const RoleBasedRoute = ({ children, role }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (user.role !== role) {
        return <Navigate to="/" />;
    }

    return children;
};

export default RoleBasedRoute;
