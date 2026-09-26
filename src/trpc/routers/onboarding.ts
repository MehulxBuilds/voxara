import { PlanType, UsingFor } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { authProcedure, createTRPCRouter } from "../init";
import { policiesList } from "@/lib/policies";

const onboardingInput = z.object({
  usingFor: z.enum(UsingFor),
  primaryGoals: z.string().trim().min(3, "Tell us a little about your goal.").max(500),
  noteForUs: z.string().trim().max(1000).optional(),
  continueWithPlanType: z.enum(PlanType),
});

export const onboardingRouter = createTRPCRouter({
  getCurrentPlan: authProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: ctx.userId },
      select: {
        isPremium: true,
      },
    });

    return {
      planType: user.isPremium ? "PREMIUM" as const : "FREE" as const,
    };
  }),

  complete: authProcedure
    .input(onboardingInput)
    .mutation(async ({ ctx, input }) => {
      const onboardingPolicy = policiesList.ONBOARD;

      await prisma.user.update({
        where: { id: ctx.userId },
        data: {
          ...input,
          noteForUs: input.noteForUs || null,
          isOnboarded: true,
          policies: {
            upsert: {
              where: {
                userId_type: {
                  userId: ctx.userId,
                  type: onboardingPolicy.type,
                },
              },
              create: {
                isAgreed: true,
                ...onboardingPolicy,
              },
              update: {
                isAgreed: true,
                ...onboardingPolicy,
              }
            }
          }
        },
      });

      return { success: true };
    }),
});
