import httpClient from "../http-common";

const create = (data) => {
    return httpClient.post('/api/booking/', data);
};

const getAll = () => {
    return httpClient.get('/api/booking/');
}

const cancel = (booking) => {
    return httpClient.put('/api/booking/cancel', booking);
}

export default { create, getAll, cancel };