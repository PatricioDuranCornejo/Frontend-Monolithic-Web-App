import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import packageService from "../services/package.service";

import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  Stack,
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

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const init = () => {
    packageService
      .getAll()
      .then((response) => {
        console.log("Mostrando listado de paquetes disponibles.", response.data);
        setPackages(response.data);
      })
      .catch((error) => {
        console.log(
          "Se ha producido un error al intentar mostrar listado de paquetes disponibles.",
          error
        );
      });
  };

  useEffect(() => {
    init();
  }, []);

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

                      <Chip
                        label={translateState(pkg.packageState)}
                        color={getStateColor(pkg.packageState)}
                        size="small"
                      />
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
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PaidIcon fontSize="small" color="success" />
                        <Typography variant="body2" color="success">
                          <strong>Precio:</strong> {formatPrice(pkg.packagePrice)}
                        </Typography>
                      </Stack>

                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<ShoppingCartIcon />}
                        onClick={() => navigate(`/packages/${pkg.packageId}`)}
                        sx={{
                          borderRadius: 3,
                          minWidth: 170,
                          boxShadow: 2,
                        }}
                      >
                        Comprar
                      </Button>
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
    </Container>
  );
};

export default Packages;