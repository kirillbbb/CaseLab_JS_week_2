const requests = [];

export function findAll() {
  return [...requests];
}

export function findById(id) {
  return requests.find((request) => request.id === id) ?? null;
}

export function findMany({
  status,
  priority,
  equipmentId,
  type,
  dateFrom,
  dateTo,
  sortBy = "createdAt",
  sortOrder = "desc",
  page = 1,
  limit = 20,
  equipmentRepository,
}) {
  let result = [...requests];

  if (status !== undefined) {
    result = result.filter((request) => request.status === status);
  }

  if (priority !== undefined) {
    result = result.filter((request) => request.priority === priority);
  }

  if (equipmentId !== undefined) {
    result = result.filter((request) => request.equipmentId === equipmentId);
  }

  if (type !== undefined) {
    result = result.filter((request) => {
      const equipment = equipmentRepository.findById(request.equipmentId);

      return equipment?.type === type;
    });
  }

  if (dateFrom !== undefined) {
    result = result.filter((request) => request.createdAt >= dateFrom);
  }

  if (dateTo !== undefined) {
    result = result.filter((request) => request.createdAt <= dateTo);
  }

  result.sort((a, b) => {
    const first = a[sortBy];
    const second = b[sortBy];

    if (first === second) {
      return a.id.localeCompare(b.id);
    }

    const comparison = first < second ? -1 : 1;

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const total = result.length;
  const start = (page - 1) * limit;

  return {
    items: result.slice(start, start + limit),
    total,
  };
}

export function create(request) {
  requests.push(request);

  return request;
}

export function update(id, data) {
  const index = requests.findIndex((request) => request.id === id);

  if (index === -1) {
    return null;
  }

  requests[index] = {
    ...requests[index],
    ...data,
  };

  return requests[index];
}

export function remove(id) {
  const index = requests.findIndex((request) => request.id === id);

  if (index === -1) {
    return false;
  }

  requests.splice(index, 1);

  return true;
}
