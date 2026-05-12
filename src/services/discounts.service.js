import httpClient from "../http-common";

const getDiscounts = () => {
    return httpClient.get('/api/discounts/');
};

const updateDiscounts = (data) => {
    return httpClient.put('/api/discounts/', data);
};

export default { getDiscounts, updateDiscounts };