import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://24.199.87.22:9090",
  realm: "Monolithic-Realm",
  clientId: "Monolithic-Frontend",
});

export default keycloak;