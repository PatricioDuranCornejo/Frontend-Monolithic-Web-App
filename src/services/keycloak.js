import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://104.248.124.72:9090",
  realm: "Monolithic-Realm",
  clientId: "Monolithic-Frontend",
});

export default keycloak;