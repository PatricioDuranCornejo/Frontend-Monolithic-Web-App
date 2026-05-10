import { useEffect, useState } from "react";
import bookingService from "../services/booking.service";
import packageService from "../services/package.service";

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
} from "@mui/material";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PaidIcon from "@mui/icons-material/Paid";
import PeopleIcon from "@mui/icons-material/People";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CancelSharpIcon from '@mui/icons-material/CancelSharp';
import MenuSharpIcon from '@mui/icons-material/MenuSharp';
import { WindowSharp } from "@mui/icons-material";

const Bookings = () => {
    const [bookings, setBookings] = useState([]);
    const [packages, setPackages] = useState([]);
    const [openPackageDetailsModal, setOpenPackageDetailsModal] = useState(false);
    const [openPassengersDetailsModal, setOpenPassengersDetailsModal] = useState(false);
    const [openDiscountDetailsModal, setOpenDiscountDetailsModal] = useState(false);
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [extraPassengers, setExtraPassengers] = useState([]);

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
        if (value === "awaiting for payment") return "Pendiente de pago";
        return "Desconocido";
    };

    const getStateColor = (state) => {
        const value = String(state || "").toLowerCase();
        if (value === "paid") return "success";
        if (value === "cancelled") return "error";
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
                                                md: "270px 340px 210px",
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
                                                        <strong>Porcentaje de descuento: </strong>
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
                                                        <strong>Precio total:</strong> {formatPrice(booking.bookingTotalPrice)}
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

                                            <Chip
                                                label={translateState(booking.bookingState)}
                                                color={getStateColor(booking.bookingState)}
                                                size="small"
                                            />

                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<ShoppingCartIcon />}
                                                color="success"
                                                sx={{
                                                    borderRadius: 3,
                                                    minWidth: 170,
                                                    boxShadow: 2,
                                                }}
                                            >
                                                Pagar
                                            </Button>

                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<CancelSharpIcon />}
                                                color="error"
                                                sx={{
                                                    borderRadius: 3,
                                                    minWidth: 170,
                                                    boxShadow: 2,
                                                }}
                                                onClick={() => handleCancelBooking(booking)}
                                            >
                                                Cancelar
                                            </Button>
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
        </Container>
    );
};

export default Bookings;

