export async function test ({ a, b }) {
  const output = await new Promise((resolve) => {
    let output = 0

    for(let i = 0; i < 100000001234; i++){
      output++
    }

    resolve(output)
  })

  return a + b + output;
};
