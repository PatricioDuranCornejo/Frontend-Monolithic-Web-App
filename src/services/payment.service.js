import httpClient from "../http-common";

const createPayment = (data) => {
    return httpClient.post('/api/payment/', data);
}

const getByBookingId = (bookingId) => {
    return httpClient.get(`/api/payment/bookingId/${bookingId}`);
}

const getByDateRange = (afterDate, beforeDate) => {
    return httpClient.get(`/api/payment/dateRange/${afterDate}/${beforeDate}`);
};

const rankBySoldAmount = (afterDate, beforeDate) => {
    return httpClient.get(`/api/payment/rankBySalesAmount/${afterDate}/${beforeDate}`);
}

const rankByTotalSale = (afterDate, beforeDate) => {
    return httpClient.get(`/api/payment/rankByTotalSale/${afterDate}/${beforeDate}`);
}

const rankByPassengersAmount = (afterDate, beforeDate) => {
    return httpClient.get(`/api/payment/rankByPassengersAmount/${afterDate}/${beforeDate}`);
}

export default { createPayment, getByBookingId, getByDateRange, rankBySoldAmount, rankByTotalSale, rankByPassengersAmount };