import { z } from "zod";

// Common validation patterns
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const simplePasswordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be less than 50 characters");

export const urlSchema = z
  .string()
  .url("Please enter a valid URL")
  .or(z.literal(""));

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number")
  .or(z.literal(""));

// Login form validation
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// Registration form validation
export const registerFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: simplePasswordSchema,
  confirmPassword: z.string(),
  role: z.enum(["CLIENT", "PROVIDER"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Request form validation
export const createRequestSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be less than 2000 characters"),
  serviceTypeId: z.string().min(1, "Please select a service type"),
  priority: z.number().min(1).max(5),
});

// Comment validation
export const commentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment must be less than 1000 characters"),
});

// Deliverable validation
export const deliverableSchema = z.object({
  deliverableMessage: z
    .string()
    .min(5, "Deliverable message must be at least 5 characters")
    .max(2000, "Deliverable message must be less than 2000 characters"),
  files: z.array(z.string()).optional(),
});

// Revision request validation
export const revisionRequestSchema = z.object({
  feedback: z
    .string()
    .min(10, "Please provide at least 10 characters of feedback")
    .max(1000, "Feedback must be less than 1000 characters"),
});

// Rating validation
export const ratingSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  reviewText: z.string().max(500, "Review must be less than 500 characters").optional(),
});

// Profile update validation
export const profileUpdateSchema = z.object({
  name: nameSchema,
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  portfolio: urlSchema.optional(),
  skillsTags: z.array(z.string()).optional(),
});

// Type inference helpers
export type LoginFormData = z.infer<typeof loginFormSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;
export type CreateRequestData = z.infer<typeof createRequestSchema>;
export type CommentData = z.infer<typeof commentSchema>;
export type DeliverableData = z.infer<typeof deliverableSchema>;
export type RevisionRequestData = z.infer<typeof revisionRequestSchema>;
export type RatingData = z.infer<typeof ratingSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

// Validation helper function
export function validateField<T>(
  schema: z.ZodType<T>,
  value: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message || "Invalid value" };
}

// Form error extractor
export function getFormErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}
