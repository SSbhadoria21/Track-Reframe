import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('budgets')
      .insert({
        user_id: user.id,
        project_title: body.project_title || 'Untitled Budget',
        project_type: body.project_type || 'Short Film',
        budget_scope: body.budget_scope || 'Full Production',
        shoot_days: body.shoot_days || 1,
        shoot_start_date: body.shoot_start_date,
        currency: body.currency || 'USD',
        production_scale: body.production_scale || 'Indie',
        contingency_percent: body.contingency_percent || 10,
        notes: body.notes || ''
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error inserting budget:', error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating budget:', error);
    return NextResponse.json({ error: error.message || 'Failed to create budget' }, { status: 500 });
  }
}
