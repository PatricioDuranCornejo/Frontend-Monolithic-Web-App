import userService from "../services/user.service";
import { useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";

const Home = () => {

  const { keycloak } = useKeycloak();

  useEffect(() => {
    if (keycloak?.idTokenParsed) {
      userService.create(
        keycloak.idTokenParsed.sub,
        keycloak.idTokenParsed.name,
        keycloak.idTokenParsed.email
      );
    }
  }, [keycloak]);

  return (
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
    
  );
};

export default Home;