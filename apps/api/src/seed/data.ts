// payFactor: typical pay relative to the US; weight: how likely a country is to be picked.
// Currencies and exchange rates come from the shared reference data.
export const COUNTRIES = [
  { name: "United States", payFactor: 1, weight: 25 },
  { name: "India", payFactor: 0.3, weight: 20 },
  { name: "United Kingdom", payFactor: 0.8, weight: 10 },
  { name: "Germany", payFactor: 0.85, weight: 10 },
  { name: "France", payFactor: 0.8, weight: 8 },
  { name: "Canada", payFactor: 0.85, weight: 7 },
  { name: "Australia", payFactor: 0.9, weight: 6 },
  { name: "Japan", payFactor: 0.7, weight: 5 },
  { name: "Brazil", payFactor: 0.35, weight: 5 },
  { name: "Singapore", payFactor: 0.9, weight: 4 },
];

// baseUsd is a typical US salary for the role
export const ROLES = [
  { department: "Engineering", jobTitle: "Software Engineer", baseUsd: 120_000 },
  { department: "Engineering", jobTitle: "Senior Software Engineer", baseUsd: 150_000 },
  { department: "Engineering", jobTitle: "Engineering Manager", baseUsd: 185_000 },
  { department: "Engineering", jobTitle: "QA Engineer", baseUsd: 95_000 },
  { department: "Engineering", jobTitle: "DevOps Engineer", baseUsd: 130_000 },
  { department: "Sales", jobTitle: "Sales Representative", baseUsd: 70_000 },
  { department: "Sales", jobTitle: "Account Executive", baseUsd: 95_000 },
  { department: "Sales", jobTitle: "Sales Manager", baseUsd: 130_000 },
  { department: "Marketing", jobTitle: "Marketing Specialist", baseUsd: 75_000 },
  { department: "Marketing", jobTitle: "Content Strategist", baseUsd: 80_000 },
  { department: "Marketing", jobTitle: "Marketing Manager", baseUsd: 115_000 },
  { department: "Finance", jobTitle: "Accountant", baseUsd: 70_000 },
  { department: "Finance", jobTitle: "Financial Analyst", baseUsd: 90_000 },
  { department: "Finance", jobTitle: "Finance Manager", baseUsd: 125_000 },
  { department: "Human Resources", jobTitle: "HR Coordinator", baseUsd: 60_000 },
  { department: "Human Resources", jobTitle: "Recruiter", baseUsd: 75_000 },
  { department: "Human Resources", jobTitle: "HR Manager", baseUsd: 105_000 },
  { department: "Operations", jobTitle: "Operations Analyst", baseUsd: 72_000 },
  { department: "Operations", jobTitle: "Operations Manager", baseUsd: 110_000 },
  { department: "Operations", jobTitle: "Logistics Coordinator", baseUsd: 58_000 },
  { department: "Customer Support", jobTitle: "Support Agent", baseUsd: 50_000 },
  { department: "Customer Support", jobTitle: "Support Lead", baseUsd: 75_000 },
  { department: "Product", jobTitle: "Product Manager", baseUsd: 140_000 },
  { department: "Product", jobTitle: "Product Designer", baseUsd: 110_000 },
];

export const FIRST_NAMES = [
  "Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Meera", "Arjun", "Kavya",
  "James", "Emily", "Michael", "Sarah", "David", "Jessica", "Daniel", "Olivia",
  "Lukas", "Anna", "Felix", "Marie", "Hugo", "Camille", "Louis", "Chloe",
  "Liam", "Emma", "Noah", "Charlotte", "Oliver", "Amelia", "Ethan", "Grace",
  "Hiroshi", "Yuki", "Kenji", "Sakura", "Mateus", "Beatriz", "Wei", "Mei",
];

export const LAST_NAMES = [
  "Sharma", "Patel", "Rao", "Iyer", "Mehta", "Nair", "Singh", "Gupta",
  "Smith", "Johnson", "Brown", "Williams", "Jones", "Miller", "Davis", "Wilson",
  "Müller", "Schmidt", "Fischer", "Weber", "Martin", "Bernard", "Dubois", "Moreau",
  "Taylor", "Anderson", "Thomas", "Clark", "Lewis", "Walker", "Hall", "Young",
  "Tanaka", "Suzuki", "Sato", "Watanabe", "Silva", "Santos", "Tan", "Lim",
];
