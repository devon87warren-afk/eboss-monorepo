"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SavingsEntry = {
    id: string;
    created_at: string;
    runtime_hours: number;
    fuel_price: number;
    project_days: number;
    cost_saved: number;
    co2_saved_tons: number;
    trees_planted: number;
};

export async function saveCalculation(data: Omit<SavingsEntry, "id" | "created_at">) {
    const supabase = await createClient();

    // In a real app, you might validate input here using Zod
    const { error } = await supabase
        .from("savings_entries")
        .insert(data);

    if (error) {
        console.error("Error saving calculation:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/dashboard"); // or wherever the calculator lives
    revalidatePath("/");

    return { success: true };
}

export async function getSavingsHistory(limit = 10) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("savings_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching savings history:", error);
        return [];
    }

    return data as SavingsEntry[];
}
