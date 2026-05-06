import { useState } from "react";
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    Alert,
    CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import userService from "../services/user.service";
import { useKeycloak } from "@react-keycloak/web";

export default function CompleteProfilePage() {

    const navigate = useNavigate();
    const { keycloak } = useKeycloak();

    const [form, setForm] = useState({
        rut: "",
        phone: "",
        country: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!form.rut.trim()) {
            setError("El RUT es obligatorio.");
            return;
        }
        if (!/^\d{7,8}-[0-9kK]$/.test(form.rut.trim())) {
            setError("El RUT debe tener el formato 12345678-9");
            return;
        }

        if (!form.phone.trim()) {
            setError("El número de telefono es obligatorio.");
            return;
        }
        if (!/^[+]\d{11}$/.test(form.phone.trim())) {
            setError("El número de teléfono debe tener el formato +XXXXXXXXXXX (código de país seguido de 11 dígitos).");
            return;
        }

        if (!form.country.trim()) {
            setError("El país es obligatorio.");
            return;
        }
        if (!/^[a-zA-Z\s]{4,55}$/.test(form.country.trim())) {
            setError("El país solo puede contener letras y espacios, con 4 a 55 caracteres.");
            return;
        }

        const id = await userService.getUserIdByKeycloakId(keycloak.idTokenParsed.sub)
        
        const user = { 
            userId: id.data,
            userRut: form.rut,
            userPhone: form.phone,
            userCountry: form.country,
            keycloakId: keycloak.idTokenParsed.sub,
            userName: keycloak.idTokenParsed.name,
            userEmail: keycloak.idTokenParsed.email,
            frecuentUser: false};

        try {
            setLoading(true);
            await userService.update(user);
            setSuccess("Datos guardados correctamente.");
        } catch (err) {
            setError(
                console.log(err),
                err?.response?.data?.message || "Ocurrió un error al guardar los datos."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ py: 6 }}>
            <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>
                    Completa tu perfil
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Antes de continuar, necesitamos algunos datos adicionales para terminar
                    de crear tu perfil.
                </Typography>

                <form onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                        {error && <Alert severity="error">{error}</Alert>}
                        {success && <Alert severity="success">{success}</Alert>}

                        <TextField
                            id="outlined-required"
                            label="RUT"
                            name="rut"
                            value={form.rut}
                            onChange={handleChange}
                            fullWidth
                            required
                        />

                        <TextField
                            id="outlined-required"
                            label="Teléfono"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            fullWidth
                            required
                        />

                        <TextField
                            id="outlined-required"
                            label="País"
                            name="country"
                            value={form.country}
                            onChange={handleChange}
                            fullWidth
                            required
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : "Guardar y continuar"}
                        </Button>
                    </Stack>
                </form>
            </Paper>
        </Container>
    );
}