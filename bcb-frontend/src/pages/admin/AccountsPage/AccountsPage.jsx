import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    Grid,
    Stack,
    Chip,
    TextField,
    MenuItem,
    InputAdornment,
    Avatar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
} from '@mui/material';
import {
    Search as SearchIcon,
    ManageAccounts as ManageAccountsIcon,
} from '@mui/icons-material';

import adminTheme from '../../../theme/adminTheme';
import adminService from '../../../services/adminService';
import { stringToColor } from '../../../utils/stringToColor';

const ROLE_OPTIONS = [
    { value: 'all', label: 'Tất cả vai trò' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'USER', label: 'User' },
];

const STATUS_OPTIONS = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Đang hoạt động' },
    { value: 'inactive', label: 'Tạm khóa' },
];

const AccountsPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchValue, setSearchValue] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                setLoading(true);
                const response = await adminService.getAllAccounts();
                setAccounts(response);
                setError(null);
            } catch (fetchError) {
                console.error('Failed to fetch accounts:', fetchError);
                setError('Không thể tải danh sách tài khoản. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();
    }, []);

    const filteredAccounts = accounts.filter((account) => {
        const normalizedSearch = searchValue.trim().toLowerCase();
        const matchesSearch =
            !normalizedSearch ||
            account.username?.toLowerCase().includes(normalizedSearch) ||
            account.phoneNumber?.toLowerCase().includes(normalizedSearch) ||
            account.id?.toLowerCase().includes(normalizedSearch);

        const matchesRole = roleFilter === 'all' || account.role === roleFilter;
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && account.isActivated) ||
            (statusFilter === 'inactive' && !account.isActivated);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const adminCount = accounts.filter((account) => account.role === 'ADMIN').length;
    const managerCount = accounts.filter((account) => account.role === 'MANAGER').length;
    const userCount = accounts.filter((account) => account.role === 'USER').length;

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: 320,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h4"
                    gutterBottom
                    sx={{
                        fontWeight: 'bold',
                        color: adminTheme.palette.primary.main
                    }}
                >
                    Các tài khoản trên hệ thông
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Xem và lọc nhanh toàn bộ tài khoản đang có trong hệ thống
                </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={1} sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Avatar sx={{ bgcolor: adminTheme.palette.primary.main }}>
                                    <ManageAccountsIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Tổng tài khoản
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                        {accounts.length}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card elevation={1} sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap">
                                <Chip label={`Admin: ${adminCount}`} color="primary" variant="outlined" />
                                <Chip label={`Manager: ${managerCount}`} color="secondary" variant="outlined" />
                                <Chip label={`User: ${userCount}`} variant="outlined" />
                                <Chip
                                    label={`Hoạt động: ${accounts.filter((account) => account.isActivated).length}`}
                                    color="success"
                                    variant="outlined"
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Card elevation={1} sx={{ borderRadius: 3, mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, lg: 6 }}>
                            <TextField
                                fullWidth
                                value={searchValue}
                                onChange={(event) => setSearchValue(event.target.value)}
                                placeholder="Tìm theo username, ID hoặc số điện thoại"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                            <TextField
                                select
                                fullWidth
                                value={roleFilter}
                                onChange={(event) => setRoleFilter(event.target.value)}
                                label="Vai trò"
                            >
                                {ROLE_OPTIONS.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                            <TextField
                                select
                                fullWidth
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                label="Trạng thái"
                            >
                                {STATUS_OPTIONS.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: adminTheme.palette.grey[100] }}>
                            <TableCell sx={{ fontWeight: 700 }}>Tài khoản</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Vai trò</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Số điện thoại</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Trạng thái</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>Mã tài khoản</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAccounts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                    <Typography color="text.secondary">
                                        Không có tài khoản nào khớp với bộ lọc hiện tại.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAccounts.map((account) => (
                                <TableRow key={account.id} hover>
                                    <TableCell>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            {account.imagePath ? (
                                                <Avatar
                                                    src={`${import.meta.env.VITE_API_URL}/${account.imagePath}`}
                                                    alt={account.username}
                                                />
                                            ) : (
                                                <Avatar sx={{ bgcolor: stringToColor(account.username) }}>
                                                    {account.username.charAt(0).toUpperCase()}
                                                </Avatar>
                                            )}
                                            <Box>
                                                <Typography sx={{ fontWeight: 600 }}>
                                                    {account.username}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {account.phoneNumber || 'Chưa cập nhật số điện thoại'}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={account.role}
                                            color={
                                                account.role === 'ADMIN'
                                                    ? 'primary'
                                                    : account.role === 'MANAGER'
                                                        ? 'secondary'
                                                        : 'default'
                                            }
                                            size="small"
                                            variant={account.role === 'USER' ? 'outlined' : 'filled'}
                                        />
                                    </TableCell>
                                    <TableCell>{account.phoneNumber || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={account.isActivated ? 'Hoạt động' : 'Tạm khóa'}
                                            color={account.isActivated ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontFamily: 'monospace',
                                                color: adminTheme.palette.text.secondary,
                                            }}
                                        >
                                            {account.id}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default AccountsPage;
