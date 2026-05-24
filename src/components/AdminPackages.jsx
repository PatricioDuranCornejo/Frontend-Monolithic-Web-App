import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import packageService from "../services/package.service";
import bookingService from "../services/booking.service";
import userService from "../services/user.service";
import { useKeycloak } from "@react-keycloak/web";

import {
    Autocomplete,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    TextField,
    Typography,
    Modal,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Fade,
    MenuItem,
    InputLabel,
    Select,
    FormControl
} from "@mui/material";

import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PaidIcon from "@mui/icons-material/Paid";
import PeopleIcon from "@mui/icons-material/People";
import CreateIcon from '@mui/icons-material/Create';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useLocation } from "react-router-dom";
import { useSearchParams } from "react-router-dom";

const emptyForm = {
    packageId: null,

    packageName: "",
    packageDestiny: "",
    packageDescription: "",
    packageExperienceType: "",

    startDate: "",
    endDate: "",

    packagePrice: "",
    packageCapacity: "",
    packageStockAvailable: "",

    packageState: "",
};

const AdminPackages = () => {
    const { keycloak } = useKeycloak();
    const [packages, setPackages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const filters = location.state || {};
    const [searchParams] = useSearchParams();
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [packageDialog, setPackageDialog] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    useEffect(() => {
        packageService.getAll()
            .then((response) => setPackages(response.data))
            .catch(console.error);
    }, [searchParams]);

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

    const getStateColor = (state) => {
        const value = String(state || "").toLowerCase();
        if (value === "available") return "success";
        if (value === "sold out" || value == "cancelled") return "error";
        if (value === "out of date") return "default";
        return "primary";
    };

    const translateState = (state) => {
        const value = String(state || "").toLowerCase();
        if (value === "available") return "Disponible";
        if (value === "sold out") return "Vendido";
        if (value === "cancelled") return "Cancelado";
        if (value === "out of date") return "Caducado";
        return "Desconocido";
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

    // Generate placeholder image URL (using picsum.photos for demo)
    const getPlaceholderImage = (packageId) => {
        // Using a consistent seed based on packageId for the same image per package
        return `https://picsum.photos/seed/${packageId}/800/600`;
    };

    const handlePositiveIntegerChange = (e) => {
        const { name, value } = e.target;

        if (value === "") {
            setForm((prev) => ({ ...prev, [name]: "" }));
            return;
        }

        if (!/^\d+$/.test(value)) return;

        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const createOrEditPackage = (pack, isEdit) => {
        setPackageDialog(true);
        if (isEdit) {
            console.log("Editar");
            setIsEdit(true);
            setForm({
                packageId: pack.packageId,

                packageName: pack.packageName,
                packageDestiny: pack.packageDestiny,
                packageDescription: pack.packageDescription,
                packageExperienceType: pack.packageExperienceType,

                startDate: pack.startDate,
                endDate: pack.endDate,

                packagePrice: pack.packagePrice,
                packageCapacity: pack.packageCapacity,
                packageStockAvailable: pack.packageStockAvailable,

                packageState: pack.packageState,
            });
        } else {
            console.log("Crear");
            setIsEdit(false);
            setForm(emptyForm);
        }
    };

    const isValidPositiveInteger = (value) => {
        const num = Number(value);
        return Number.isInteger(num) && num > 0;
    };

    const isValidStr = (name) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name.trim());

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!isEdit) {
            form.packageStockAvailable = form.packageCapacity;
        }

        const requiredFields = [
            "packageName",
            "packageDestiny",
            "packageDescription",
            "packageExperienceType",
            "startDate",
            "endDate",
            "packagePrice",
            "packageCapacity",
            "packageStockAvailable",
            "packageState",
        ];

        for (const field of requiredFields) {
            if (form[field] === "" || form[field] === null || form[field] === undefined) {
                console.log(field);
                setError("Debes completar todos los campos obligatorios.");
                return;
            }
        }

        if (!isValidStr(form.packageName)) {
            setError("El paquete debe tener un nombre válido");
            return;
        }

        if (!isValidStr(form.packageDestiny)) {
            setError("El número de reservas debe ser un entero positivo.");
            return;
        }

        if (!isValidStr(form.packageDescription)) {
            setError("Las horas entre reservas deben ser un entero positivo.");
            return;
        }

        if (!isValidStr(form.packageExperienceType)) {
            setError("La cantidad de reservas debe ser un entero positivo.");
            return;
        }

        const start = new Date(form.startDate);
        const end = new Date(form.endDate);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            setError("Las fechas no son válidas.");
            return;
        }

        if (end < start) {
            setError("La fecha de término no puede ser anterior a la de inicio.");
            return;
        }

        if (!isValidPositiveInteger(form.packagePrice)) {
            setError("La cantidad de reservas debe ser un entero positivo.");
            return;
        }

        if (!isValidPositiveInteger(form.packageCapacity)) {
            setError("La cantidad de reservas debe ser un entero positivo.");
            return;
        }

        if (!isValidPositiveInteger(form.packageStockAvailable)) {
            setError("La cantidad de reservas debe ser un entero positivo.");
            return;
        }

        const payload = {
            packageId: form.packageId,

            packageName: form.packageName,
            packageDestiny: form.packageDestiny,
            packageDescription: form.packageDescription,
            packageExperienceType: form.packageExperienceType,

            startDate: form.startDate,
            endDate: form.endDate,

            packagePrice: form.packagePrice,
            packageCapacity: form.packageCapacity,
            packageStockAvailable: form.packageStockAvailable,

            packageState: form.packageState,
        };

        try {
            setSaving(true);
            console.log(payload);
            if (isEdit) {
                await packageService.update(payload);
                setSuccess("Paquete actualizado correctamente.");
            } else {
                payload.packageStockAvailable = payload.packageCapacity;
                await packageService.save(payload);
                setSuccess("Paquete creado correctamente.");
            }
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Ocurrió un error al subir el paquete. Intenta nuevamente."
            );
        } finally {
            setSaving(false);
            window.location.reload();
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar este paquete?")) {
            try {
                await packageService.deletePackage(id);
                window.location.reload();
            } catch (err) {
                window.alert(err?.response?.data?.message || "Ocurrió un error al eliminar el paquete.")
            }
        }
    }

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
                Administración de paquetes
            </Typography>

            <Typography
                variant="body1"
                sx={{ mb: 4, opacity: 0.8, textAlign: "center" }}
            >
                Paquetes disponibles actualmente.
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={() => createOrEditPackage(null, false)}
                    sx={{
                        borderRadius: 3,
                        minWidth: 170,
                        boxShadow: 2,
                    }}
                >
                    Añadir paquete
                </Button>
            </Box>

            {packages.length === 0 ? (
                <Typography variant="h6" sx={{ mt: 4, textAlign: "center" }}>
                    No hay paquetes disponibles.
                </Typography>
            ) : (
                <Stack spacing={2} sx={{ width: "100%" }}>
                    {packages.map((pkg) => {
                        const placeholderImage = getPlaceholderImage(pkg.packageId);

                        return (
                            <Box
                                key={pkg.packageId}
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
                                                md: "150px 220px 280px 250px",
                                            },
                                            gap: 2,
                                            alignItems: "center",
                                            width: "100%",
                                            p: 2,
                                        }}
                                    >
                                        {/* LEFT SECTION: PACKAGE IMAGE */}
                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
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
                                                    alt={pkg.packageName}
                                                    sx={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                    }}
                                                />
                                            </Box>
                                        </Box>

                                        {/* PACKAGE NAME, DESTINY & STATE */}
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
                                            <Typography variant="h5" fontWeight="bold">
                                                {pkg.packageName}
                                            </Typography>

                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                <LocationOnIcon fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    <strong>Destino:</strong> {pkg.packageDestiny}
                                                </Typography>
                                            </Stack>

                                            <Typography variant="body2">
                                                <strong>Tipo:</strong> {pkg.packageExperienceType}
                                            </Typography>


                                        </Box>

                                        {/* CENTER SECTION: DATES */}
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
                                                        <strong>Inicio:</strong> {formatDate(pkg.startDate)}
                                                    </Typography>
                                                </Stack>

                                                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                                    <CalendarMonthIcon fontSize="small" color="action" />
                                                    <Typography variant="body2">
                                                        <strong>Fin:</strong> {formatDate(pkg.endDate)}
                                                    </Typography>
                                                </Stack>

                                                <Stack spacing={1.3}>
                                                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                                        <PeopleIcon fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            <strong>Cupo total:</strong> {pkg.packageCapacity}
                                                        </Typography>
                                                    </Stack>

                                                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                                                        <PeopleIcon fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            <strong>Cupos disponibles:</strong> {pkg.packageStockAvailable}
                                                        </Typography>
                                                    </Stack>
                                                </Stack>
                                            </Stack>
                                        </Box>

                                        {/* RIGHT SECTION: PRICE, STATE, EDIT & DELETE */}
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
                                            <Stack direction="row" spacing={1.2} alignItems="center">
                                                <PaidIcon fontSize="small" color="success" />
                                                <Typography variant="body2" color="success">
                                                    <strong>Precio:</strong> {formatPrice(pkg.packagePrice)}
                                                </Typography>
                                            </Stack>

                                            <Chip
                                                label={translateState(pkg.packageState)}
                                                color={getStateColor(pkg.packageState)}
                                                size="small"
                                            />

                                            <Box
                                                sx={{
                                                    display: "grid",
                                                    gridTemplateColumns: {
                                                        xs: "1fr",
                                                        md: "125px 125px",
                                                    },
                                                    gap: 1,
                                                    alignItems: "center",
                                                    width: "100%",
                                                    p: 0,
                                                }}
                                            >
                                                <Button
                                                    variant="contained"
                                                    size="large"
                                                    startIcon={<CreateIcon />}
                                                    onClick={() => createOrEditPackage(pkg, true)}
                                                    sx={{
                                                        borderRadius: 3,
                                                        boxShadow: 2,
                                                    }}
                                                >
                                                    Editar
                                                </Button>

                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    size="large"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() => handleDelete(pkg.packageId)}
                                                    sx={{
                                                        borderRadius: 3,
                                                        boxShadow: 2,
                                                    }}
                                                >
                                                    Borrar
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* ACCORDION SECTION: PACKAGE DESCRIPTION */}
                                    <Accordion
                                        expanded={expanded === `panel-${pkg.packageId}`}
                                        onChange={handleAccordionChange(`panel-${pkg.packageId}`)}
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
                                                {pkg.packageDescription ||
                                                    "No hay descripción disponible para este paquete."}
                                            </Typography>
                                        </AccordionDetails>
                                    </Accordion>
                                </Card>
                            </Box>
                        );
                    })}
                </Stack>
            )}

            {/* IMAGE MODAL/LIGHTBOX */}
            <Modal
                open={!!selectedImage}
                onClose={handleImageClose}
                closeAfterTransition
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(0,0,0,0.9)",
                    backdropFilter: "blur(4px)",
                }}
            >
                <Fade in={!!selectedImage}>
                    <Box
                        sx={{
                            position: "relative",
                            maxWidth: "90vw",
                            maxHeight: "90vh",
                            outline: "none",
                        }}
                    >
                        {/* Close button */}
                        <IconButton
                            onClick={handleImageClose}
                            sx={{
                                position: "absolute",
                                top: -40,
                                right: 0,
                                color: "white",
                                backgroundColor: "rgba(255,255,255,0.1)",
                                "&:hover": {
                                    backgroundColor: "rgba(255,255,255,0.2)",
                                },
                                zIndex: 1,
                            }}
                        >
                            <CloseIcon fontSize="large" />
                        </IconButton>

                        {/* Full size image */}
                        <Box
                            component="img"
                            src={selectedImage}
                            alt="Package full view"
                            sx={{
                                maxWidth: "90vw",
                                maxHeight: "90vh",
                                objectFit: "contain",
                                borderRadius: 2,
                                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                            }}
                        />
                    </Box>
                </Fade>
            </Modal>

            <Dialog open={packageDialog} onClose={() => setPackageDialog(false)} fullWidth maxWidth="sm" >

                <DialogTitle variant="h4" sx={{ mb: -1 }}>
                    {isEdit ? "Editar paquete" : "Crear paquete"}
                </DialogTitle>

                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            {success}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Stack spacing={2}>
                            <Box>
                                <Stack spacing={2} sx={{ mt: 2 }}>
                                    <TextField
                                        label="Nombre del paquete"
                                        name="packageName"
                                        value={form.packageName}
                                        onChange={handleChange}
                                        type="text"
                                        fullWidth
                                        required
                                    />

                                    <TextField
                                        label="Destino del paquete"
                                        name="packageDestiny"
                                        value={form.packageDestiny}
                                        onChange={handleChange}
                                        type="text"
                                        fullWidth
                                        required
                                    />

                                    <TextField
                                        id="outlined-multiline-flexible"
                                        label="Descripción del paquete"
                                        name="packageDescription"
                                        value={form.packageDescription}
                                        onChange={handleChange}
                                        type="text"
                                        multiline
                                        fullWidth
                                        required
                                    />

                                    <TextField
                                        label="Tipo de experiencia"
                                        name="packageExperienceType"
                                        value={form.packageExperienceType}
                                        onChange={handleChange}
                                        type="text"
                                        fullWidth
                                        required
                                    />

                                    <TextField
                                        name="startDate"
                                        value={form.startDate}
                                        onChange={handleChange}
                                        helperText="Fecha de inicio"
                                        type="datetime-local"
                                        fullWidth
                                        required
                                        InputLabelProps={{ shrink: true }}
                                    />

                                    <TextField
                                        name="endDate"
                                        value={form.endDate}
                                        onChange={handleChange}
                                        helperText="Fecha de término"
                                        type="datetime-local"
                                        fullWidth
                                        required
                                        InputLabelProps={{ shrink: true }}
                                    />

                                    <TextField
                                        label="Precio del paquete"
                                        name="packagePrice"
                                        value={form.packagePrice}
                                        onChange={handlePositiveIntegerChange}
                                        type="text"
                                        inputProps={{
                                            inputMode: "numeric",
                                            pattern: "[0-9]*",
                                        }}
                                        fullWidth
                                        required
                                    />

                                    <TextField
                                        label="Capacidad del paquete"
                                        name="packageCapacity"
                                        value={form.packageCapacity}
                                        onChange={handlePositiveIntegerChange}
                                        type="text"
                                        inputProps={{
                                            inputMode: "numeric",
                                            pattern: "[0-9]*",
                                        }}
                                        fullWidth
                                        required
                                    />

                                    {isEdit &&
                                        <TextField
                                            label="Stock disponible"
                                            name="packageStockAvailable"
                                            value={form.packageStockAvailable}
                                            onChange={handlePositiveIntegerChange}
                                            type="text"
                                            inputProps={{
                                                inputMode: "numeric",
                                                pattern: "[0-9]*",
                                            }}
                                            fullWidth
                                            required
                                        />
                                    }

                                    <FormControl fullWidth>
                                        <InputLabel id="demo-simple-select-label">Estado del paquete</InputLabel>
                                        <Select
                                            labelId="demo-simple-select-label"
                                            id="demo-simple-select"
                                            value={form.packageState}
                                            label="Estado del paquete"
                                            name="packageState"
                                            onChange={handleChange}
                                        >
                                            <MenuItem value={"Available"}>Disponible</MenuItem>
                                            <MenuItem value={"Canceled"}>Cancelado</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        disabled={saving}
                                        sx={{ alignSelf: "flex-end", minWidth: 180 }}
                                    >
                                        {saving ? <CircularProgress size={24} /> : "Guardar cambios"}
                                    </Button>

                                </Stack>
                            </Box>
                        </Stack>
                    </Box>
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default AdminPackages;