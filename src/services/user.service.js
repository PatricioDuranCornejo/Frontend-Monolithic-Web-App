import httpClient from "../http-common";

const create = (keycloakId, userName, userEmail) => {
    return httpClient.post('/api/users/', {keycloakId,userName,userEmail});
}

const update = (user) => {
    return httpClient.put(`/api/users/`, user);
}

const getByKeycloakId = keycloakId => {
    return httpClient.get(`/api/users/keycloakId/${keycloakId}`);
}

const getRutByKeycloakId = keycloakId => {
    return httpClient.get(`/api/users/rut/keycloakId/${keycloakId}`);
}

const getUserIdByKeycloakId = keycloakId => {
    return httpClient.get(`/api/users/id/keycloakId/${keycloakId}`);
}

export default { create, getByKeycloakId, getRutByKeycloakId, update, getUserIdByKeycloakId };