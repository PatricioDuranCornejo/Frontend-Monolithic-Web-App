import userService from "../services/user.service";
import { useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import {
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Alert,
  Typography,
} from "@mui/material";

const Home = () => {
  const { keycloak } = useKeycloak();

  const [loading, setLoading] = useState(true);
  const [openProfileModal, setOpenProfileModal] = useState(false);

  const [form, setForm] = useState({
    rut: "",
    phone: "",
    country: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const initUser = async () => {
      try {
        if (!keycloak?.idTokenParsed?.sub) return;

        const keycloakId = keycloak.idTokenParsed.sub;

        try {
          await userService.create(
            keycloakId,
            keycloak.idTokenParsed.name,
            keycloak.idTokenParsed.email
          );
        } catch (createError) {
          console.log("Usuario ya existente o error no crítico:", createError);
          console.log(keycloak.token)
        }

        const response = await userService.getRutByKeycloakId(keycloakId);
        const rut = response?.data;

        if (!rut || rut.trim() === "") {
          setOpenProfileModal(true);
        }
      } catch (error) {
        console.error("Error al inicializar usuario:", error);
        setOpenProfileModal(true);
      } finally {
        setLoading(false);
      }
    };

    initUser();
  }, [keycloak]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.rut.trim()) {
      setError("El RUT es obligatorio.");
      return;
    }
    if (!/^\d{7,8}-[0-9kK]$/.test(form.rut.trim())) {
      setError("El RUT debe tener el formato 12345678-9");
      return;
    }

    if (!form.phone.trim()) {
      setError("El número de teléfono es obligatorio.");
      return;
    }
    if (!/^[+]\d{11}$/.test(form.phone.trim())) {
      setError(
        "El número de teléfono debe tener el formato +XXXXXXXXXXX (código de país seguido de 11 dígitos)."
      );
      return;
    }

    if (!form.country.trim()) {
      setError("El país es obligatorio.");
      return;
    }
    if (!/^[a-zA-Z\s]{4,55}$/.test(form.country.trim())) {
      setError(
        "El país solo puede contener letras y espacios, con 4 a 55 caracteres."
      );
      return;
    }

    try {
      setSaving(true);

      const id = await userService.getUserIdByKeycloakId(
        keycloak.idTokenParsed.sub
      );

      const user = {
        userId: id.data,
        userRut: form.rut,
        userPhone: form.phone,
        userCountry: form.country,
        keycloakId: keycloak.idTokenParsed.sub,
        userName: keycloak.idTokenParsed.name,
        userEmail: keycloak.idTokenParsed.email,
        frecuentUser: false,
      };

      await userService.update(user);
      setOpenProfileModal(false);
    } catch (err) {
      console.log(err);
      setError(
        err?.response?.data?.message ||
          "Ocurrió un error al guardar los datos."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <div>
        <h1>SisGR: Sistema de Gestión Remuneraciones</h1>
        <p>
          SisGR es una aplicación web para gestionar planillas de sueldos de
          empleados. Esta aplicación ha sido desarrollada usando tecnologías como{" "}
          <a href="https://spring.io/projects/spring-boot">Spring Boot</a> (para
          el backend), <a href="https://reactjs.org/">React</a> (para el Frontend)
          y <a href="https://www.mysql.com/products/community/">MySQL</a> (para la
          base de datos).
        </p>
      </div>

      <Dialog open={openProfileModal} fullWidth maxWidth="sm">
        <DialogTitle color="primary">Completa tu perfil</DialogTitle>

        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Antes de continuar, necesitamos algunos datos adicionales para terminar
            de crear tu perfil.
          </Typography>

          <form id="complete-profile-form" onSubmit={handleSubmit}>
            <Stack spacing={2} sx={{ mt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                label="RUT"
                name="rut"
                value={form.rut}
                onChange={handleChange}
                fullWidth
                required
              />

              <TextField
                label="Teléfono"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                fullWidth
                required
              />

              <TextField
                label="País"
                name="country"
                value={form.country}
                onChange={handleChange}
                fullWidth
                required
              />
            </Stack>
          </form>
        </DialogContent>

        <DialogActions>
          <Button
            type="submit"
            form="complete-profile-form"
            variant="contained"
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Home;