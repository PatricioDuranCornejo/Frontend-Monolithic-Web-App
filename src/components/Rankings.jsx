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
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Switch,
    TextField,
    Alert,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PaidIcon from "@mui/icons-material/Paid";
import PeopleIcon from "@mui/icons-material/People";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";
import MenuSharpIcon from '@mui/icons-material/MenuSharp';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
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
    const [selectedImage, setSelectedImage] = useState(null);
    const [expanded, setExpanded] = useState(false);

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [searchFilter, setSearchFilter] = useState("");
    const [filterSelected, setFilterSelected] = useState(false);
    const [error, setError] = useState("");

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
        if (value === "available") return "Disponible";
        if (value === "sold out") return "Vendido";
        if (value === "cancelled") return "Cancelado";
        if (value === "out of date") return "Caducado";
        return "Desconocido";
    };

    const getStateColor = (state) => {
        const value = String(state || "").toLowerCase();
        if (value === "available") return "success";
        if (value === "sold out" || value == "cancelled") return "error";
        if (value === "out of date") return "default";
        return "primary";
    };

    const handleSalesListSearch = async () => {
        if (startDate === null || startDate === "" || endDate === null || endDate === "") {
            window.alert("Se deben seleccionar dos fechas válidas para la busqueda.");
            return;
        }

        try {
            console.log(searchFilter);
            if (searchFilter === "Amount of bookings") {
                const response = await paymentService.rankBySoldAmount(startDate.format("YYYY-MM-DDTHH:mm:ss"), endDate.format("YYYY-MM-DDTHH:mm:ss"));
                setRankings(response.data);
                console.log(response.data);

            } else if (searchFilter === "Number of passengers") {
                const response = await paymentService.rankByPassengersAmount(startDate.format("YYYY-MM-DDTHH:mm:ss"), endDate.format("YYYY-MM-DDTHH:mm:ss"));
                setRankings(response.data);
                console.log(response.data);

            } else if (searchFilter === "Total sales amount") {
                const response = await paymentService.rankByTotalSale(startDate.format("YYYY-MM-DDTHH:mm:ss"), endDate.format("YYYY-MM-DDTHH:mm:ss"));
                setRankings(response.data);
                console.log(response.data);
            }
        } catch (error) {
            console.error("Error:", error);
        }
        setFilterSelected(false);
    };

    const handleSearchFilterChange = (event) => {
        setSearchFilter(event.target.value);
        setFilterSelected(true);
    }

    // Generate placeholder image URL (using picsum.photos for demo)
    const getPlaceholderImage = (packageId) => {
        // Using a consistent seed based on packageId for the same image per package
        return `https://picsum.photos/seed/${packageId}/800/600`;
    };

    // Handle image modal open
    const handleImageOpen = (imageUrl) => {
        setSelectedImage(imageUrl);
    };

    // Handle image modal close
    const handleImageClose = () => {
        setSelectedImage(null);
    };

    // Handle accordion change
    const handleAccordionChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    return (
        <Container>
            <Stack spacing={2}>

                <Typography variant="h5" sx={{ mt: 4, textAlign: "center" }}>
                    Ranking de paquetes vendidos por período
                </Typography>

                <Card
                    elevation={4}
                    sx={{
                        width: "fit-content",
                        maxWidth: "100%",
                        mx: "auto",
                        borderRadius: 4,
                        overflow: "hidden",
                        alignSelf: "center",
                    }}
                >

                    {/* Main content grid */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "200px 200px 230px 200px",
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

                        {/* Select Filter */}
                        <FormControl fullWidth>
                            <InputLabel id="demo-simple-select-label">Filtro de búsqueda</InputLabel>
                            <Select
                                labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                label="Filtro de búsqueda"
                                value={searchFilter}
                                onChange={(e) => handleSearchFilterChange(e)}
                            >
                                <MenuItem value={"Amount of bookings"}>Cantidad de reservas</MenuItem>
                                <MenuItem value={"Number of passengers"}>Número de pasajeros</MenuItem>
                                <MenuItem value={"Total sales amount"}>Monto total vendido</MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<SearchIcon />}
                            sx={{
                                borderRadius: 3,
                                minWidth: 180,
                                boxShadow: 2,
                            }}
                            onClick={handleSalesListSearch}
                        >
                            Realizar busqueda
                        </Button>

                    </Box>
                </Card>
            </Stack>

            <Stack spacing={2} sx={{ mt: 3 }}>
                {rankings.length === 0 ? (
                    <Typography variant="h6" sx={{ mt: 4, textAlign: "center" }}>
                        No hay rankings disponibles.
                    </Typography>
                ) : (
                    <Stack spacing={2} sx={{ width: "100%" }}>
                        {rankings.map((pkg, index) => {
                            const placeholderImage = getPlaceholderImage(pkg[0].packageId);
                            return (
                                searchFilter === "Amount of bookings" && !filterSelected ? (
                                    <Box
                                        key={pkg[0].packageId}
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
                                                        md: "130px 180px 180px 280px 130px",
                                                    },
                                                    gap: 2,
                                                    alignItems: "center",
                                                    width: "100%",
                                                    p: 2,
                                                }}
                                            >
                                                {/* LEFT SECTION: RANK POSITION */}
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    <Typography variant="h2">
                                                        {index + 1}{"."}
                                                    </Typography>
                                                </Box>

                                                {/* PACKAGE IMAGE */}
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        borderLeft: { xs: "none", md: "1px solid rgba(0,0,0,0.12)" },
                                                    }}
                                                >
                                                    <Box
                                                        onClick={() => handleImageOpen(placeholderImage)}
                                                        sx={{
                                                            width: "100%",
                                                            maxWidth: 140,
                                                            height: 100,
                                                            borderRadius: 2,
                                                            overflow: "hidden",
                                                            cursor: "pointer",
                                                            position: "relative",
                                                            "&:hover": {
                                                                boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
                                                                transform: "scale(1.02)",
                                                            },
                                                            transition: "all 0.3s ease-in-out",
                                                        }}
                                                    >
                                                        <Box
                                                            component="img"
                                                            src={placeholderImage}
                                                            alt={pkg[0].packageName}
                                                            sx={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit: "cover",
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>

                                                {/* PACKAGE NAME, DESTINY, TYPE & STATE */}
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        textAlign: "center",
                                                        minHeight: 110,
                                                        gap: 0.5,
                                                    }}
                                                >
                                                    <Typography variant="h5" fontWeight="bold">
                                                        {pkg[0].packageName}
                                                    </Typography>

                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <LocationOnIcon fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            <strong>Destino:</strong> {pkg[0].packageDestiny}
                                                        </Typography>
                                                    </Stack>

                                                    <Typography variant="body2">
                                                        <strong>Tipo:</strong> {pkg[0].packageExperienceType}
                                                    </Typography>

                                                    <Chip
                                                        label={translateState(pkg[0].packageState)}
                                                        color={getStateColor(pkg[0].packageState)}
                                                        size="small"
                                                    />

                                                </Box>

                                                {/* DATES, CAPACITY & PRICE */}
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
                                                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                                            <CalendarMonthIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">
                                                                <strong>Inicio:</strong> {formatDate(pkg[0].startDate)}
                                                            </Typography>
                                                        </Stack>

                                                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                                            <CalendarMonthIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">
                                                                <strong>Fin:</strong> {formatDate(pkg[0].endDate)}
                                                            </Typography>
                                                        </Stack>

                                                        <Stack spacing={1.3}>
                                                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                                                <PeopleIcon fontSize="small" color="action" />
                                                                <Typography variant="body2">
                                                                    <strong>Cupos:</strong> {pkg[0].packageStockAvailable} <strong>(Total: {pkg[0].packageCapacity})</strong>
                                                                </Typography>
                                                            </Stack>
                                                        </Stack>

                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <PaidIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">
                                                                <strong>Precio:</strong> {formatPrice(pkg[0].packagePrice)}
                                                            </Typography>
                                                        </Stack>

                                                    </Stack>
                                                </Box>

                                                {/* RANKING CRITERIA */}
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

                                                    <Stack spacing={1.3}>

                                                        <Stack spacing={0.5}>
                                                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                                                <Typography variant="body2">
                                                                    <strong>Reservas realizadas:</strong>
                                                                </Typography>
                                                            </Stack>

                                                            <Typography variant="h5">
                                                                {pkg[1]}
                                                            </Typography>

                                                        </Stack>
                                                    </Stack>
                                                </Box>
                                            </Box>

                                            {/* ACCORDION SECTION: PACKAGE DESCRIPTION */}
                                            <Accordion
                                                expanded={expanded === `panel-${pkg[0].packageId}`}
                                                onChange={handleAccordionChange(`panel-${pkg[0].packageId}`)}
                                                elevation={0}
                                                sx={{
                                                    "&:before": {
                                                        display: "none",
                                                    },
                                                    borderTop: "1px solid rgba(0,0,0,0.12)",
                                                }}
                                            >
                                                <AccordionSummary
                                                    expandIcon={<ExpandMoreIcon />}
                                                    sx={{
                                                        backgroundColor: "rgba(0,0,0,0.02)",
                                                        "&:hover": {
                                                            backgroundColor: "rgba(0,0,0,0.04)",
                                                        },
                                                    }}
                                                >
                                                    <Typography variant="subtitle1" fontWeight="medium">
                                                        Descripción del paquete
                                                    </Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                                                        {pkg[0].packageDescription ||
                                                            "No hay descripción disponible para este paquete."}
                                                    </Typography>
                                                </AccordionDetails>
                                            </Accordion>
                                        </Card>
                                    </Box>
                                ) : searchFilter === "Number of passengers" && !filterSelected ? (
                                    <Box
                                        key={pkg[0].packageId}
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
                                                        md: "130px 180px 180px 280px 130px",
                                                    },
                                                    gap: 2,
                                                    alignItems: "center",
                                                    width: "100%",
                                                    p: 2,
                                                }}
                                            >
                                                {/* LEFT SECTION: RANK POSITION */}
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    <Typography variant="h2">
                                                        {index + 1}{"."}
                                                    </Typography>
                                                </Box>

                                                {/* PACKAGE IMAGE */}
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        borderLeft: { xs: "none", md: "1px solid rgba(0,0,0,0.12)" },
                                                    }}
                                                >
                                                    <Box
                                                        onClick={() => handleImageOpen(placeholderImage)}
                                                        sx={{
                                                            width: "100%",
                                                            maxWidth: 140,
                                                            height: 100,
                                                            borderRadius: 2,
                                                            overflow: "hidden",
                                                            cursor: "pointer",
                                                            position: "relative",
                                                            "&:hover": {
                                                                boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
                                                                transform: "scale(1.02)",
                                                            },
                                                            transition: "all 0.3s ease-in-out",
                                                        }}
                                                    >
                                                        <Box
                                                            component="img"
                                                            src={placeholderImage}
                                                            alt={pkg[0].packageName}
                                                            sx={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit: "cover",
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>

                                                {/* PACKAGE NAME, DESTINY, TYPE & STATE */}
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        textAlign: "center",
                                                        minHeight: 110,
                                                        gap: 0.5,
                                                    }}
                                                >
                                                    <Typography variant="h5" fontWeight="bold">
                                                        {pkg[0].packageName}
                                                    </Typography>

                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <LocationOnIcon fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            <strong>Destino:</strong> {pkg[0].packageDestiny}
                                                        </Typography>
                                                    </Stack>

                                                    <Typography variant="body2">
                                                        <strong>Tipo:</strong> {pkg[0].packageExperienceType}
                                                    </Typography>

                                                    <Chip
                                                        label={translateState(pkg[0].packageState)}
                                                        color={getStateColor(pkg[0].packageState)}
                                                        size="small"
                                                    />

                                                </Box>

                                                {/* DATES, CAPACITY & PRICE */}
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
                                                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                                            <CalendarMonthIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">
                                                                <strong>Inicio:</strong> {formatDate(pkg[0].startDate)}
                                                            </Typography>
                                                        </Stack>

                                                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                                            <CalendarMonthIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">
                                                                <strong>Fin:</strong> {formatDate(pkg[0].endDate)}
                                                            </Typography>
                                                        </Stack>

                                                        <Stack spacing={1.3}>
                                                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                                                <PeopleIcon fontSize="small" color="action" />
                                                                <Typography variant="body2">
                                                                    <strong>Cupos:</strong> {pkg[0].packageStockAvailable} <strong>(Total: {pkg[0].packageCapacity})</strong>
                                                                </Typography>
                                                            </Stack>
                                                        </Stack>

                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <PaidIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">
                                                                <strong>Precio:</strong> {formatPrice(pkg[0].packagePrice)}
                                                            </Typography>
                                                        </Stack>

                                                    </Stack>
                                                </Box>

                                                {/* RANKING CRITERIA */}
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

                                                    <Stack spacing={1.3}>

                                                        <Stack spacing={0.5}>
                                                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                                                <Typography variant="body2">
                                                                    <strong>Número total de pasajeros:</strong>
                                                                </Typography>
                                                            </Stack>

                                                            <Typography variant="h5">
                                                                {pkg[1]}
                                                            </Typography>

                                                        </Stack>
                                                    </Stack>
                                                </Box>
                                            </Box>

                                            {/* ACCORDION SECTION: PACKAGE DESCRIPTION */}
                                            <Accordion
                                                expanded={expanded === `panel-${pkg[0].packageId}`}
                                                onChange={handleAccordionChange(`panel-${pkg[0].packageId}`)}
                                                elevation={0}
                                                sx={{
                                                    "&:before": {
                                                        display: "none",
                                                    },
                                                    borderTop: "1px solid rgba(0,0,0,0.12)",
                                                }}
                                            >
                                                <AccordionSummary
                                                    expandIcon={<ExpandMoreIcon />}
                                                    sx={{
                                                        backgroundColor: "rgba(0,0,0,0.02)",
                                                        "&:hover": {
                                                            backgroundColor: "rgba(0,0,0,0.04)",
                                                        },
                                                    }}
                                                >
                                                    <Typography variant="subtitle1" fontWeight="medium">
                                                        Descripción del paquete
                                                    </Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                                                        {pkg[0].packageDescription ||
                                                            "No hay descripción disponible para este paquete."}
                                                    </Typography>
                                                </AccordionDetails>
                                            </Accordion>
                                        </Card>
                                    </Box>
                                ) : searchFilter === "Total sales amount" && !filterSelected ? (
                                    <Box
                                        key={pkg[0].packageId}
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
                                                        md: "130px 180px 180px 250px 170px",
                                                    },
                                                    gap: 2,
                                                    alignItems: "center",
                                                    width: "100%",
                                                    p: 2,
                                                }}
                                            >
                                                {/* LEFT SECTION: RANK POSITION */}
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    <Typography variant="h2">
                                                        {index + 1}{"."}
                                                    </Typography>
                                                </Box>

                                                {/* PACKAGE IMAGE */}
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        borderLeft: { xs: "none", md: "1px solid rgba(0,0,0,0.12)" },
                                                    }}
                                                >
                                                    <Box
                                                        onClick={() => handleImageOpen(placeholderImage)}
                                                        sx={{
                                                            width: "100%",
                                                            maxWidth: 140,
                                                            height: 100,
                                                            borderRadius: 2,
                                                            overflow: "hidden",
                                                            cursor: "pointer",
                                                            position: "relative",
                                                            "&:hover": {
                                                                boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
                                                                transform: "scale(1.02)",
                                                            },
                                                            transition: "all 0.3s ease-in-out",
                                                        }}
                                                    >
                                                        <Box
                                                            component="img"
                                                            src={placeholderImage}
                                                            alt={pkg[0].packageName}
                                                            sx={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit: "cover",
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>

                                                {/* PACKAGE NAME, DESTINY, TYPE & STATE */}
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        textAlign: "center",
                                                        minHeight: 110,
                                                        gap: 0.5,
                                                    }}
                                                >
                                                    <Typography variant="h5" fontWeight="bold">
                                                        {pkg[0].packageName}
                                                    </Typography>

                                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                                        <LocationOnIcon fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            <strong>Destino:</strong> {pkg[0].packageDestiny}
                                                        </Typography>
                                                    </Stack>

                                                    <Typography variant="body2">
                                                        <strong>Tipo:</strong> {pkg[0].packageExperienceType}
                                                    </Typography>

                                                    <Chip
                                                        label={translateState(pkg[0].packageState)}
                                                        color={getStateColor(pkg[0].packageState)}
                                                        size="small"
                                                    />

                                                </Box>

                                                {/* DATES, CAPACITY & PRICE */}
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
                                                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                                            <CalendarMonthIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">
                                                                <strong>Inicio:</strong> {formatDate(pkg[0].startDate)}
                                                            </Typography>
                                                        </Stack>

                                                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                                            <CalendarMonthIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">
                                                                <strong>Fin:</strong> {formatDate(pkg[0].endDate)}
                                                            </Typography>
                                                        </Stack>

                                                        <Stack spacing={1.3}>
                                                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                                                <PeopleIcon fontSize="small" color="action" />
                                                                <Typography variant="body2">
                                                                    <strong>Cupos:</strong> {pkg[0].packageStockAvailable} <strong>(Total: {pkg[0].packageCapacity})</strong>
                                                                </Typography>
                                                            </Stack>
                                                        </Stack>

                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <PaidIcon fontSize="small" color="action" />
                                                            <Typography variant="body2">
                                                                <strong>Precio:</strong> {formatPrice(pkg[0].packagePrice)}
                                                            </Typography>
                                                        </Stack>

                                                    </Stack>
                                                </Box>

                                                {/* RANKING CRITERIA */}
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

                                                    <Stack spacing={1.3}>
                                                        <Stack spacing={0.5}>
                                                            <Typography variant="body2">
                                                                <strong>Monto total vendido:</strong>
                                                            </Typography>

                                                            <Typography variant="h5">
                                                                {formatPrice(pkg[1])}
                                                            </Typography>

                                                        </Stack>
                                                    </Stack>
                                                </Box>
                                            </Box>

                                            {/* ACCORDION SECTION: PACKAGE DESCRIPTION */}
                                            <Accordion
                                                expanded={expanded === `panel-${pkg[0].packageId}`}
                                                onChange={handleAccordionChange(`panel-${pkg[0].packageId}`)}
                                                elevation={0}
                                                sx={{
                                                    "&:before": {
                                                        display: "none",
                                                    },
                                                    borderTop: "1px solid rgba(0,0,0,0.12)",
                                                }}
                                            >
                                                <AccordionSummary
                                                    expandIcon={<ExpandMoreIcon />}
                                                    sx={{
                                                        backgroundColor: "rgba(0,0,0,0.02)",
                                                        "&:hover": {
                                                            backgroundColor: "rgba(0,0,0,0.04)",
                                                        },
                                                    }}
                                                >
                                                    <Typography variant="subtitle1" fontWeight="medium">
                                                        Descripción del paquete
                                                    </Typography>
                                                </AccordionSummary>
                                                <AccordionDetails>
                                                    <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                                                        {pkg[0].packageDescription ||
                                                            "No hay descripción disponible para este paquete."}
                                                    </Typography>
                                                </AccordionDetails>
                                            </Accordion>
                                        </Card>
                                    </Box>
                                ) : null
                            );
                        })}
                    </Stack>
                )}

            </Stack>



        </Container>
    );
};

export default Rankings;