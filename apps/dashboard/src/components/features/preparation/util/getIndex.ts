const getIndex = <T extends { id: number }>(
  list: T[] | undefined,
  item?: T,
) => {
  if (!list || !item) return -1;
  return list.findIndex((i) => i.id === item.id);
};
