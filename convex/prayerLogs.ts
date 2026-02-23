import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const getForDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("prayer_logs")
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
      .query("prayer_logs")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).gte("date", args.startDate))
      .collect();
    return logs.filter((l) => l.date <= args.endDate);
  },
});

export const upsert = mutation({
  args: {
    date: v.string(),
    fajr: v.boolean(),
    dhuhr: v.boolean(),
    asr: v.boolean(),
    maghrib: v.boolean(),
    isha: v.boolean(),
    taraweeh: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("prayer_logs")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        fajr: args.fajr,
        dhuhr: args.dhuhr,
        asr: args.asr,
        maghrib: args.maghrib,
        isha: args.isha,
        taraweeh: args.taraweeh,
      });
    } else {
      await ctx.db.insert("prayer_logs", { userId, ...args });
    }
  },
});
