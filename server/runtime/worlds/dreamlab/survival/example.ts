interface KitchenObject {
  location: "cabinet" | "drawer" | "countertop";
  name: string;
  quantity: number;
}

const a: string = "asdf";
const foo: number = 456;
console.log(foo + a);

export const knife: KitchenObject = { location: "drawer", name: "Butterknife", quantity: foo };
