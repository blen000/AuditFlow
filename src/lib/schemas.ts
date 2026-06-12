import { z } from 'zod';

// --- Auth Schemas ---

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must include uppercase')
    .regex(/[a-z]/, 'Must include lowercase')
    .regex(/[0-9]/, 'Must include a number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must include a special character'),
});

// --- User & Role Schemas ---

export const createUserSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
  status: z.enum(['Active', 'Inactive']).optional().default('Active'),
  branch: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  district: z.string().optional().or(z.literal('')),
});

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().cuid().optional(),
});

export const roleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  isSpecial: z.boolean().optional(),
});

// --- Audit Findings Schemas ---

export const findingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().optional(),
  details: z.string().min(1, 'Details are required'),
  riskLevel: z.string().min(1, 'Risk level is required'),
  branch: z.union([z.string(), z.null()]).optional().transform(val => val === '' ? null : val),
  department: z.union([z.string(), z.null()]).optional().transform(val => val === '' ? null : val),
  district: z.union([z.string(), z.null()]).optional().transform(val => val === '' ? null : val),
  branchOrDepartment: z.string().min(1, 'Branch/Department is required').optional(),
  recommendation: z.string().optional(),
  hierarchyNodeId: z.string().optional(),
  auditCause: z.string().optional(),
  auditEffect: z.string().optional(),
  involvedAmounts: z.array(z.any()).optional(),
  teamLeader: z.string().optional(),
  teamMembers: z.array(z.string()).optional(),
  assignedDate: z.string().optional().or(z.date()),
  rectificationDate: z.string().optional().or(z.date()),
  tatDays: z.coerce.number().optional(),
  dynamicValues: z.record(z.any()).optional(),
  auditorId: z.string().optional(),
  auditeeId: z.string().optional(),
});

export const submitFindingsSchema = z.object({
  hierarchyNodeId: z.string().min(1),
  findings: z.array(findingSchema).min(1, 'At least one finding is required'),
});

// --- Special Audit Schemas ---

export const individualSchema = z.object({
  name: z.string().min(1),
  position: z.string().min(1),
  tenure: z.string().min(1),
  age: z.coerce.number().min(18).max(100),
  sex: z.enum(['Male', 'Female', 'Other']),
});

export const specialAuditSchema = z.object({
  shortSummary: z.string().min(10, 'Summary must be at least 10 characters.'),
  placement: z.enum(['Branch', 'District', 'H.O'], {
    required_error: 'Placement category is required.',
  }),
  placementValue: z.string().min(1, 'Placement detail is required.'),
  categoryId: z.string().min(1, 'Category is required.'),
  amountInvolved: z.coerce.number().nonnegative('Amount must be 0 or greater.'),
  recovered: z.coerce.number().nonnegative('Recovered amount must be 0 or greater.'),
  pending: z.coerce.number().nonnegative('Pending amount must be 0 or greater.'),
  actionDisciplinary: z.string().min(1, 'Disciplinary action is required.'),
  gapWitnessed: z.string().min(1, 'Gap description is required.'),
  correctiveActionTaken: z.string().min(1, 'Corrective action is required.'),
  auditCause: z.string().optional(),
  auditEffect: z.string().optional(),
  recommendation: z.string().optional(),
  individuals: z.array(individualSchema).min(1, 'At least one individual is required.'),
});

// --- Settings Schemas ---

export const hierarchyNodeSchema = z.object({
  title: z.string().min(1),
  number: z.string().min(1),
  level: z.coerce.number(),
  parentId: z.string().optional().nullable(),
  customFields: z.array(z.any()).optional(),
});

export const branchSchema = z.object({
  name: z.string().min(1),
  district: z.string().min(1),
});

export const districtSchema = z.object({
  name: z.string().min(1),
});

export const departmentSchema = z.object({
  name: z.string().min(1),
});

export const riskLevelSchema = z.object({
  name: z.string().min(1),
});

export const findingStatusSchema = z.object({
  name: z.string().min(1),
});

export const followUpStatusSchema = z.object({
  name: z.string().min(1),
});

export const specialFindingCategorySchema = z.object({
  name: z.string().min(1),
});
