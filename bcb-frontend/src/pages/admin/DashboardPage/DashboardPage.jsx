import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Alert,
    Avatar,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Stack,
    Divider,
    Grid,
} from '@mui/material';
import {
    AccountCircle as AccountCircleIcon,
    Storefront as StorefrontIcon,
    Handshake as HandshakeIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

import adminTheme from '../../../theme/adminTheme';
import branchService from '../../../services/branchServce';
import partnershipRequestService from '../../../services/partnershipRequestService';
import adminService from '../../../services/adminService';
import { stringToColor } from '../../../utils/stringToColor';

const STATUS_LABELS = {
    approved: 'Đã duyệt',
    pending: 'Đang chờ',
    refused: 'Từ chối',
};

const DashboardMetricCard = ({ title, value, subtitle, icon, color = 'primary.main' }) => (
    <Card
        elevation={1}
        sx={{
            borderRadius: 3,
            height: '100%',
            border: `1px solid ${adminTheme.palette.divider}`,
        }}
    >
        <CardContent sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color }}>
                        {value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {subtitle}
                    </Typography>
                </Box>
                <Box
                    sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 2,
                        display: 'grid',
                        placeItems: 'center',
                        color: adminTheme.palette.common.white,
                        background: `linear-gradient(135deg, ${adminTheme.palette.primary.main}, ${adminTheme.palette.primary.dark})`,
                    }}
                >
                    {icon}
                </Box>
            </Stack>
        </CardContent>
    </Card>
);

const getRequestStatusCounts = (requests) => {
    return requests.reduce(
        (accumulator, request) => {
            const status = request.status?.toLowerCase() || 'pending';
            if (status in accumulator) {
                accumulator[status] += 1;
            }
            return accumulator;
        },
        { approved: 0, pending: 0, refused: 0 }
    );
};

const DashboardPage = () => {
    const [accounts, setAccounts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [accountsResponse, branchesResponse, requestsResponse] = await Promise.all([
                    adminService.getAllAccounts(),
                    branchService.getAllBranches('all'),
                    partnershipRequestService.getAllPartnershipRequest(),
                ]);

                setAccounts(accountsResponse);
                setBranches(branchesResponse);
                setRequests(requestsResponse);
                setError(null);
            } catch (fetchError) {
                console.error('Failed to fetch admin dashboard data:', fetchError);
                setError('Không thể tải dữ liệu tổng quan. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const activeBranches = branches.filter((branch) => branch.isCooperated);
    const activeAccounts = accounts.filter((account) => account.isActivated);
    const adminCount = accounts.filter((account) => account.role === 'ADMIN').length;
    const managerCount = accounts.filter((account) => account.role === 'MANAGER').length;
    const userCount = accounts.filter((account) => account.role === 'USER').length;
    const requestStatusCounts = getRequestStatusCounts(requests);

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
                    Tổng quan quản lý
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Theo dõi nhanh tài khoản, chi nhánh và yêu cầu hợp tác của hệ thống
                </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                    <DashboardMetricCard
                        title="Tổng tài khoản"
                        value={accounts.length}
                        subtitle={`${activeAccounts.length} tài khoản đang hoạt động`}
                        icon={<AccountCircleIcon />}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                    <DashboardMetricCard
                        title="Chi nhánh"
                        value={branches.length}
                        subtitle={`${activeBranches.length} chi nhánh đang hợp tác`}
                        icon={<StorefrontIcon />}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                    <DashboardMetricCard
                        title="Yêu cầu hợp tác"
                        value={requests.length}
                        subtitle={`${requestStatusCounts.pending} yêu cầu đang chờ xử lý`}
                        icon={<HandshakeIcon />}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
                    <DashboardMetricCard
                        title="Phê duyệt thành công"
                        value={requestStatusCounts.approved}
                        subtitle={`${branches.length - activeBranches.length} chi nhánh đang ngưng hợp tác`}
                        icon={<CheckCircleIcon />}
                        color="success.main"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 5 }}>
                    <Card elevation={1} sx={{ borderRadius: 3, height: '100%' }}>
                        <CardContent sx={{ p: 3.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                Phân bố tài khoản
                            </Typography>
                            <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ mb: 3 }}>
                                <Chip label={`Admin: ${adminCount}`} color="primary" variant="outlined" />
                                <Chip label={`Manager: ${managerCount}`} color="secondary" variant="outlined" />
                                <Chip label={`User: ${userCount}`} color="default" variant="outlined" />
                                <Chip
                                    label={`Đang hoạt động: ${activeAccounts.length}`}
                                    color="success"
                                    variant="outlined"
                                />
                            </Stack>

                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                Trạng thái yêu cầu hợp tác
                            </Typography>
                            <Stack spacing={1.5}>
                                {Object.entries(requestStatusCounts).map(([status, count]) => (
                                    <Box
                                        key={status}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            p: 1.5,
                                            borderRadius: 2,
                                            bgcolor: adminTheme.palette.grey[50],
                                        }}
                                    >
                                        <Typography sx={{ fontWeight: 500 }}>
                                            {STATUS_LABELS[status]}
                                        </Typography>
                                        <Chip
                                            label={count}
                                            color={status === 'approved' ? 'success' : status === 'refused' ? 'error' : 'warning'}
                                            size="small"
                                        />
                                    </Box>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, lg: 7 }}>
                    <Card elevation={1} sx={{ borderRadius: 3, mb: 3 }}>
                        <CardContent sx={{ p: 3.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                Tài khoản hệ thống
                            </Typography>

                            {accounts.length === 0 ? (
                                <Alert severity="info">Chưa có tài khoản nào trong hệ thống.</Alert>
                            ) : (
                                <List disablePadding>
                                    {accounts.slice(0, 5).map((account, index) => (
                                        <Box key={account.id}>
                                            <ListItem disableGutters sx={{ py: 1.25 }}>
                                                <ListItemAvatar>
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
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={account.username}
                                                    secondary={`Role: ${account.role} • ${account.phoneNumber || 'Chưa có số điện thoại'}`}
                                                />
                                                <Chip
                                                    label={account.isActivated ? 'Hoạt động' : 'Tạm khóa'}
                                                    color={account.isActivated ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </ListItem>
                                            {index < Math.min(accounts.length, 5) - 1 && <Divider />}
                                        </Box>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>

                    <Card elevation={1} sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 3.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                                Chi nhánh đang hợp tác
                            </Typography>

                            {activeBranches.length === 0 ? (
                                <Alert severity="info">Hiện chưa có chi nhánh nào đang hợp tác.</Alert>
                            ) : (
                                <Stack spacing={1.5}>
                                    {activeBranches.slice(0, 4).map((branch) => (
                                        <Box
                                            key={branch.id}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                border: `1px solid ${adminTheme.palette.divider}`,
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: 600 }}>{branch.branchName}</Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                {branch.address || 'Chưa cập nhật địa chỉ'}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default DashboardPage;
