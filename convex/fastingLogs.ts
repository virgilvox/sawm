import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const getForDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("fasting_logs")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .first();
  },
});

export const getRange = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    const logs = await ctx.db
      .query("fasting_logs")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", args.startDate))
      .collect();
    return logs.filter((l) => l.date <= args.endDate);
  },
});

export const upsert = mutation({
  args: {
    date: v.string(),
    completed: v.boolean(),
    suhoorTime: v.optional(v.string()),
    iftarTime: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("fasting_logs")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: args.completed,
        suhoorTime: args.suhoorTime,
        iftarTime: args.iftarTime,
        notes: args.notes,
      });
    } else {
      await ctx.db.insert("fasting_logs", { userId, ...args });
    }
  },
});
