import httpClient from "../http-common";

const getDiscounts = () => {
    return httpClient.get('/api/discounts/');
};

const updateDiscounts = (data) => {
    return httpClient.put('/api/discounts/', data);
};

const saveDiscountsDetails = (data) => {
    return httpClient.post("/api/discountsDetails/", data);
}

const getDiscountsDetails = (bookingId) => {
    return httpClient.get(`/api/discountsDetails/bookingId/${bookingId}`);
};

export default { getDiscounts, updateDiscounts, saveDiscountsDetails, getDiscountsDetails};