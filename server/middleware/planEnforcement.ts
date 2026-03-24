import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { PLAN_FEATURES, PlanType } from "@shared/schema";

// Match the existing AuthenticatedRequest pattern from auth.ts
// The authMiddleware sets req.user from req.session.user

export function checkUserLimit() {
  return async (req: any, res: Response, next: NextFunction) => {
    const user = req.user || req.session?.user;
    if (!user?.organizationId) return next();

    const org = await storage.getOrganization(user.organizationId);
    if (!org) return next();

    const limit = org.userLimit;
    if (limit === null) return next(); // unlimited

    const currentCount = await storage.countActiveUsersInOrg(user.organizationId);
    if (currentCount >= limit) {
      return res.status(403).json({
        error: "User limit reached",
        message: `Your ${org.plan} plan allows up to ${limit} users. Upgrade to add more.`,
        upgradeRequired: true,
      });
    }

    next();
  };
}

export function checkRequestLimit() {
  return async (req: any, res: Response, next: NextFunction) => {
    const user = req.user || req.session?.user;
    if (!user?.organizationId) return next();

    const org = await storage.getOrganization(user.organizationId);
    if (!org) return next();

    const limit = org.monthlyRequestLimit;
    if (limit === null) return next(); // unlimited

    const count = await storage.countRequestsThisMonth(
      user.organizationId,
      org.requestCountResetDate,
    );

    if (count >= limit) {
      return res.status(403).json({
        error: "Monthly request limit reached",
        message: `Your ${org.plan} plan allows ${limit} requests per month. Upgrade for more.`,
        upgradeRequired: true,
      });
    }

    next();
  };
}

export function requireFeature(featureName: string) {
  return async (req: any, res: Response, next: NextFunction) => {
    const user = req.user || req.session?.user;
    if (!user?.organizationId) return next();

    const org = await storage.getOrganization(user.organizationId);
    if (!org) return next();

    const allowedPlans = PLAN_FEATURES[featureName];
    if (!allowedPlans) return next(); // feature not gated

    if (!allowedPlans.includes(org.plan as PlanType)) {
      return res.status(403).json({
        error: "Feature not available",
        message: `The ${featureName} feature requires a higher plan. Upgrade to access it.`,
        upgradeRequired: true,
        requiredPlan: allowedPlans[0],
      });
    }

    next();
  };
}
