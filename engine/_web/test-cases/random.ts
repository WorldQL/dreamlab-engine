import { Rng, StandardNormal, Vector2 } from "@dreamlab/engine";
import Highcharts from "npm:highcharts";

document.querySelector("canvas")?.parentElement?.remove();

const div = document.createElement("div");

const n = 1000;
const step = 1;
const max = 100;
const min = 0;
const data: Record<number, number> = {};

const round_to_precision = (x: number, precision: number): number => {
  const y = +x + (precision === undefined ? 0.5 : precision / 2);
  return y - (y % (precision === undefined ? 1 : +precision));
};

// Seed data with a bunch of 0s
for (let j = min; j < max; j += step) {
  data[j] = 0;
}

// const prng = Rng.Fast;
const prng = Rng.Secure;
// const prng = Rng.Seeded(0n);
const value = (): number => {
  return StandardNormal.randomIntegerBetween(0, 25, { prng }) * 4;
};

// Create n samples between min and max
for (let i = 0; i < n; i += step) {
  const rand_num = value();
  const rounded = round_to_precision(rand_num, step);
  data[rounded] += 1;
}

const values: { x: number; y: number }[] = [];
// for (const [key, val] of Object.entries(data)) {
//   values.push({ x: parseFloat(key), y: val / n });
// }

for (let i = 0; i < n; i++) {
  const v = Vector2.randomUnitDisc();
  values.push(v.bare());
}

// @ts-expect-error: bad types
export const chart = Highcharts.chart(div, {
  chart: {
    type: "scatter",
  },
  title: {
    text: "Random Values",
  },
  xAxis: {
    ordinal: false,
  },
  yAxis: {
    title: {
      text: "Percentage Chance",
    },
  },
  legend: {
    layout: "vertical",
    align: "right",
    verticalAlign: "middle",
  },
  series: [
    {
      name: "Percent Chance",
      data: values,
    },
  ],
});

document.body.append(div);
