import httpClient from "../http-common";

const getAll = () => {
    return httpClient.get('/api/packages/');
}

const getAvailables = () => {
    return httpClient.get('/api/packages/available');
}

const getDestinies = () => {
    return httpClient.get('/api/packages/destinies')
}

const getExperienceTypes = () => {
    return httpClient.get('/api/packages/exptypes')
}

const getByFilters = (filters) => {
  return httpClient.get("/api/packages/filters", { params: filters });
};

export default { getAll, getAvailables, getDestinies, getByFilters, getExperienceTypes };
