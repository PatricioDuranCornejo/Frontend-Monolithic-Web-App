import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import packageService from "../services/package.service";
import bookingService from "../services/booking.service";
import userService from "../services/user.service";
import { useKeycloak } from "@react-keycloak/web";

import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Typography,
  Modal,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Fade,
} from "@mui/material";

import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PaidIcon from "@mui/icons-material/Paid";
import PeopleIcon from "@mui/icons-material/People";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";
import { useLocation } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import discountsService from "../services/discounts.service";

const Packages = () => {
  const { keycloak } = useKeycloak();
  const [packages, setPackages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const filters = location.state || {};
  const [searchParams] = useSearchParams();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [openBookingModal, setOpenBookingModal] = useState(false);
  const [passengers, setPassengers] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [extraPassengers, setExtraPassengers] = useState([]);
  const [bookingError, setBookingError] = useState("");
  const [discounts, setDiscounts] = useState([]);
  const [finalDiscount, setFinalDiscount] = useState(0);
  const lastDiscountRequestRef = useRef(0);


  useEffect(() => {
    const filters = {};

    const destiny = searchParams.get("destiny");
    const experienceType = searchParams.get("experienceType");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (destiny) filters.destiny = destiny;
    if (experienceType) filters.experienceType = experienceType;
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    packageService.getByFilters(filters)
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

  // Validation to create extra fields for passengers when booking
  const handlePassengersChange = async (value) => {
    if (value === "") {
      setPassengers("");
      setDiscounts([]);
      setFinalDiscount(0);
      setTotalPrice(0);
      setExtraPassengers([]);
      return;
    }

    if (!/^[1-9]\d*$/.test(value)) return;

    const numericValue = Number(value);

    if (!selectedPackage) return;
    if (numericValue > selectedPackage.packageStockAvailable) return;

    const requestId = ++lastDiscountRequestRef.current;

    try {
      const response = await bookingService.getDiscountsForUser(
        numericValue,
        keycloak.idTokenParsed.sub
      );

      // Ignore stale responses
      if (requestId !== lastDiscountRequestRef.current) return;

      const matrix = response.data;
      const final = extractFinalDiscount(matrix);

      setDiscounts(matrix);
      setFinalDiscount(final);

      setPassengers(value);
      setTotalPrice(
        numericValue * selectedPackage.packagePrice * (1 - final)
      );

      const extrasCount = Math.max(numericValue - 1, 0);
      setExtraPassengers((prev) =>
        Array.from({ length: extrasCount }, (_, i) => prev[i] || { name: "", rut: "" })
      );
    } catch (error) {
      console.error("Error al obtener descuentos:", error);
      setDiscounts([]);
      setFinalDiscount(0);
      setTotalPrice(numericValue * selectedPackage.packagePrice);
    }
  };

  // Handle a especific passenger field change
  const handleExtraPassengerChange = (index, field, value) => {
    setExtraPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  // Validate RUT and name fields for extra passengers
  const isValidRut = (rut) => /^\d{7,8}-[0-9kK]$/.test(rut.trim());
  const isValidName = (name) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name.trim());

  // Generate placeholder image URL (using picsum.photos for demo)
  const getPlaceholderImage = (packageId) => {
    // Using a consistent seed based on packageId for the same image per package
    return `https://picsum.photos/seed/${packageId}/800/600`;
  };

  const handleBooking = async (pkg) => {
    setSelectedPackage(pkg);

    const response = await bookingService.getDiscountsForUser(
      1,
      keycloak.idTokenParsed.sub
    );

    setDiscounts(response.data);
    setFinalDiscount(extractFinalDiscount(response.data));

    setOpenBookingModal(true);
  };

  const createBooking = async () => {
    setBookingError("");

    if (!passengers || Number(passengers) < 1) {
      setBookingError("Debes ingresar al menos 1 pasajero.");
      return;
    }

    for (let i = 0; i < extraPassengers.length; i++) {
      const passenger = extraPassengers[i];

      if (!passenger.name.trim()) {
        setBookingError(`El nombre del pasajero ${i + 2} es obligatorio.`);
        return;
      }

      if (!isValidName(passenger.name)) {
        setBookingError(`El nombre del pasajero ${i + 2} solo puede contener letras.`);
        return;
      }

      if (!passenger.rut.trim()) {
        setBookingError(`El RUT del pasajero ${i + 2} es obligatorio.`);
        return;
      }

      if (!isValidRut(passenger.rut)) {
        setBookingError(`El RUT del pasajero ${i + 2} debe tener el formato 12345678-9.`);
        return;
      }
    }

    const passengersString = extraPassengers
      .map((p) => `${p.name.trim()}; ${p.rut.trim()}`)
      .join(". ");

    console.log("Pasajeros extra:", passengersString);

    const user = await userService.getByKeycloakId(keycloak.idTokenParsed.sub);
    extractFinalDiscount(discounts);

    const data = {
      passengers: Number(passengers),
      extraPassengers: passengersString,
      bookingTotalPrice: totalPrice,
      bookingState: "Awaiting for payment",
      bookingDiscount: finalDiscount,
      pack: selectedPackage,
      user: user.data,
    };

    console.log(data);

    try {
      const bookingResponse = await bookingService.create(data);

      for (let i = 0; i < discounts.length; i++) {
        const discountDetailBody = {
          discountName: discounts[i][0],
          discountPercentage: parseFloat(discounts[i][1]),
          discountCumulative: discounts[i][2],
          isFinalDiscount: i === discounts.length - 1,
          booking: bookingResponse.data,
        };

        console.log(discountDetailBody);
        await discountsService.saveDiscountsDetails(discountDetailBody);
      };
      window.alert("Reserva creada exitosamente.");
      setOpenBookingModal(false);
      window.location.reload();
    } catch (error) {
      console.error("Error al crear la reserva o sus descuentos:", error);
    }
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
      "Limit Discount": "Descuento límite",
    };

    return map[type] || type || "-";
  };

  const extractFinalDiscount = (matrix) => {
    if (!Array.isArray(matrix) || matrix.length === 0) return 0;

    const lastRow = matrix[matrix.length - 1];

    if (
      Array.isArray(lastRow) &&
      lastRow.length >= 2 &&
      lastRow[1] === "No discounts applicable"
    ) {
      return 0;
    }

    const value = parseFloat(lastRow?.[1]);
    return Number.isFinite(value) ? value : 0;
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
            {(Number(finalDiscountRow?.[1] ?? 0) * 100).toFixed(2)}%
          </Typography>

          <Typography variant="body2">
            <strong>Tipo:</strong> {translateDiscountType(finalDiscountRow?.[2])}
          </Typography>

          {finalDiscountRow?.[0] && (
            <Typography variant="body2">
              <strong>Origen:</strong> {translateDiscountName(finalDiscountRow[0])}
            </Typography>
          )}
        </Box>
      </Stack>
    );
  };

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
        Listado de paquetes
      </Typography>

      <Typography
        variant="body1"
        sx={{ mb: 4, opacity: 0.8, textAlign: "center" }}
      >
        Paquetes disponibles actualmente.
      </Typography>

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
                        md: "150px 220px 310px 230px",
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

                    {/* RIGHT SECTION: PRICE & DETAIL BUTTON */}
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

                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<ShoppingCartIcon />}
                        onClick={() => handleBooking(pkg)}
                        sx={{
                          borderRadius: 3,
                          minWidth: 170,
                          boxShadow: 2,
                        }}
                      >
                        Comprar
                      </Button>

                      <Chip
                        label={translateState(pkg.packageState)}
                        color={getStateColor(pkg.packageState)}
                        size="small"
                      />

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

      <Dialog open={openBookingModal} onClose={() => setOpenBookingModal(false)} fullWidth maxWidth="sm">
        <DialogTitle color="success">Reservar paquete</DialogTitle>

        <DialogContent>
          {selectedPackage && bookingError && (
            <Typography color="error" variant="body2">
              {bookingError}
            </Typography>
          )}
          {selectedPackage && (
            <Stack spacing={1}>
              <Typography variant="body1">
                <strong>Paquete seleccionado:</strong> {selectedPackage.packageName}
              </Typography>

              <Typography variant="body2">
                <strong>Destino:</strong> {selectedPackage.packageDestiny}
              </Typography>

              <Typography variant="body2">
                <strong>Precio por persona:</strong> {formatPrice(selectedPackage.packagePrice)}
              </Typography>

              <Typography variant="body2">
                <strong>Cupos disponibles:</strong> {selectedPackage.packageStockAvailable}
              </Typography>

              <Typography variant="subtitle1">
                <strong>* Descuentos: </strong>
              </Typography>

              <Box>
                {renderDiscounts(discounts)}
              </Box>

              <Typography variant="subtitle1" fontWeight="bold">
                <strong>* Pasajeros extra: </strong>
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "300px 100px",
                  },
                  gap: 2,
                  width: "40%",
                  p: 0,
                }}
              >
                <Typography variant="body2">
                  <strong>Seleccione la cantidad de pasajeros: </strong>
                </Typography>

                <TextField
                  variant="standard"
                  value={passengers}
                  onChange={(e) => handlePassengersChange(e.target.value)}
                  type="text"
                  inputProps={{
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                  }}
                />
              </Box>

              {extraPassengers.length > 0 && (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Datos de pasajeros extra
                  </Typography>

                  {extraPassengers.map((passenger, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                        gap: 2,
                      }}
                    >
                      <TextField
                        label={`Nombre pasajero ${index + 2}`}
                        value={passenger.name}
                        onChange={(e) =>
                          handleExtraPassengerChange(index, "name", e.target.value)
                        }
                        fullWidth
                      />

                      <TextField
                        label={`RUT pasajero ${index + 2}`}
                        value={passenger.rut}
                        onChange={(e) =>
                          handleExtraPassengerChange(index, "rut", e.target.value)
                        }
                        fullWidth
                      />
                    </Box>
                  ))}
                </Stack>
              )}

              <Typography variant="body2">
                <strong>Precio total:</strong> {formatPrice(passengers * selectedPackage.packagePrice)}
              </Typography>

              <Typography variant="body2">
                <strong>Precio total con descuentos:</strong> {formatPrice(totalPrice)}
              </Typography>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={createBooking} color="success">
            Confirmar reserva
          </Button>
          <Button onClick={() => setOpenBookingModal(false)} color="error">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Packages;