import { useEffect, useState } from "react";
import discountsService from "../services/discounts.service";
import {
    Container,
    Card,
    Typography,
    Box,
    Stack,
    TextField,
    FormControlLabel,
    Switch,
    Button,
    Alert,
    CircularProgress,
    Divider,
} from "@mui/material";

const emptyForm = {
    bookingId: null,

    numberOfPassengers: "",
    passengersDiscountPercentage: "",
    passengersDiscountCumulative: false,

    numberOfBookings: "",
    frequentDiscountPercentage: "",
    frequentDiscountCumulative: false,

    hoursBetweenBookings: "",
    amountOfBookings: "",
    multipleBookingsDiscountPercentage: "",
    multipleBookingsDiscountCumulative: false,

    maxDiscountPercentage: "",

    timeLimitedDiscountStart: "",
    timeLimitedDiscountEnd: "",
    timeLimitedDiscountActive: false,
    timeLimitedDiscountPercentage: "",
    timeLimitedDiscountCumulative: false,
};

const SetDiscounts = () => {
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const normalizeDateTimeInput = (value) => {
        if (!value) return "";

        if (typeof value === "string") {
            return value.slice(0, 16);
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";

        const pad = (n) => String(n).padStart(2, "0");

        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
            date.getDate()
        )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const loadDiscounts = async () => {
        try {
            setLoading(true);
            const response = await discountsService.getDiscounts();
            const data = response.data;

            setForm({
                bookingId: data.bookingId ?? null,

                numberOfPassengers: data.numberOfPassengers ?? "",
                passengersDiscountPercentage: data.passengersDiscountPercentage ?? "",
                passengersDiscountCumulative:
                    data.passengersDiscountCumulative ??
                    data.isPassengersDiscountCumulative ??
                    false,

                numberOfBookings: data.numberOfBookings ?? "",
                frequentDiscountPercentage: data.frequentDiscountPercentage ?? "",
                frequentDiscountCumulative:
                    data.frequentDiscountCumulative ??
                    data.isFrequentDiscountCumulative ??
                    false,

                hoursBetweenBookings: data.hoursBetweenBookings ?? "",
                amountOfBookings: data.amountOfBookings ?? "",
                multipleBookingsDiscountPercentage:
                    data.multipleBookingsDiscountPercentage ?? "",
                multipleBookingsDiscountCumulative:
                    data.multipleBookingsDiscountCumulative ??
                    data.isMultipleBookingsDiscountCumulative ??
                    false,

                maxDiscountPercentage: data.maxDiscountPercentage ?? "",

                timeLimitedDiscountStart: normalizeDateTimeInput(
                    data.timeLimitedDiscountStart
                ),
                timeLimitedDiscountEnd: normalizeDateTimeInput(
                    data.timeLimitedDiscountEnd
                ),
                timeLimitedDiscountActive: data.timeLimitedDiscountActive ?? false,
                timeLimitedDiscountPercentage:
                    data.timeLimitedDiscountPercentage ?? "",
                timeLimitedDiscountCumulative:
                    data.timeLimitedDiscountCumulative ??
                    data.isTimeLimitedDiscountCumulative ??
                    false,
            });
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "No se pudieron cargar los descuentos."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDiscounts();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
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

    const handleDecimalBetweenZeroAndOneChange = (e) => {
        const { name, value } = e.target;

        if (value === "") {
            setForm((prev) => ({ ...prev, [name]: "" }));
            return;
        }

        const normalized = value.replace(",", ".");

        // Allows values like 0, 0.5, 0.12, 1, 1.0, 1.00 while typing
        if (!/^(0(?:\.\d{0,2})?|1(?:\.0{0,2})?)$/.test(normalized)) return;

        setForm((prev) => ({ ...prev, [name]: normalized }));
    };

    const isValidPercentage = (value) => {
        const num = Number(value);
        return Number.isFinite(num) && num >= 0 && num <= 1;
    };

    const isValidPositiveInteger = (value) => {
        const num = Number(value);
        return Number.isInteger(num) && num > 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const requiredFields = [
            "numberOfPassengers",
            "passengersDiscountPercentage",
            "numberOfBookings",
            "frequentDiscountPercentage",
            "hoursBetweenBookings",
            "amountOfBookings",
            "multipleBookingsDiscountPercentage",
            "maxDiscountPercentage",
            "timeLimitedDiscountStart",
            "timeLimitedDiscountEnd",
            "timeLimitedDiscountPercentage",
        ];

        for (const field of requiredFields) {
            if (form[field] === "" || form[field] === null || form[field] === undefined) {
                setError("Debes completar todos los campos obligatorios.");
                return;
            }
        }

        if (!isValidPositiveInteger(form.numberOfPassengers)) {
            setError("El número de pasajeros debe ser un entero positivo.");
            return;
        }

        if (!isValidPositiveInteger(form.numberOfBookings)) {
            setError("El número de reservas debe ser un entero positivo.");
            return;
        }

        if (!isValidPositiveInteger(form.hoursBetweenBookings)) {
            setError("Las horas entre reservas deben ser un entero positivo.");
            return;
        }

        if (!isValidPositiveInteger(form.amountOfBookings)) {
            setError("La cantidad de reservas debe ser un entero positivo.");
            return;
        }

        if (!isValidPercentage(form.passengersDiscountPercentage)) {
            setError("El descuento por pasajeros debe estar entre 0 y 1.");
            return;
        }

        if (!isValidPercentage(form.frequentDiscountPercentage)) {
            setError("El descuento por usuario frecuente debe estar entre 0 y 1.");
            return;
        }

        if (!isValidPercentage(form.multipleBookingsDiscountPercentage)) {
            setError("El descuento por múltiples reservas debe estar entre 0 y 1.");
            return;
        }

        if (!isValidPercentage(form.maxDiscountPercentage)) {
            setError("El descuento máximo debe estar entre 0 y 1.");
            return;
        }

        if (!isValidPercentage(form.timeLimitedDiscountPercentage)) {
            setError("El descuento temporal debe estar entre 0 y 1.");
            return;
        }

        const start = new Date(form.timeLimitedDiscountStart);
        const end = new Date(form.timeLimitedDiscountEnd);

        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            setError("Las fechas de descuento temporal no son válidas.");
            return;
        }

        if (end < start) {
            setError("La fecha de término no puede ser anterior a la de inicio.");
            return;
        }

        const payload = {
            bookingId: form.bookingId,

            numberOfPassengers: Number(form.numberOfPassengers),
            passengersDiscountPercentage: Number(form.passengersDiscountPercentage),
            passengersDiscountCumulative: form.passengersDiscountCumulative,

            numberOfBookings: Number(form.numberOfBookings),
            frequentDiscountPercentage: Number(form.frequentDiscountPercentage),
            frequentDiscountCumulative: form.frequentDiscountCumulative,

            hoursBetweenBookings: Number(form.hoursBetweenBookings),
            amountOfBookings: Number(form.amountOfBookings),
            multipleBookingsDiscountPercentage: Number(
                form.multipleBookingsDiscountPercentage
            ),
            multipleBookingsDiscountCumulative:
                form.multipleBookingsDiscountCumulative,

            maxDiscountPercentage: Number(form.maxDiscountPercentage),

            timeLimitedDiscountStart: form.timeLimitedDiscountStart,
            timeLimitedDiscountEnd: form.timeLimitedDiscountEnd,
            timeLimitedDiscountActive: form.timeLimitedDiscountActive,
            timeLimitedDiscountPercentage: Number(form.timeLimitedDiscountPercentage),
            timeLimitedDiscountCumulative: form.timeLimitedDiscountCumulative,
        };

        try {
            setSaving(true);
            console.log(payload);
            await discountsService.updateDiscounts(payload);
            setSuccess("Descuentos actualizados correctamente.");
            await loadDiscounts();
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Ocurrió un error al actualizar los descuentos."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Container sx={{ py: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
                    Configuración de descuentos
                </Typography>

                <Typography variant="body2" sx={{ mb: 0, opacity: 0.8 }}>
                    Edita los parámetros globales de descuentos del sistema.
                </Typography>

                <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>
                    {"(Los porcentajes deben ser ingresados como decimales)"}
                </Typography>

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
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h6" fontWeight="bold">
                                Descuento por pasajeros
                            </Typography>
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <TextField
                                    label="Número de pasajeros"
                                    name="numberOfPassengers"
                                    value={form.numberOfPassengers}
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
                                    label="Porcentaje descuento por pasajeros"
                                    name="passengersDiscountPercentage"
                                    value={form.passengersDiscountPercentage}
                                    onChange={handleDecimalBetweenZeroAndOneChange}
                                    type="text"
                                    inputProps={{
                                        inputMode: "decimal",
                                        step: "0.01",
                                        min: 0,
                                        max: 1,
                                    }}
                                    fullWidth
                                    required
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.passengersDiscountCumulative}
                                            onChange={handleChange}
                                            name="passengersDiscountCumulative"
                                        />
                                    }
                                    label="Acumulativo"
                                />
                            </Stack>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="h6" fontWeight="bold">
                                Descuento por usuario frecuente
                            </Typography>
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <TextField
                                    label="Número de reservas"
                                    name="numberOfBookings"
                                    value={form.numberOfBookings}
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
                                    label="Porcentaje descuento usuario frecuente"
                                    name="frequentDiscountPercentage"
                                    value={form.frequentDiscountPercentage}
                                    onChange={handleDecimalBetweenZeroAndOneChange}
                                    type="text"
                                    inputProps={{
                                        inputMode: "decimal",
                                        step: "0.01",
                                        min: 0,
                                        max: 1,
                                    }}
                                    fullWidth
                                    required
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.frequentDiscountCumulative}
                                            onChange={handleChange}
                                            name="frequentDiscountCumulative"
                                        />
                                    }
                                    label="Acumulativo"
                                />
                            </Stack>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="h6" fontWeight="bold">
                                Descuento por múltiples reservas
                            </Typography>
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <TextField
                                    label="Horas entre reservas"
                                    name="hoursBetweenBookings"
                                    value={form.hoursBetweenBookings}
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
                                    label="Cantidad de reservas"
                                    name="amountOfBookings"
                                    value={form.amountOfBookings}
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
                                    label="Porcentaje descuento por múltiples reservas"
                                    name="multipleBookingsDiscountPercentage"
                                    value={form.multipleBookingsDiscountPercentage}
                                    onChange={handleDecimalBetweenZeroAndOneChange}
                                    type="text"
                                    inputProps={{
                                        inputMode: "decimal",
                                        step: "0.01",
                                        min: 0,
                                        max: 1,
                                    }}
                                    fullWidth
                                    required
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.multipleBookingsDiscountCumulative}
                                            onChange={handleChange}
                                            name="multipleBookingsDiscountCumulative"
                                        />
                                    }
                                    label="Acumulativo"
                                />
                            </Stack>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="h6" fontWeight="bold">
                                Descuento temporal
                            </Typography>
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <TextField
                                    label="Inicio"
                                    name="timeLimitedDiscountStart"
                                    value={form.timeLimitedDiscountStart}
                                    onChange={handleChange}
                                    type="datetime-local"
                                    fullWidth
                                    required
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Término"
                                    name="timeLimitedDiscountEnd"
                                    value={form.timeLimitedDiscountEnd}
                                    onChange={handleChange}
                                    type="datetime-local"
                                    fullWidth
                                    required
                                    InputLabelProps={{ shrink: true }}
                                />
                                <TextField
                                    label="Porcentaje descuento temporal"
                                    name="timeLimitedDiscountPercentage"
                                    value={form.timeLimitedDiscountPercentage}
                                    onChange={handleDecimalBetweenZeroAndOneChange}
                                    type="text"
                                    inputProps={{
                                        inputMode: "decimal",
                                        step: "0.01",
                                        min: 0,
                                        max: 1,
                                    }}
                                    fullWidth
                                    required
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.timeLimitedDiscountActive}
                                            onChange={handleChange}
                                            name="timeLimitedDiscountActive"
                                        />
                                    }
                                    label="Activo"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.timeLimitedDiscountCumulative}
                                            onChange={handleChange}
                                            name="timeLimitedDiscountCumulative"
                                        />
                                    }
                                    label="Acumulativo"
                                />
                            </Stack>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="h6" fontWeight="bold">
                                Límite de descuento total
                            </Typography>
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <TextField
                                    label="Porcentaje máximo de descuento"
                                    name="maxDiscountPercentage"
                                    value={form.maxDiscountPercentage}
                                    onChange={handleDecimalBetweenZeroAndOneChange}
                                    type="text"
                                    inputProps={{
                                        inputMode: "decimal",
                                        step: "0.01",
                                        min: 0,
                                        max: 1,
                                    }}
                                    fullWidth
                                    required
                                />
                            </Stack>
                        </Box>

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
            </Card>
        </Container>
    );
};

export default SetDiscounts;