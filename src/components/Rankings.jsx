import { useEffect, useState } from "react";
import paymentService from "../services/payment.service";
import bookingService from "../services/booking.service";
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
    FormControlLabel,
    Switch,
    TextField,
    Alert,
} from "@mui/material";
import MenuSharpIcon from '@mui/icons-material/MenuSharp';
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PaidIcon from "@mui/icons-material/Paid";
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from "@mui/icons-material/People";
import InventoryIcon from '@mui/icons-material/Inventory';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import dayjs from "dayjs";

const Rankings = () => {
    const [rankings, setRankings] = useState([]);
    const [listAndNotRanking, setListAndNotRanking] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [openPackageDetailsModal, setOpenPackageDetailsModal] = useState(false);
    const [openUserDetailsModal, setOpenUserDetailsModal] = useState(false);

    // Consts for filter
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [includeCanceled, setIncludeCanceled] = useState(false);

    const handleUserDetailsModal = (booking) => {
        console.log(booking);
        setSelectedBooking(booking);
        setOpenUserDetailsModal(true);
        console.log(selectedBooking);
    };

    const handlePackageDetailsModal = (booking) => {
        setSelectedBooking(booking);
        setOpenPackageDetailsModal(true);
        console.log(selectedBooking);
    };

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
        if (value === "canceled" || value == "cancelled") return "error";
        if (value === "awaiting for payment") return "primary";
        return "primary";
    };

    const handleSalesListSearch = async () => {

        if (startDate === null || startDate === "" || endDate === null || endDate === "") {
            window.alert("Se deben seleccionar dos fechas válidas para la busqueda.");
            return;
        }

        try {
            if (includeCanceled) {
                const response = await bookingService.getBookingsByDateRange(startDate.format("YYYY-MM-DDTHH:mm:ss"), endDate.format("YYYY-MM-DDTHH:mm:ss"));
                setRankings(response.data);
            } else {
                const filters = {
                    minDate: startDate.format("YYYY-MM-DDTHH:mm:ss"),
                    maxDate: endDate.format("YYYY-MM-DDTHH:mm:ss"),
                };
                const response = await paymentService.getByFilters(filters);
                setRankings(response.data);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <Container>
            <Stack spacing={1.3}>
                <Card
                    elevation={4}
                    sx={{
                        width: "fit-content",
                        maxWidth: "100%",
                        mx: "auto",
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
                                md: "200px 200px 240px 200px",
                            },
                            gap: 2,
                            alignItems: "center",
                            width: "100%",
                            p: 2,
                        }}
                    >

                        {/* Select Start Date */}
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Fecha de inicio"
                                    value={startDate}
                                    onChange={(newValue) => setStartDate(newValue)}
                                    slotProps={{
                                        textField: { fullWidth: true }
                                    }}
                                />
                            </LocalizationProvider>
                        </Box>

                        {/* Select End Date */}
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="Fecha de término"
                                    value={endDate}
                                    onChange={(newValue) => setEndDate(newValue)}
                                    slotProps={{
                                        textField: { fullWidth: true }
                                    }}
                                />
                            </LocalizationProvider>
                        </Box>

                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "right",
                                alignItems: "center",
                            }}
                        >
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={includeCanceled}
                                        onChange={(e) => setIncludeCanceled(e.target.checked)}
                                    />
                                }
                                label="¿Incluir canceladas?"
                            />
                        </Box>

                        <Button
                            variant="contained"
                            size="small"
                            sx={{
                                borderRadius: 3,
                                minWidth: 170,
                                boxShadow: 2,
                            }}
                            onClick={handleSalesListSearch}
                        >
                            Realizar busqueda
                        </Button>

                    </Box>
                </Card>

                {rankings.length === 0 ? (
                    <Typography variant="h6" sx={{ mt: 4, textAlign: "center" }}>
                        No hay resultados.
                    </Typography>
                ) : (
                    <Stack spacing={2} sx={{ width: "100%" }}>
                        {rankings.map((ranking, index) => {
                            return (
                                !includeCanceled ? (
                                    <Box
                                        key={index}
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
                                                        md: "80px 320px 360px 160px",
                                                    },
                                                    gap: 2,
                                                    alignItems: "center",
                                                    width: "100%",
                                                    p: 2,
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        textAlign: "center",
                                                        minHeight: 110,
                                                        borderRight: { xs: "none", md: "1px solid rgba(0,0,0,0.12)" },
                                                        px: { xs: 0, md: 0 },
                                                    }}
                                                >
                                                    <Typography variant="h2">
                                                        {index + 1}{"."}
                                                    </Typography>
                                                </Box>
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
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                gap: 1,
                                                                flexWrap: "wrap",
                                                            }}
                                                        >
                                                            <PersonIcon fontSize="small" color="action" />
                                                            <Typography variant="body1">
                                                                <strong>Usuario: </strong>{ranking.booking.user.userName}
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
                                                                onClick={() => handleUserDetailsModal(ranking.booking)}
                                                            >
                                                                <MenuSharpIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Stack>

                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                gap: 1,
                                                                flexWrap: "wrap",
                                                            }}
                                                        >
                                                            <InventoryIcon fontSize="small" color="action" />
                                                            <Typography variant="body1">
                                                                <strong>Paquete: </strong> {ranking.booking.pack.packageName}
                                                            </Typography>
                                                            <IconButton
                                                                color="default"
                                                                sx={{
                                                                    borderRadius: 3,
                                                                    boxShadow: 2,
                                                                    width: 35,
                                                                    height: 35,
                                                                }}
                                                                onClick={() => handlePackageDetailsModal(ranking.booking)}
                                                            >
                                                                <MenuSharpIcon />
                                                            </IconButton>
                                                        </Box>
                                                    </Stack>
                                                </Box>

                                                {/* NUMBER OF PASSENGERS, PRICE, PAYMENT DATE */}
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
                                                                variant="body1"
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    lineHeight: 1,
                                                                }}
                                                            >
                                                                <strong>Número de pasajeros:</strong>&nbsp;{ranking.booking.passengers}
                                                            </Typography>
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
                                                                variant="body1"
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    lineHeight: 1,
                                                                }}
                                                            >
                                                                <strong>Monto: </strong>&nbsp;{formatPrice(ranking.booking.bookingTotalPrice)}
                                                            </Typography>
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
                                                            <CalendarMonthIcon fontSize="small" color="action" />
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    lineHeight: 1,
                                                                }}
                                                            >
                                                                <strong>Fecha de pago: </strong>&nbsp;{formatDate(ranking.paymentDate)}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </Box>

                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        textAlign: "center",
                                                        minHeight: 110,
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
                                                            <Typography
                                                                variant="h6"
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    lineHeight: 1,
                                                                }}
                                                            >
                                                                <strong>Estado:</strong>
                                                            </Typography>
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
                                                            <Typography
                                                                variant="h4"
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    lineHeight: 1,
                                                                }}
                                                                color="success"
                                                            >
                                                                <strong></strong>{translateState(ranking.booking.bookingState)}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </Box>

                                            </Box>
                                        </Card>
                                    </Box>
                                ) : (
                                    <Box
                                        key={index}
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
                                                        md: "80px 320px 360px 160px",
                                                    },
                                                    gap: 2,
                                                    alignItems: "center",
                                                    width: "100%",
                                                    p: 2,
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        textAlign: "center",
                                                        minHeight: 110,
                                                        borderRight: { xs: "none", md: "1px solid rgba(0,0,0,0.12)" },
                                                        px: { xs: 0, md: 0 },
                                                    }}
                                                >
                                                    <Typography variant="h2">
                                                        {index + 1}{"."}
                                                    </Typography>
                                                </Box>
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
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                gap: 1,
                                                                flexWrap: "wrap",
                                                            }}
                                                        >
                                                            <PersonIcon fontSize="small" color="action" />
                                                            <Typography variant="body1">
                                                                <strong>Usuario: </strong>{ranking.user.userName}
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
                                                                onClick={() => handleUserDetailsModal(ranking)}
                                                            >
                                                                <MenuSharpIcon fontSize="small" />
                                                            </IconButton>
                                                        </Box>
                                                    </Stack>

                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                gap: 1,
                                                                flexWrap: "wrap",
                                                            }}
                                                        >
                                                            <InventoryIcon fontSize="small" color="action" />
                                                            <Typography variant="body1">
                                                                <strong>Paquete: </strong> {ranking.pack.packageName}
                                                            </Typography>
                                                            <IconButton
                                                                color="default"
                                                                sx={{
                                                                    borderRadius: 3,
                                                                    boxShadow: 2,
                                                                    width: 35,
                                                                    height: 35,
                                                                }}
                                                                onClick={() => handlePackageDetailsModal(ranking)}
                                                            >
                                                                <MenuSharpIcon />
                                                            </IconButton>
                                                        </Box>
                                                    </Stack>
                                                </Box>

                                                {/* NUMBER OF PASSENGERS, PRICE, PAYMENT DATE */}
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
                                                                variant="body1"
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    lineHeight: 1,
                                                                }}
                                                            >
                                                                <strong>Número de pasajeros:</strong>&nbsp;{ranking.passengers}
                                                            </Typography>
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
                                                                variant="body1"
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    lineHeight: 1,
                                                                }}
                                                            >
                                                                <strong>Monto: </strong>&nbsp;{formatPrice(ranking.bookingTotalPrice)}
                                                            </Typography>
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
                                                            <CalendarMonthIcon fontSize="small" color="action" />
                                                            <Typography
                                                                variant="body1"
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    lineHeight: 1,
                                                                }}
                                                            >
                                                                <strong>Fecha de pago: </strong>&nbsp;{formatDate(ranking.bookingDate)}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </Box>

                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        textAlign: "center",
                                                        minHeight: 110,
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
                                                            <Typography
                                                                variant="h6"
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    lineHeight: 1,
                                                                }}
                                                            >
                                                                <strong>Estado:</strong>
                                                            </Typography>
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
                                                            <Typography
                                                                variant="h4"
                                                                sx={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    lineHeight: 1,
                                                                }}
                                                                color={getStateColor(ranking.bookingState)}
                                                            >
                                                                <strong></strong>{translateState(ranking.bookingState)}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </Box>

                                            </Box>
                                        </Card>
                                    </Box>
                                ));
                        })}
                    </Stack>
                )}
            </Stack>

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
        </Container>
    );
};

export default Rankings;