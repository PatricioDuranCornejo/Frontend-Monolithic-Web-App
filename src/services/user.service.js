import httpClient from "../http-common";

const create = (keycloakId, userName, userEmail) => {
    return httpClient.post('/api/users/', {keycloakId,userName,userEmail});
}

export default { create };