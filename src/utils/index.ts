export const shuffle = (arr: [number, number, string][]) => {
  let counter = arr.length

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter)

    counter--

    const temp = arr[counter]
    arr[counter] = arr[index]
    arr[index] = temp
  }

  return arr
}

export const getLevel = (stage: number) => {
  if (stage < 5) {
    return 'easy'
  } else if (stage < 10) {
    return 'medium'
  } else if (stage < 15) {
    return 'hard'
  } else {
    return 'super hard'
  }
}
