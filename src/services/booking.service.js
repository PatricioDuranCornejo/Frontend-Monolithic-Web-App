import httpClient from "../http-common";

const create = (data) => {
    return httpClient.post('/api/booking/', data);
};

const getAll = () => {
    return httpClient.get('/api/booking/');
};

const getBookingsByKeycloakId = (keycloakId) => {
    return httpClient.get(`/api/booking/keycloakId/${keycloakId}`);
};

const cancel = (booking) => {
    return httpClient.put('/api/booking/cancel', booking);
};

const getDiscountsForUser = (numberOfPassengers, keycloakId) => {
    return httpClient.get(`/api/discounts/getDiscounts/${numberOfPassengers}/${keycloakId}`);
};

const deleteBooking = (bookingId) => {
    return httpClient.delete(`/api/booking/${bookingId}`);
}

const getBookingsByDateRange = (afterDate, beforeDate) => {
    return httpClient.get(`/api/booking/dateRange/${afterDate}/${beforeDate}`);
}

export default { create, getAll, getBookingsByKeycloakId, cancel, getDiscountsForUser, deleteBooking, getBookingsByDateRange };