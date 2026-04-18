import httpClient from "../http-common";

const getAll = () => {
    return httpClient.get('/api/packages/');
}
export default { getAll };