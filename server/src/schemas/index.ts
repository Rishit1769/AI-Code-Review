import { z } from 'zod'

export const SendOTPSchema = z.object({
  email: z.string().email('Enter a valid email'),
  name:  z.string().min(2).max(100).optional(),
})

export const VerifyOTPSchema = z.object({
  email: z.string().email(),
  otp:   z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'Numbers only'),
})

export const AddRepoSchema = z.object({
  github_id: z.number().int().positive(),
  name:      z.string().min(1).max(255),
  full_name: z.string().min(1).max(500),
  private:   z.boolean().default(false),
})

export const CreateCheckoutSchema = z.object({
  plan: z.enum(['solo', 'team', 'company']),
})

export type SendOTPInput        = z.infer<typeof SendOTPSchema>
export type VerifyOTPInput      = z.infer<typeof VerifyOTPSchema>
export type AddRepoInput        = z.infer<typeof AddRepoSchema>
export type CreateCheckoutInput = z.infer<typeof CreateCheckoutSchema>