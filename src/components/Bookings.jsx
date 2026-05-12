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
import PeopleIcon from "@mui/icons-material/People";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CancelSharpIcon from '@mui/icons-material/CancelSharp';
import MenuSharpIcon from '@mui/icons-material/MenuSharp';
import { WindowSharp } from "@mui/icons-material";

const Bookings = () => {
    const { keycloak } = useKeycloak();
    const [bookings, setBookings] = useState([]);
    const [packages, setPackages] = useState([]);
    const [openPackageDetailsModal, setOpenPackageDetailsModal] = useState(false);
    const [openPassengersDetailsModal, setOpenPassengersDetailsModal] = useState(false);
    const [openDiscountDetailsModal, setOpenDiscountDetailsModal] = useState(false);
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [openPaymentDetailsModal, setOpenPaymentDetailsModal] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [extraPassengers, setExtraPassengers] = useState([]);
    const [discountsMatrix, setDiscountsMatrix] = useState([]);
    const [payMethod, setPayMethod] = useState("");
    const [payment, setPayment] = useState(null);
    const [error, setError] = useState("");
    const [paymentError, setPaymentError] = useState("");
    const [form, setForm] = useState({
        cardNumber: "",
        expirationDate: "",
        cvv: "",
        cardHolder: "",
    });



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
            const response = await bookingService.getBookingsByKeycloakId(keycloak.tokenParsed.sub);
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

    const handlePayMethodChange = (event) => {
        setPayMethod(event.target.value);
    };

    const handleCardNumberChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, "").slice(0, 16);
        const formattedValue = rawValue.replace(/(.{4})/g, "$1 ").trim();
        setForm((prev) => ({ ...prev, cardNumber: formattedValue }));
    };

    const handleExpirationDateChange = (e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 4); // MMYY

        const month = digits.slice(0, 2);
        const year = digits.slice(2, 4);

        // Validar mes solo cuando ya tenga 2 dígitos
        if (month.length === 2) {
            const monthNumber = Number(month);
            if (monthNumber < 1 || monthNumber > 12) return;
        }

        let formattedValue = month;

        if (year.length > 0) {
            formattedValue = `${month}/${year}`;
        }

        setForm((prev) => ({ ...prev, expirationDate: formattedValue }));
    };

    const handleCvvChange = (e) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 3);
        setForm((prev) => ({ ...prev, cvv: value }));
    };

    const handleCardHolderChange = (e) => {
        const value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
        setForm((prev) => ({ ...prev, cardHolder: value }));
    };

    const handleSubmit = async () => {

        if (!payMethod) {
            window.alert("Por favor, selecciona un método de pago.");
            return;
        }

        if (!form.cardNumber || !form.expirationDate || !form.cvv || !form.cardHolder) {
            setError("Por favor, completa todos los campos del formulario de pago.");
            return;
        }

        if (!/^\d{4}\ \d{4}\ \d{4}\ \d{4}$/.test(form.cardNumber.trim())) {
            setError("El número de tarjeta debe contener 16 dígitos.");
            return;
        }

        if (!/^\d{2}\/\d{2}$/.test(form.expirationDate)) {
            setError("La fecha de expiración debe tener el formato MM/AA.");
            return;
        }

        if (!/^\d{3}$/.test(form.cvv)) {
            setError("El CVV solo debe contener 3 dígitos.");
            return;
        }

        const data = {
            paymentDate: new Date().toISOString(),
            paymentMethod: payMethod,
            paymentAmount: selectedBooking.bookingTotalPrice,
            booking: selectedBooking,
        };

        if (window.confirm("¿Confirma que desea realizar el pago de esta reserva?")) {
            try {
                await paymentService.createPayment(data);
                window.alert("Pago realizado con éxito.");
                setOpenPaymentDialog(false);
                window.location.reload();
            } catch (error) {
                console.error("Error processing payment:", error);
            }
        }
    }

    const handleBookingPaymentModal = (booking) => {
        setOpenPaymentDialog(true);
        setSelectedBooking(booking);
    };

    const handlePaymentDetailsModal = async (booking) => {
        setOpenPaymentDetailsModal(true);
        const response = await paymentService.getByBookingId(booking.bookingId);
        setPayment(response.data);
        console.log(payment);
    };

    const translatePaymentMethod = (method) => {
        const value = String(method || "").toLowerCase();
        if (value === "creditcard") return "Tarjeta de crédito";
        return "Desconocido";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDiscountsDetailModal = async (booking) => {
        const response = await bookingService.getDiscountsForUser(booking.passengers, keycloak.idTokenParsed.sub);
        setDiscountsMatrix(response.data)
        setOpenDiscountDetailsModal(true);
        console.log(response);
    }

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

    const renderDiscounts = (matrix) => {
        if (!Array.isArray(matrix) || matrix.length === 0) {
            return <Typography>No hay información de descuentos.</Typography>;
        }

        const lastRow = matrix[matrix.length - 1];

        const noDiscounts =
            Array.isArray(lastRow) && lastRow.length >= 2 && lastRow[1] === "No discounts applicable";

        if (noDiscounts) {
            return (
                <Typography variant="body2">
                    No hay descuentos aplicables.
                </Typography>
            );
        }

        const discounts = matrix.slice(0, -1);
        const finalDiscountRow = lastRow;

        return (
            <Stack spacing={1}>
                {/* DISCOUNTS LIST */}
                {discounts.map((d, index) => (
                    <Typography key={index} variant="body2">
                        {index + 1}. <strong>{translateDiscountName(d[0])}</strong> —{" "}
                        {(Number(d[1]) * 100).toFixed(0)}% ({translateDiscountType(d[2])})
                    </Typography>
                ))}

                {/* FINAL RESULT */}
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        <strong>Descuento final:</strong>{" "}
                        {(Number(finalDiscountRow?.[0] ?? 0) * 100).toFixed(0)}%
                    </Typography>

                    <Typography variant="body2">
                        <strong>Tipo:</strong> {translateDiscountType(finalDiscountRow?.[1])}
                    </Typography>

                    {finalDiscountRow?.[2] && (
                        <Typography variant="body2">
                            <strong>Origen:</strong> {translateDiscountName(finalDiscountRow[2])}
                        </Typography>
                    )}
                </Box>
            </Stack>
        );
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
                                                md: "280px 360px 240px",
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
                                                        onClick={() => handleDiscountsDetailModal(booking)}
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
                                                        onClick={() => handleBookingPaymentModal(booking)}
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
                                                </>
                                            ) : booking.bookingState.toLowerCase() === "paid" ? (
                                                <>
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
                                                            onClick={() => handlePaymentDetailsModal(booking)}
                                                        >
                                                            <MenuSharpIcon fontSize="small" />
                                                        </IconButton>
                                                    </Stack>
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
                                                </>
                                            ) : (
                                                <Chip
                                                    label={translateState(booking.bookingState)}
                                                    color={getStateColor(booking.bookingState)}
                                                    size="medium"
                                                    sx={{
                                                        fontSize: "1.4rem",
                                                    }}
                                                />

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
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        <strong>Detalle de descuentos:</strong>
                    </Typography>
                    {discountsMatrix && (
                        <>
                            <Typography id="modal-modal-title" variant="h6" component="h2">
                                <strong></strong>
                            </Typography>
                            {renderDiscounts(discountsMatrix)}
                        </>
                    )}
                </Box>
            </Modal>


            {/* PAYMENT DIALOG */}
            <Dialog open={openPaymentDialog} fullWidth maxWidth="sm" onClose={() => setOpenPaymentDialog(false)}>
                <DialogTitle color="black">Realizar Pago</DialogTitle>
                {selectedBooking && (
                    <>
                        <DialogContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Resumen del pago:
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                <strong>- Monto unitario:</strong> {formatPrice(selectedBooking.pack.packagePrice)}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                <strong>- Cantidad de pasajeros:</strong> {selectedBooking.passengers}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                <strong>- Descuento aplicado:</strong> {(selectedBooking.bookingDiscount * 100) + "%" || "0%"}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                <strong>- Monto total:</strong> {formatPrice(selectedBooking.bookingTotalPrice)}
                            </Typography>

                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Seleccione un método de pago:
                            </Typography>
                            <FormControl variant="standard" sx={{ m: 0, minWidth: 180 }}>
                                <InputLabel id="demo-simple-select-standard-label">Método de pago</InputLabel>
                                <Select
                                    labelId="demo-simple-select-standard-label"
                                    id="demo-simple-select-standard"
                                    value={payMethod}
                                    onChange={handlePayMethodChange}
                                >
                                    <MenuItem value="creditCard">Tarjeta de crédito</MenuItem>
                                </Select>
                            </FormControl>


                            {payMethod && selectedBooking && (
                                <form id="payment-form" onSubmit={handleSubmit}>
                                    <Stack spacing={2} sx={{ mt: 1 }}>
                                        {error && <Alert severity="error">{error}</Alert>}

                                        <TextField
                                            label="Número de tarjeta"
                                            name="cardNumber"
                                            value={form.cardNumber}
                                            onChange={handleCardNumberChange}
                                            fullWidth
                                            required
                                            inputProps={{ inputMode: "numeric" }}
                                        />

                                        <Stack
                                            direction="row"
                                            spacing={2}
                                            sx={{
                                                display: "grid",
                                                gridTemplateColumns: {
                                                    md: "300px 220px",
                                                    xs: "1fr"
                                                },
                                                gap: 2,
                                                mt: 2
                                            }}>
                                            <TextField
                                                label="Fecha de expiración (MM/AA)"
                                                name="expirationDate"
                                                value={form.expirationDate}
                                                onChange={handleExpirationDateChange}
                                                fullWidth
                                                required
                                                type="text"
                                                inputProps={{
                                                    inputMode: "numeric",
                                                    maxLength: 5,
                                                }}
                                            />
                                            <TextField
                                                label="CVV"
                                                name="cvv"
                                                value={form.cvv}
                                                onChange={handleCvvChange}
                                                fullWidth
                                                required
                                                inputProps={{
                                                    inputMode: "numeric",
                                                    maxLength: 3,
                                                }}
                                            />
                                        </Stack>
                                        <TextField
                                            label="Titular de la tarjeta"
                                            name="cardHolder"
                                            value={form.cardHolder}
                                            onChange={handleCardHolderChange}
                                            fullWidth
                                            required
                                        />
                                    </Stack>
                                </form>
                            )}
                        </DialogContent>
                    </>
                )}

                <DialogActions>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<PaidIcon />}
                        sx={{
                            borderRadius: 3,
                            minWidth: 170,
                            boxShadow: 2,
                        }}
                        onClick={handleSubmit}
                    >
                        Pagar reserva
                    </Button>
                </DialogActions>
            </Dialog>

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

export default Bookings;

