import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
    Container,
    Box,
    Typography,
    Avatar,
    Chip,
    Button,
    Stack,
    Paper
} from "@mui/material";
import {
    CheckCircle,
    Cancel,
    Error as ErrorIcon,
    AccessTime
} from "@mui/icons-material";

import theme from "../../theme/Theme";

import UserLayout from "../../layouts/user/UserLayout";
import reservationService from "../../services/reservationService";
import branchService from "../../services/branchServce";
import badmintionCourtService from "../../services/badmintonCourtService";
import BookingDetail from '../../components/modal/BookingDetail';
import paymentService from "../../services/paymentService";

const PaymentResult = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const orderId = params.get("orderId");
    const resIdsParam = params.get("resIds");
    const redirectResultCode = params.get("resultCode");
    const [reservationId, setReservationId] = useState(null);
    const [status, setStatus] = useState("loading");
    const [reservationData, setReservationData] = useState({});
    const [reservationDetails, setReservationDetails] = useState([]);
    const [branchInfo, setBranchInfo] = useState({});
    const [resIds, setResIds] = useState([]);
    const [multipleReservations, setMultipleReservations] = useState([]);


    useEffect(() => {
        let isMounted = true;

        const checkPayment = async () => {
            try {
                if (!orderId) {
                    if (isMounted) setStatus("error");
                    return;
                }

                const ids = resIdsParam
                    ? resIdsParam.split(",").map(id => id.trim()).filter(Boolean)
                    : await paymentService.getResIdsByOrderId(orderId);
                if (!ids || ids.length === 0) {
                    if (isMounted) setStatus("error");
                    return;
                }

                if (!isMounted) return;

                setResIds(ids);

                if (ids.length > 1) {
                    try {
                        const promises = ids.map(id => reservationService.getReservationById(id));
                        const allReservations = await Promise.all(promises);
                        if (!isMounted) return;
                        setMultipleReservations(allReservations || []);
                    } catch (err) {
                        console.error('Error fetching multiple reservations', err);
                    }
                }

                const firstId = ids[0];
                setReservationId(firstId);

                let reservation = await reservationService.getReservationById(firstId);
                if (!isMounted) return;

                if (redirectResultCode === "0" && reservation.status === "awaiting_payment") {
                    for (let attempt = 0; attempt < 4; attempt++) {
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        if (!isMounted) return;

                        reservation = await reservationService.getReservationById(firstId);
                        if (reservation.status !== "awaiting_payment") {
                            break;
                        }
                    }
                }

                if (!isMounted) return;

                setReservationData(reservation);

                if (redirectResultCode && redirectResultCode !== "0") {
                    setStatus("failed");
                } else if (reservation.status === "waiting") {
                    setStatus("success");
                } else if (reservation.status === "awaiting_payment") {
                    setStatus("pending");
                } else if (reservation.status === "cancel") {
                    setStatus("failed");
                } else {
                    setStatus("error");
                }

                const courts = await badmintionCourtService.getAllCourtsOfBranchByStatus(
                    reservation.branchId,
                    'all'
                );

                if (courts && isMounted) {
                    const courtMap = {};
                    courts.forEach(c => courtMap[c.id] = c.ordinalNumber);

                    setReservationDetails(
                        reservation.reservationDetails?.map(d => ({
                            ...d,
                            ordinalNumber: courtMap[d.badmintonCourtId] || null
                        })) || []
                    );
                }

                const branch = await branchService.getBranchById(reservation.branchId);
                if (isMounted) setBranchInfo(branch);

            } catch (error) {
                console.error("Error checking payment:", error);
                if (isMounted) setStatus("error");
            }
        };

        checkPayment();

        return () => {
            isMounted = false;
        };
    }, [orderId, redirectResultCode, resIdsParam]);


    const handleGoBranchs = () => {
        navigate('/badminton-branchs');
    };
    // Helper to get visual props for each status
    const getStatusProps = (s) => {
        switch (s) {
            case 'success':
                return {
                    title: 'ĐẶT SÂN THÀNH CÔNG',
                    subtitle: `Cảm ơn bạn đã đặt sân tại ${branchInfo?.branchName || ''}`,
                    color: theme.palette.success.main,
                    bg: theme.palette.success.light,
                    icon: <CheckCircle sx={{ fontSize: 44 }} />,
                    chip: `Mã đặt sân: ${reservationId}`
                };
            case 'failed':
                return {
                    title: 'THANH TOÁN THẤT BẠI',
                    subtitle: `Thanh toán cho lịch đặt ${reservationId || ''} không thành công`,
                    color: theme.palette.error.main,
                    bg: theme.palette.error.light,
                    icon: <Cancel sx={{ fontSize: 44 }} />,
                    chip: `Trạng thái: ${reservationData.status || 'failed'}`
                };
            case 'pending':
                return {
                    title: 'CHỜ THANH TOÁN',
                    subtitle: `Lịch đặt sân ${reservationId || ''} đang chờ thanh toán`,
                    color: theme.palette.warning.main,
                    bg: theme.palette.warning.light,
                    icon: <AccessTime sx={{ fontSize: 44 }} />,
                    chip: `Trạng thái: ${reservationData.status || 'pending'}`
                };
            case 'loading':
                return {
                    title: 'Đang xác nhận thanh toán...',
                    subtitle: 'Vui lòng chờ trong giây lát',
                    color: theme.palette.info.main,
                    bg: theme.palette.info.light,
                    icon: <AccessTime sx={{ fontSize: 44 }} />,
                    chip: null
                };
            default:
                return {
                    title: 'ĐÃ XẢY RA LỖI',
                    subtitle: 'Không thể xác nhận thông tin thanh toán',
                    color: theme.palette.error.main,
                    bg: theme.palette.error.light,
                    icon: <ErrorIcon sx={{ fontSize: 44 }} />,
                    chip: null
                };
        }
    };

    const statusProps = getStatusProps(status);

    if (resIds && resIds.length > 1) {
        return (
            <UserLayout>
                <Container maxWidth="lg" sx={{ py: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Kết quả lịch đặt sân ({resIds.length})</Typography>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                        <Paper sx={{ width: { xs: '100%', md: 320 }, p: 2, borderRadius: theme.shape.borderRadius }} elevation={1}>
                            <Typography variant="subtitle2" color="text.secondary">Chọn lịch đặt để xem chi tiết</Typography>
                            <Stack spacing={1} sx={{ mt: 2 }}>
                                {multipleReservations.map((r) => (
                                    <Paper key={r.id} variant="outlined" sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography sx={{ fontWeight: 600 }}>{r.id}</Typography>
                                            <Typography variant="caption" color="text.secondary">{r.status}</Typography>
                                        </Box>
                                        <Button size="small" onClick={async () => {

                                            try {
                                                const res = await reservationService.getReservationById(r.id);
                                                const courts = await badmintionCourtService.getAllCourtsOfBranchByStatus(res.branchId, 'all');
                                                const courtMap = {};
                                                courts.forEach(c => courtMap[c.id] = c.ordinalNumber);
                                                setReservationDetails(res.reservationDetails?.map(d => ({ ...d, ordinalNumber: courtMap[d.badmintonCourtId] || null })) || []);
                                                setReservationData(res);
                                                const branch = await branchService.getBranchById(res.branchId);
                                                setBranchInfo(branch);
                                                setReservationId(r.id);
                                                if (res.status === 'waiting') setStatus('success');
                                                else if (res.status === 'awaiting_payment') setStatus('pending');
                                                else if (res.status === 'cancel') setStatus('failed');
                                                else setStatus('error');
                                            } catch (err) {
                                                console.error('Error loading reservation detail', err);
                                            }
                                        }}>Xem</Button>
                                    </Paper>
                                ))}
                            </Stack>
                        </Paper>

                        <Box sx={{ flex: 1 }}>
                            <Paper sx={{ p: 2, borderRadius: theme.shape.borderRadius }} elevation={1}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Avatar sx={{ bgcolor: statusProps.bg }}>{statusProps.icon}</Avatar>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700 }}>{statusProps.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">{statusProps.subtitle}</Typography>
                                    </Box>
                                </Stack>
                            </Paper>

                            <Box sx={{ mt: 2 }}>
                                <BookingDetail
                                    reservationData={reservationData}
                                    reservationDetails={reservationDetails}
                                    branchInfo={branchInfo}
                                    status={status}
                                />
                            </Box>
                        </Box>
                    </Stack>
                </Container>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Paper elevation={2} sx={{ p: { xs: 3, sm: 4 }, borderRadius: theme.shape.borderRadius }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                        <Avatar sx={{ bgcolor: statusProps.bg, width: 72, height: 72 }}>
                            {statusProps.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" component="h1" sx={{ fontWeight: 700, color: statusProps.color }}>
                                {statusProps.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {statusProps.subtitle}
                            </Typography>
                            {statusProps.chip && (
                                <Chip label={statusProps.chip} variant="outlined" sx={{ mt: 1, fontWeight: 600 }} />
                            )}
                        </Box>
                        <Stack direction={{ xs: 'row', sm: 'column' }} spacing={1} alignItems="center">
                            <Button variant="contained" color="primary" onClick={handleGoBranchs} sx={{ px: 4 }}>
                                Xem sân khác
                            </Button>
                        </Stack>
                    </Stack>
                </Paper>

                <Box sx={{ mt: 4 }}>
                    <Box sx={{ mt: 2 }}>
                        <BookingDetail
                            reservationData={reservationData}
                            reservationDetails={reservationDetails}
                            branchInfo={branchInfo}
                            status={status}
                        />
                    </Box>
                </Box>
            </Container>
        </UserLayout>
    );
};

export default PaymentResult;
