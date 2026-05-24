import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";

export default function Navbar() {
  const navigate = useNavigate();
  const { keycloak } = useKeycloak();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const isAdmin = keycloak?.realmAccess?.roles?.includes("ADMIN");

  const menuItems = [
    { text: "Home", path: "/" },
    { text: "Paquetes", path: "/packages" },
    { text: "Mis reservas", path: "/bookings" },
  ];

  const adminItems = [
    ...(isAdmin ? [{ text: "Config. descuentos", path: "/setDiscounts" }] : []),
    ...(isAdmin ? [{ text: "Admin. paquetes", path: "/adminPackages" }] : []),
    ...(isAdmin ? [{ text: "Admin. reservas", path: "/adminBookings" }] : []),
    ...(isAdmin ? [{ text: "Rankings", path: "/rankings" }] : []),
  ];

  // Open menu
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Close menu
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Logout
  const handleLogout = () => {
    keycloak.logout();
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 1300,
      }}
    >
      {/* User icon */}
      <IconButton onClick={handleClick}>
        <PersonIcon sx={{
          color: "black",
          borderRadius: 3,
          boxShadow: 2,
          width: 30,
          height: 30,
        }} />
      </IconButton>

      {/* Dropdown menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {/* Navigation options */}
        {menuItems.map((item) => (
          <MenuItem
            key={item.text}
            onClick={() => {
              navigate(item.path);
              handleClose();
            }}
          >
            {item.text}
          </MenuItem>
        ))}

        {/* Separator */}
        {isAdmin && (
          < MenuItem disabled>────────────</MenuItem>
        )}

        {/* Navigation options */}
        {adminItems.map((item) => (
          <MenuItem
            key={item.text}
            onClick={() => {
              navigate(item.path);
              handleClose();
            }}
          >
            {item.text}
          </MenuItem>
        ))}

        {/* Separator */}
        <MenuItem disabled>────────────</MenuItem>

        {/* Print token */}
        <MenuItem
          onClick={() => {
            console.log(keycloak.token);
            handleClose();
          }}
        >
          Ver token
        </MenuItem>

        {/* Logout */}
        <MenuItem onClick={() => {
          navigate("/");
          handleLogout();
        }} sx={{ color: "red" }}>
          <LogoutIcon sx={{ mr: 1 }} />
          Cerrar sesión
        </MenuItem>
      </Menu>
    </Box >
  );
}