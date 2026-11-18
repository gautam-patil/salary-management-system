import type { Prisma } from "@prisma/client";
import { COUNTRIES, FIRST_NAMES, LAST_NAMES, ROLES } from "./data.js";

const HIRE_WINDOW_START = Date.UTC(2015, 0, 1);
const HIRE_WINDOW_END = Date.UTC(2025, 0, 1);
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// small seeded generator, so the same seed always gives the same employees
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type SeedEmployee = Prisma.EmployeeCreateManyInput & { hireDate: Date };

export function generateEmployees(count: number, seed = 42): SeedEmployee[] {
  const random = createRandom(seed);
  const pick = <T>(items: T[]) => items[Math.floor(random() * items.length)]!;

  const totalWeight = COUNTRIES.reduce((sum, c) => sum + c.weight, 0);
  const pickCountry = () => {
    let roll = random() * totalWeight;
    return COUNTRIES.find((c) => (roll -= c.weight) < 0) ?? COUNTRIES[0]!;
  };

  return Array.from({ length: count }, (_, i) => {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const country = pickCountry();
    const role = pick(ROLES);

    const hiredAt = HIRE_WINDOW_START + random() * (HIRE_WINDOW_END - HIRE_WINDOW_START);
    const yearsOfService = (HIRE_WINDOW_END - hiredAt) / YEAR_MS;

    // role base pay, scaled for country, individual variation and 2% a year of service
    const usd = role.baseUsd * country.payFactor * (0.85 + random() * 0.3) * (1 + yearsOfService * 0.02);
    const salary = Math.round((usd * country.perUsd) / 100) * 100;

    return {
      fullName: `${firstName} ${lastName}`,
      email: `${firstName}.${lastName}${i + 1}@acme.com`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""),
      jobTitle: role.jobTitle,
      department: role.department,
      country: country.name,
      salary,
      currency: country.currency,
      hireDate: new Date(hiredAt),
    };
  });
}
