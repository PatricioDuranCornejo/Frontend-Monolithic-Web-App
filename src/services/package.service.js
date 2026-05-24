import httpClient from "../http-common";

const getAll = () => {
    return httpClient.get('/api/packages/');
}

const save = (pack) => {
    return httpClient.post('/api/packages/', pack);
}

const update = (pack) => {
    return httpClient.put('/api/packages/', pack);
}

const deletePackage = (id) => {
    return httpClient.delete(`/api/packages/${id}`);
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

export default { getAll, getAvailables, getDestinies, getByFilters, getExperienceTypes, save, update, deletePackage };
