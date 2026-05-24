import { use, useEffect, useState } from "react";
import bookingService from "../services/booking.service";
import packageService from "../services/package.service";
import paymentService from "../services/payment.service";
import { useKeycloak } from "@react-keycloak/web";

import {
    Container,
    Typography,
    Stack,
    Box,
    Card,
    Chip,
    Button,
    IconButton,
    Modal,
    DialogContent,
    DialogTitle,
    Dialog,
    DialogActions,
    InputLabel,
    Select,
    MenuItem,
    FormControl,
    TextField,
    Alert,
} from "@mui/material";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PaidIcon from "@mui/icons-material/Paid";
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from "@mui/icons-material/People";
import DeleteIcon from '@mui/icons-material/Delete';
import CancelSharpIcon from '@mui/icons-material/CancelSharp';
import MenuSharpIcon from '@mui/icons-material/MenuSharp';
import { WindowSharp } from "@mui/icons-material";
import discountsService from "../services/discounts.service";

const AdminBookings = () => {
    const { keycloak } = useKeycloak();
    const [bookings, setBookings] = useState([]);
    const [packages, setPackages] = useState([]);
    const [openPackageDetailsModal, setOpenPackageDetailsModal] = useState(false);
    const [openPassengersDetailsModal, setOpenPassengersDetailsModal] = useState(false);
    const [openDiscountDetailsModal, setOpenDiscountDetailsModal] = useState(false);
    const [openPaymentDetailsModal, setOpenPaymentDetailsModal] = useState(false);
    const [openUserDetailsModal, setOpenUserDetailsModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [extraPassengers, setExtraPassengers] = useState([]);
    const [discountsDetails, setDiscountsDetails] = useState([]);
    const [payMethod, setPayMethod] = useState("");
    const [payment, setPayment] = useState(null);
    const [error, setError] = useState("");

    const formatDate = (dateString) => {
        if (!dateString) return "-";

        const date = new Date(dateString);
        // Validate date before formatting
        if (isNaN(date.getTime())) return "-";

        return new Intl.DateTimeFormat("es-CL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23", // 24-hr format
        }).format(date).replace(",", ""); // Delete comma for cleaner output
    };

    const formatPrice = (price) => {
        if (price === null || price === undefined) return "-";
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0,
        }).format(price);
    };

    const translateState = (state) => {
        const value = String(state || "").toLowerCase();
        if (value === "paid") return "Pagada";
        if (value === "cancelled") return "Cancelada";
        if (value === "expired") return "Expirada";
        if (value === "awaiting for payment") return "Pendiente de pago";
        return "Desconocido";
    };

    const getStateColor = (state) => {
        const value = String(state || "").toLowerCase();
        if (value === "paid") return "success";
        if (value === "cancelled") return "error";
        if (value === "expired") return "error";
        if (value === "awaiting for payment") return "default";
        return "primary";
    };

    const getBookings = async () => {
        try {
            const response = await bookingService.getAll();
            setBookings(response.data);
        } catch (error) {
            console.error("Error fetching bookings:", error);
        }
    };

    const handlePackageDetailsModal = (booking) => {
        setSelectedBooking(booking);
        setOpenPackageDetailsModal(true);
        console.log(selectedBooking);
    };

    const handlePassengersDetailsModal = (booking) => {
        setSelectedBooking(booking);
        setExtraPassengers(parsePassengers(booking.extraPassengers));
        setOpenPassengersDetailsModal(true);
        console.log(selectedBooking);
    };

    const parsePassengers = (input) => {
        if (!input || typeof input !== "string") return [];

        return input
            .split(".")
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => {
                const [name, rut] = item.split(";").map((part) => part.trim());

                return {
                    name: name || "-",
                    rut: rut || "-",
                };
            });
    };

    const handleUserDetailsModal = (booking) => {
        setSelectedBooking(booking);
        setOpenUserDetailsModal(true);
        console.log(selectedBooking);
    };

    const handleCancelBooking = async (booking) => {
        if (booking.bookingState.toLowerCase() === "paid") {
            window.alert("No puedes cancelar una reserva que ya ha sido pagada.");
            return;
        }
        if (booking.bookingState.toLowerCase() === "cancelled") {
            window.alert("Esta reserva ya ha sido cancelada.");
            return;
        }
        if (booking.bookingState.toLowerCase() === "awaiting for payment" && window.confirm("¿Estás seguro de que deseas cancelar esta reserva?")) {
            try {
                await bookingService.cancel(booking);
                window.location.reload();
            } catch (error) {
                console.error("Error canceling booking:", error);
            }
        }
    };

    const handleDeleteBooking = async (booking) => {
        if (booking.bookingState.toLowerCase() === "paid") {
            window.alert("No puedes eliminar una reserva que ya ha sido pagada.");
            return;
        }
        console.log(booking);
        if (window.confirm("¿Estás seguro de que deseas ELIMINAR esta reserva?")) {
            try {
                console.log(booking.bookingId);
                await bookingService.deleteBooking(booking.bookingId);
                window.location.reload();
            } catch (error) {
                console.error("Error deleting booking:", error);
            }
        }

    }

    const handlePaymentDetailsModal = async (booking) => {
        setOpenPaymentDetailsModal(true);
        const response = await paymentService.getByBookingId(booking.bookingId);
        setPayment(response.data);
        console.log(payment);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const translateDiscountName = (name) => {
        const map = {
            "Passengers discount": "Descuento por pasajeros",
            "Frequent user discount": "Descuento por usuario frecuente",
            "Multiple bookings discount": "Descuento por múltiples reservas",
            "Time limited discount": "Descuento por tiempo limitado",
            "No discounts applicable": "No hay descuentos aplicables",
        };

        return map[name] || name || "-";
    };

    const translateDiscountType = (type) => {
        const map = {
            Cumulative: "Acumulativo",
            "Non Cumulative": "No acumulativo",
            "No discounts applicable": "No hay descuentos aplicables",
        };

        return map[type] || type || "-";
    };

    const handleDiscountsDetailsModal = async (booking) => {
        setSelectedBooking(booking);

        const response = await discountsService.getDiscountsDetails(booking.bookingId);
        setDiscountsDetails(response.data);

        setOpenDiscountDetailsModal(true);
        console.log(selectedBooking);
    };

    useEffect(() => {
        getBookings();
    }, []);

    return (
        <Container
            maxWidth={false}
            disableGutters
            sx={{
                width: "100%",
                px: { xs: 2, md: 4 },
                py: 4,
            }}
        >
            <Typography
                variant="h3"
                fontWeight="bold"
                gutterBottom
                sx={{ textAlign: "center" }}
            >
                Listado de reservas
            </Typography>

            <Typography
                variant="body1"
                sx={{ mb: 4, opacity: 0.8, textAlign: "center" }}
            >
                Reservas realizadas actualmente.
            </Typography>

            {bookings.length === 0 ? (
                <Typography variant="h6" sx={{ mt: 4, textAlign: "center" }}>
                    Aún no tienes reservas.
                </Typography>
            ) : (
                <Stack spacing={2} sx={{ width: "100%" }}>
                    {bookings.map((booking) => {
                        return (
                            <Box
                                key={booking.bookingId}
                                sx={{
                                    width: "100%",
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                <Card
                                    elevation={4}
                                    sx={{
                                        width: "100%",
                                        maxWidth: "1400px",
                                        borderRadius: 4,
                                        overflow: "hidden",
                                    }}
                                >
                                    {/* Main content grid */}
                                    <Box
                                        sx={{
                                            display: "grid",
                                            gridTemplateColumns: {
                                                xs: "1fr",
                                                md: "280px 360px 280px",
                                            },
                                            gap: 2,
                                            alignItems: "center",
                                            width: "100%",
                                            p: 2,
                                        }}
                                    >
                                        {/* PACKAGE NAME, RESERVATION DATE & START DATE */}
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                textAlign: "center",
                                                minHeight: 110,
                                                gap: 1,
                                            }}
                                        >
                                            <Stack direction="row" spacing={2} alignItems="center">
                                                <Typography variant="h5" fontWeight="bold">
                                                    {booking.pack.packageName}
                                                </Typography>
                                                <IconButton
                                                    color="default"
                                                    sx={{
                                                        borderRadius: 3,
                                                        boxShadow: 2,
                                                        width: 35,
                                                        height: 35,
                                                    }}
                                                    onClick={() => handlePackageDetailsModal(booking)}
                                                >
                                                    <MenuSharpIcon />
                                                </IconButton>
                                            </Stack>

                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <CalendarMonthIcon fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    <strong>Reservado en:</strong> {formatDate(booking.bookingDate)}
                                                </Typography>
                                            </Stack>

                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <CalendarMonthIcon fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    <strong>Inicia en:</strong> {formatDate(booking.pack.startDate)}
                                                </Typography>
                                            </Stack>
                                        </Box>

                                        {/* NUMBER OF PASSENGERS + DETAILS, DISCOUNTS % + DETAILS, TOTAL PRICE */}
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                textAlign: "center",
                                                minHeight: 110,
                                                borderLeft: { xs: "none", md: "1px solid rgba(0,0,0,0.12)" },
                                                borderRight: { xs: "none", md: "1px solid rgba(0,0,0,0.12)" },
                                                px: { xs: 0, md: 2 },
                                            }}
                                        >
                                            <Stack spacing={1.3}>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: 1,
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <PeopleIcon fontSize="small" color="action" />
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            lineHeight: 1,
                                                        }}
                                                    >
                                                        <strong>Número de pasajeros:</strong>&nbsp;{booking.passengers}
                                                    </Typography>

                                                    <IconButton
                                                        color="default"
                                                        sx={{
                                                            borderRadius: 1,
                                                            boxShadow: 2,
                                                            width: 30,
                                                            height: 30,
                                                            p: 0,
                                                            flexShrink: 0,
                                                        }}
                                                        onClick={() => handlePassengersDetailsModal(booking)}
                                                    >
                                                        <MenuSharpIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>

                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: 1,
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <PaidIcon fontSize="small" color="action" />
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            lineHeight: 1,
                                                        }}
                                                    >
                                                        <strong>Porcentaje de descuento:</strong>&nbsp;{(booking.bookingDiscount * 100) + "%" || " 0%"}
                                                    </Typography>

                                                    <IconButton
                                                        color="default"
                                                        sx={{
                                                            borderRadius: 1,
                                                            boxShadow: 2,
                                                            width: 30,
                                                            height: 30,
                                                            p: 0,
                                                            flexShrink: 0,
                                                        }}
                                                        onClick={() => handleDiscountsDetailsModal(booking)}
                                                    >
                                                        <MenuSharpIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>

                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: 1,
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <PaidIcon fontSize="small" color="action" />
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            lineHeight: 1,
                                                        }}
                                                    >
                                                        <strong>Precio total:</strong>&nbsp;{formatPrice(booking.bookingTotalPrice)}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Box>

                                        {/* STATE + PAY BUTTON OR DATE OF PAYMENT */}
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                textAlign: "center",
                                                minHeight: 110,
                                                gap: 1,
                                                px: { xs: 0, md: 2 },
                                            }}
                                        >

                                            {booking.bookingState.toLowerCase() === "awaiting for payment" ? (
                                                <>
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            gap: 1,
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <PeopleIcon fontSize="small" color="action" />
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                lineHeight: 1,
                                                            }}
                                                        >
                                                            <strong>Usuario:</strong>&nbsp;{booking.user.userName}
                                                        </Typography>

                                                        <IconButton
                                                            color="default"
                                                            sx={{
                                                                borderRadius: 1,
                                                                boxShadow: 2,
                                                                width: 30,
                                                                height: 30,
                                                                p: 0,
                                                                flexShrink: 0,
                                                            }}
                                                            onClick={() => handleUserDetailsModal(booking)}
                                                        >
                                                            <MenuSharpIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                    <Chip
                                                        label={translateState(booking.bookingState)}
                                                        color={getStateColor(booking.bookingState)}
                                                        size="small"
                                                    />
                                                    <Box
                                                        sx={{
                                                            display: "grid",
                                                            gridTemplateColumns: {
                                                                xs: "1fr",
                                                                md: "120px 120px",
                                                            },
                                                            gap: 1,
                                                            alignItems: "center",
                                                            width: "100%",
                                                            p: 0,
                                                        }}
                                                    >
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            startIcon={<CancelSharpIcon />}
                                                            color="error"
                                                            sx={{
                                                                borderRadius: 3,
                                                                boxShadow: 2,
                                                            }}
                                                            onClick={() => handleCancelBooking(booking)}
                                                        >
                                                            Cancelar
                                                        </Button>

                                                        {booking && (
                                                            <Button
                                                                variant="contained"
                                                                size="small"
                                                                startIcon={<DeleteIcon />}
                                                                color="error"
                                                                sx={{
                                                                    borderRadius: 3,
                                                                    boxShadow: 2,
                                                                }}
                                                                onClick={() => handleDeleteBooking(booking)}
                                                            >
                                                                ELIMINAR
                                                            </Button>
                                                        )}
                                                    </Box>
                                                </>
                                            ) : booking.bookingState.toLowerCase() === "paid" ? (
                                                <>
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            gap: 1,
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <PeopleIcon fontSize="small" color="action" />
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                lineHeight: 1,
                                                            }}
                                                        >
                                                            <strong>Usuario:</strong>&nbsp;{booking.user.userName}
                                                        </Typography>

                                                        <IconButton
                                                            color="default"
                                                            sx={{
                                                                borderRadius: 1,
                                                                boxShadow: 2,
                                                                width: 30,
                                                                height: 30,
                                                                p: 0,
                                                                flexShrink: 0,
                                                            }}
                                                            onClick={() => handleUserDetailsModal(booking)}
                                                        >
                                                            <MenuSharpIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>

                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <Chip
                                                            label={translateState(booking.bookingState)}
                                                            color={getStateColor(booking.bookingState)}
                                                        />
                                                        <IconButton
                                                            color="default"
                                                            sx={{
                                                                borderRadius: 1,
                                                                boxShadow: 2,
                                                                width: 30,
                                                                height: 30,
                                                                p: 0,
                                                                flexShrink: 0,
                                                            }}
                                                            onClick={() => handleUserDetailsModal(booking)}
                                                        >
                                                            <MenuSharpIcon fontSize="small" />
                                                        </IconButton>
                                                    </Stack>
                                                </>
                                            ) : (
                                                <>
                                                    <Box
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            gap: 1,
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        <PeopleIcon fontSize="small" color="action" />
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                lineHeight: 1,
                                                            }}
                                                        >
                                                            <strong>Usuario:</strong>&nbsp;{booking.user.userName}
                                                        </Typography>

                                                        <IconButton
                                                            color="default"
                                                            sx={{
                                                                borderRadius: 1,
                                                                boxShadow: 2,
                                                                width: 30,
                                                                height: 30,
                                                                p: 0,
                                                                flexShrink: 0,
                                                            }}
                                                            onClick={() => handleUserDetailsModal(booking)}
                                                        >
                                                            <MenuSharpIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>

                                                    <Chip
                                                        label={translateState(booking.bookingState)}
                                                        color={getStateColor(booking.bookingState)}
                                                        size="medium"
                                                    />

                                                    {booking && (
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            startIcon={<DeleteIcon />}
                                                            color="error"
                                                            sx={{
                                                                borderRadius: 3,
                                                                boxShadow: 2,
                                                                minWidth: 170,
                                                            }}
                                                            onClick={() => handleDeleteBooking(booking)}
                                                        >
                                                            ELIMINAR
                                                        </Button>
                                                    )}
                                                </>

                                            )}
                                        </Box>
                                    </Box>
                                </Card>
                            </Box>
                        );
                    })}
                </Stack>
            )}
            {/* PACKAGE DETAILS MODAL */}
            <Modal
                open={openPackageDetailsModal}
                onClose={() => setOpenPackageDetailsModal(false)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 400,
                        bgcolor: "background.paper",
                        border: "2px solid #000",
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    {selectedBooking && (
                        <>
                            <Typography id="modal-modal-title" variant="h6" component="h2">
                                <strong>Detalles del paquete:</strong> {selectedBooking.pack.packageName}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>Destino:</strong> {selectedBooking.pack.packageDestiny}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>Descripción:</strong> {selectedBooking.pack.packageDescription}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>Tipo de experiencia:</strong> {selectedBooking.pack.packageExperienceType}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>Fecha de inicio:</strong> {formatDate(selectedBooking.pack.startDate)}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>Fecha de término:</strong> {formatDate(selectedBooking.pack.endDate)}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>Precio unitario:</strong> {formatPrice(selectedBooking.pack.packagePrice)}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>Capacidad total:</strong> {selectedBooking.pack.packageCapacity}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>Stock disponible:</strong> {selectedBooking.pack.packageStockAvailable}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>Estado:</strong> {translateState(selectedBooking.pack.packageState)}
                            </Typography>
                        </>
                    )}
                </Box>
            </Modal>

            {/* PASSENGERS DETAILS MODAL */}
            <Modal
                open={openPassengersDetailsModal}
                onClose={() => setOpenPassengersDetailsModal(false)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 400,
                        bgcolor: "background.paper",
                        border: "2px solid #000",
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    {selectedBooking && (
                        <>
                            <Typography id="modal-modal-title" variant="h6" component="h2">
                                <strong>Pasajeros extra:</strong>
                            </Typography>
                            <Stack spacing={1} sx={{ mt: 2 }}>
                                {extraPassengers.length > 0 ? (
                                    extraPassengers.map((passenger, index) => (
                                        <Typography key={index} variant="body2">
                                            {index + 1}. <strong>Nombre:</strong> {passenger.name}{". "}
                                            <strong>RUT:</strong> {passenger.rut}
                                        </Typography>
                                    ))
                                ) : (
                                    <Typography variant="body2">No hay pasajeros extra registrados.</Typography>
                                )}
                            </Stack>
                        </>
                    )}
                </Box>
            </Modal>

            {/* DISCOUNTS DETAILS MODAL */}
            <Modal
                open={openDiscountDetailsModal}
                onClose={() => setOpenDiscountDetailsModal(false)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 400,
                        bgcolor: "background.paper",
                        border: "2px solid #000",
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    <Typography id="modal-modal-title" variant="h5" component="h2">
                        <strong>Detalle de descuentos:</strong>
                    </Typography>
                    {selectedBooking && discountsDetails && (
                        <>
                            <Stack spacing={1} sx={{ mt: 2 }}>
                                {discountsDetails.length > 0 ? (
                                    discountsDetails.map((discount, index) => (
                                        index < discountsDetails.length - 1 ? (
                                            <div key={index}>
                                                <Typography variant="body2">
                                                    {index + 1}.{" "}
                                                </Typography>

                                                <Typography variant="body2">
                                                    <strong>Origen:</strong> {translateDiscountName(discount.discountName)}
                                                </Typography>

                                                <Typography variant="body2">
                                                    <strong>Porcentaje:</strong> {discount.discountPercentage * 100}%
                                                </Typography>

                                                <Typography variant="body2">
                                                    <strong>Tipo:</strong> {translateDiscountType(discount.discountCumulative)}
                                                </Typography>
                                            </div>
                                        ) : (
                                            <div>
                                                <Typography variant="h6" component="h2">
                                                    <strong>* Descuento final:</strong>
                                                </Typography>
                                                {discount.discountName &&
                                                    <Typography variant="body2">
                                                        <strong>Origen:</strong> {translateDiscountName(discount.discountName)}
                                                    </Typography>
                                                }
                                                <Typography variant="body1" component="h1">
                                                    <strong>Porcentaje:</strong> {discount.discountPercentage * 100}%
                                                </Typography>

                                                <Typography variant="body1" component="h2">
                                                    <strong>Tipo:</strong> {translateDiscountType(discount.discountCumulative)}
                                                </Typography>
                                            </div>
                                        )
                                    ))
                                ) : (
                                    <Typography variant="body2">No hay descuentos registrados.</Typography>
                                )}
                            </Stack>
                        </>
                    )}
                </Box>
            </Modal>

            {/* USER DETAILS MODAL */}
            <Modal
                open={openUserDetailsModal}
                onClose={() => setOpenUserDetailsModal(false)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 400,
                        bgcolor: "background.paper",
                        border: "2px solid #000",
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    {selectedBooking && (
                        <>
                            <Typography id="modal-modal-title" variant="h6" component="h2">
                                <strong>Detalles del Usuario:</strong>
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>Nombre:</strong> {selectedBooking.user.userName}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>RUT:</strong> {selectedBooking.user.userRut}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>Correo:</strong> {selectedBooking.user.userEmail}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>Teléfono:</strong> {selectedBooking.user.userPhone}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>País:</strong> {selectedBooking.user.userCountry}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>Usuario Frecuente:</strong> {selectedBooking.user.frecuentUser ? "Sí" : "No"}
                            </Typography>
                        </>
                    )}
                </Box>
            </Modal>

            {/* PAYMENT DETAILS MODAL */}
            <Modal
                open={openPaymentDetailsModal}
                onClose={() => setOpenPaymentDetailsModal(false)}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 400,
                        bgcolor: "background.paper",
                        border: "2px solid #000",
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    {payment && (
                        <>
                            <Typography id="modal-modal-title" variant="h6" component="h2">
                                <strong>Detalles del pago:</strong>
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>Método de pago:</strong> {translatePaymentMethod(payment.paymentMethod)}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>Monto total:</strong> {formatPrice(payment.paymentAmount)}
                            </Typography>
                            <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                <strong>Pago realizado el:</strong> {formatDate(payment.paymentDate)}
                            </Typography>
                        </>
                    )}
                </Box>
            </Modal>
        </Container>
    );
};

export default AdminBookings;

