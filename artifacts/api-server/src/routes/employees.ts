import { Router, type IRouter } from "express";
import { db, employeesTable } from "@workspace/db";
import {
  CreateEmployeeBody,
  ListEmployeesResponse,
  ListEmployeesResponseItem,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/employees", async (req, res): Promise<void> => {
  req.log.info("Fetching all employees");
  const employees = await db.select().from(employeesTable);
  res.json(ListEmployeesResponse.parse(employees));
});

router.post("/employees", async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid create employee body");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [employee] = await db.insert(employeesTable).values(parsed.data).returning();
  req.log.info({ employeeId: employee.id }, "Employee created");

  res.status(201).json(ListEmployeesResponseItem.parse(employee));
});

export default router;
