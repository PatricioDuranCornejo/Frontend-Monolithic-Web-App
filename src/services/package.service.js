import httpClient from "../http-common";

const getAll = () => {
    return httpClient.get('/api/packages/');
}

const getAvailables = () => {
    return httpClient.get('/api/packages/available');
}

export default { getAll, getAvailables };
