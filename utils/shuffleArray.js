const shuffleArray = (array) => {
  if (Array.isArray(array))
    return array
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

  throw new Error("Not a valid array!");
};

export default shuffleArray;
