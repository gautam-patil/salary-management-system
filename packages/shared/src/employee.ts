// shape of an employee in API responses; dates are ISO strings
export interface Employee {
  id: number;
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  salary: number;
  currency: string;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}
