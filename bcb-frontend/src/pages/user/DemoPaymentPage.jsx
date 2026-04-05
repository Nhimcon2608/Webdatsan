import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    Divider,
    Stack,
    Typography,
} from "@mui/material";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";

import UserLayout from "../../layouts/user/UserLayout";
import reservationService from "../../services/reservationService";
import { useSnackbar } from "../../../context/SnackbarContext";
import { formatVND } from "../../utils/format";

const DemoPaymentPage = () => {
    const [params] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { showSnackbar } = useSnackbar();
    const [submitting, setSubmitting] = useState(false);

    const type = params.get("type") || "single";
    const resIds = (params.get("resIds") || "")
        .split(",")
        .map(id => id.trim())
        .filter(Boolean);

    const branchDetail = location.state?.branchDetail;
    const amount = location.state?.amount || 0;
    const title = location.state?.title || "Thanh toán MoMo";
    const description = location.state?.description || "Quét mã QR để thanh toán nhanh bằng ví MoMo.";
    const paymentContent = location.state?.paymentContent || `MOMO ${resIds[0] || "ORDER"}`;

    const qrValue = useMemo(() => {
        return `momo://pay?amount=${amount}&order=${resIds.join(",")}&note=${paymentContent}`;
    }, [amount, resIds, paymentContent]);

    const qrImage = useMemo(() => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrValue)}`;
    }, [qrValue]);

    const handleConfirm = async (resultCode) => {
        if (resIds.length === 0) {
            showSnackbar("Không tìm thấy mã đặt sân để xác nhận thanh toán.", "error");
            return;
        }

        try {
            setSubmitting(true);

            if (type === "fixed" || resIds.length > 1) {
                await reservationService.updateFixedBookingStatus(
                    resIds,
                    resultCode === 0 ? "waiting" : "cancel"
                );
            } else if (resultCode === 0) {
                await reservationService.updateReservationStatus(resIds[0], "waiting");
            } else {
                await reservationService.cancelReservation(resIds[0]);
            }

            navigate(
                `/payment-result?orderId=${encodeURIComponent(resIds.join(","))}&resIds=${encodeURIComponent(resIds.join(","))}&resultCode=${resultCode}`
            );
        } catch (error) {
            showSnackbar(
                (error.response?.data?.message || error.message || "Không thể xác nhận thanh toán.")
                    + (error.config?.url ? ` [${error.config.url}]` : ""),
                "error"
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <UserLayout>
            <Container maxWidth="sm" sx={{ py: 6 }}>
                <Card
                    sx={{
                        borderRadius: 5,
                        overflow: "hidden",
                        background: "linear-gradient(180deg, #a50064 0%, #ea4c89 100%)",
                        color: "white",
                        boxShadow: "0 20px 50px rgba(165, 0, 100, 0.35)",
                    }}
                >
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Stack spacing={3}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
                                <Box>
                                    <Typography variant="overline" sx={{ opacity: 0.85, fontWeight: 700 }}>
                                        MoMo e-Wallet
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>
                                        {title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.92 }}>
                                        {description}
                                    </Typography>
                                </Box>
                                <PhoneIphoneIcon sx={{ fontSize: 34, opacity: 0.95 }} />
                            </Box>

                            <Box sx={{ bgcolor: "rgba(255,255,255,0.12)", borderRadius: 4, p: 3 }}>
                                <Stack spacing={2} alignItems="center">
                                    <Box
                                        sx={{
                                            bgcolor: "white",
                                            borderRadius: 4,
                                            p: 2,
                                            width: "fit-content",
                                            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
                                        }}
                                    >
                                        <img
                                            src={qrImage}
                                            alt="QR thanh toán"
                                            style={{ width: 240, height: 240, display: "block" }}
                                        />
                                    </Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <QrCode2Icon />
                                        <Typography fontWeight={700}>Quét mã để thanh toán nhanh</Typography>
                                    </Stack>
                                </Stack>
                            </Box>

                            <Box sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 4, p: 2.5 }}>
                                <Stack spacing={1.5}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                        <Typography sx={{ opacity: 0.9 }}>Mã đặt sân</Typography>
                                        <Chip
                                            label={resIds.join(", ") || "Không có"}
                                            sx={{ bgcolor: "rgba(255,255,255,0.16)", color: "white", fontWeight: 700 }}
                                        />
                                    </Box>
                                    <Divider sx={{ borderColor: "rgba(255,255,255,0.18)" }} />
                                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                        <Typography sx={{ opacity: 0.9 }}>Chi nhánh</Typography>
                                        <Typography fontWeight={700}>{branchDetail?.branchName || "BCB"}</Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                        <Typography sx={{ opacity: 0.9 }}>Nội dung thanh toán</Typography>
                                        <Typography fontWeight={700}>{paymentContent}</Typography>
                                    </Box>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                        <Typography sx={{ opacity: 0.9 }}>Số tiền</Typography>
                                        <Typography fontWeight={900} fontSize={24}>{formatVND(amount)}</Typography>
                                    </Box>
                                </Stack>
                            </Box>

                            <Stack spacing={1.5}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    disabled={submitting || resIds.length === 0}
                                    onClick={() => handleConfirm(0)}
                                    sx={{
                                        bgcolor: "white",
                                        color: "#a50064",
                                        fontWeight: 800,
                                        "&:hover": { bgcolor: "#ffe4ef" },
                                    }}
                                >
                                    Tôi đã thanh toán
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    disabled={submitting || resIds.length === 0}
                                    onClick={() => handleConfirm(1001)}
                                    sx={{
                                        borderColor: "rgba(255,255,255,0.6)",
                                        color: "white",
                                        fontWeight: 700,
                                    }}
                                >
                                    Hủy giao dịch
                                </Button>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </UserLayout>
    );
};

export default DemoPaymentPage;
