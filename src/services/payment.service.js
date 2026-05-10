import httpClient from "../http-common";

const createPayment = (data) => {
    return httpClient.post('/api/payment/', data);
}

const getByBookingId = (bookingId) => {
    return httpClient.get(`/api/payment/bookingId/${bookingId}`);
} 

export default { createPayment, getByBookingId };