import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:9090",
  realm: "Monolithic-Realm",
  clientId: "Monolithic-Frontend",
});

export default keycloak;