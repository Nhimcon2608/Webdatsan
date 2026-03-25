import React, { createContext, useState, useContext, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { registerSnackbar } from '../src/services/snackbarBridge.js';

const SnackbarContext = createContext();

export const useSnackbar = () => useContext(SnackbarContext);

export const SnackbarProvider = ({ children }) => {
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });

    const showSnackbar = (message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    // Register showSnackbar so api.jsx (outside React tree) can call it
    useEffect(() => {
        registerSnackbar(showSnackbar);
    }, []);

    const handleClose = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    return (
        <SnackbarContext.Provider value={{ showSnackbar }}>
            {children}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center'
                }}
            >
                <Alert
                    onClose={handleClose}
                    severity={snackbar.severity}
                    sx={{
                        minWidth: 200,
                        maxWidth: 400,
                        borderRadius: 1,
                        boxShadow: 1,
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        '& .MuiAlert-message': {
                            padding: '4px 0'
                        }
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
};