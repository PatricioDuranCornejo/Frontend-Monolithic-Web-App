import userService from "../services/user.service";
import packageService from "../services/package.service";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
import {
  Autocomplete,
  Box,
  Card,
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
import NumberField from './NumberField';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import dayjs from "dayjs";


const Home = () => {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [openProfileModal, setOpenProfileModal] = useState(false);

  const [form, setForm] = useState({
    rut: "",
    phone: "",
    country: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Consts for Package Destiny filter
  const [destinies, setDestinies] = useState([]);
  const [selectedDestiny, setSelectedDestiny] = useState(null);

  // Consts for Dates filter
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Consts for Prices filter
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);

  // Consts for Package Exp Types filter
  // Consts for Package Destiny filter
  const [expTypes, setExpTypes] = useState([]);
  const [selectedExpType, setSelectedExpType] = useState(null);

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (selectedDestiny) params.set("destiny", selectedDestiny);
    if (selectedExpType) params.set("experienceType", selectedExpType);
    if (startDate) params.set("startDate", startDate.format("YYYY-MM-DDTHH:mm:ss"));
    if (endDate) params.set("endDate", endDate.format("YYYY-MM-DDTHH:mm:ss"));
    if (minPrice !== "" && minPrice !== null) params.set("minPrice", minPrice);
    if (maxPrice !== "" && maxPrice !== null) params.set("maxPrice", maxPrice);

    navigate(`/packages?${params.toString()}`);
  };

  // Load Destinies from DB
  useEffect(() => {
    const loadDestinies = async () => {
      try {
        const response = await packageService.getDestinies();
        setDestinies(response.data);
        console.log(response.data)
      } catch (error) {
        console.error("Error al obtener destinos:", error);
      }
    };

    loadDestinies();
  }, []);

  // Load Experiences Type from DB
  useEffect(() => {
    const loadExpTypes = async () => {
      try {
        const response = await packageService.getExperienceTypes();
        setExpTypes(response.data);
        console.log(response.data)
      } catch (error) {
        console.error("Error al obtener tipos de experiencias:", error);
      }
    };

    loadExpTypes();
  }, []);

  // Craete User Entity on DB
  // And complete profile data after keycloak register
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

    //Verifications
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

      <Stack direction="row" alignItems="center" justifyContent="center" spacing={3} sx={{ mb: 2 }}>
        <FlightTakeoffIcon
          color="dark"
          sx={{
            fontSize: 100,
            p: 0,
            flexShrink: 0,
          }} />
        <Typography
          variant="h2"
          fontWeight="bold"
          sx={{
            display: "flex",
            alignItems: "center",
            lineHeight: 1,
          }}
        >
          Bienvenido a TravelAgency
        </Typography>
        <FlightTakeoffIcon
          color="black"
          sx={{
            fontSize: 100,
            p: 0,
            flexShrink: 0,
          }} />
      </Stack>

      <Typography
        variant="h4"
        sx={{ mb: 4, opacity: 0.8, textAlign: "center" }}
      >
        Busqueda de paquetes
      </Typography>


      <Stack spacing={1.3}>
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
                md: "170px 190px 200px 180px 210px",
              },
              gap: 2,
              alignItems: "center",
              width: "100%",
              p: 2,
            }}
          >
            {/* Select Destiny */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Autocomplete
                options={destinies}
                value={selectedDestiny}
                onChange={(event, newValue) => setSelectedDestiny(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Destino" placeholder="Escribe para buscar" />
                )}
                fullWidth
              />
            </Box>

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

            {/* Select Min. and Max. Prices */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Stack spacing={1.3}>

                <NumberField
                  label="Precio mínimo"
                  value={minPrice}
                  onValueChange={(value) => setMinPrice(value)}
                  min={0}
                  size="small"
                />

                <NumberField
                  label="Precio máximo"
                  onValueChange={(value) => setMaxPrice(value)}
                  min={0}
                  value={maxPrice}
                  size="small"
                />

              </Stack>
            </Box>

            {/* Select Experience Type */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Autocomplete
                options={expTypes}
                value={selectedExpType}
                onChange={(event, newValue) => setSelectedExpType(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Tipo de experiencia" placeholder="Escribe para buscar" />
                )}
                fullWidth
              />
            </Box>
          </Box>
        </Card>

        <Box
          sx={{
            display: "flex",
            justifyContent: "right",
            alignItems: "center",
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={handleSearch}
            sx={{
              borderRadius: 3,
              minWidth: 170,
              boxShadow: 2,
            }}
          >
            Buscar
          </Button>
        </Box>
      </Stack>
    </>
  );
};

export default Home;