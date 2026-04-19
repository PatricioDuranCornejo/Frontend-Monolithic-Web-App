import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import packageService from "../services/package.service";

const Packages = () => {
  const [packages, setPackages] = useState([]);

  const navigate = useNavigate();

  const init = () => {
    packageService
      .getAvailables()
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

    return (
    <div>
      <h1>Listado de paquetes</h1>
      <pre>{JSON.stringify(packages, null, 2)}</pre>
    </div>
  );
};

export default Packages;
