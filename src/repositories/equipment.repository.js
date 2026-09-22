const equipment = [];

export function findAll() {
  return [...equipment];
}

export function findById(id) {
  return equipment.find((item) => item.id === id) ?? null;
}

export function create(item) {
  equipment.push(item);

  return item;
}

export function update(id, updates) {
  const index = equipment.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  equipment[index] = {
    ...equipment[index],
    ...updates,
  };

  return equipment[index];
}

export function remove(id) {
  const index = equipment.findIndex((item) => item.id === id);

  if (index === -1) {
    return false;
  }

  equipment.splice(index, 1);

  return true;
}

export function findMany({
  type,
  status,
  location,
  sortBy = "createdAt",
  sortOrder = "desc",
  page = 1,
  limit = 20,
}) {
  let result = [...equipment];

  if (type !== undefined) {
    result = result.filter((item) => item.type === type);
  }

  if (status !== undefined) {
    result = result.filter((item) => item.status === status);
  }

  if (location !== undefined) {
    result = result.filter(
      (item) =>
        item.location?.lat === location.lat &&
        item.location?.lon === location.lon,
    );
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
