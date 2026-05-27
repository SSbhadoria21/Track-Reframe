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
      .from('call_sheets')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching call sheets:', error);
    return NextResponse.json({ error: 'Failed to fetch call sheets' }, { status: 500 });
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
      .from('call_sheets')
      .insert({
        user_id: user.id,
        project_title: body.projectTitle || 'Untitled Call Sheet',
        project_type: body.projectType || 'Short Film',
        director_name: body.directorName || '',
        producer_name: body.producerName || '',
        production_company: body.productionCompany || '',
        logo_url: body.logoUrl || null,
        shoot_date: body.shootDate || new Date().toISOString().split('T')[0],
        shoot_day_number: body.shootDayNumber || 1,
        total_shoot_days: body.totalShootDays || 1,
        call_sheet_number: body.callSheetNumber || 1,
        revision_number: 1,
        general_call_time: body.generalCallTime || '06:00 AM',
        shoot_start_time: body.shootStartTime || '07:30 AM',
        estimated_wrap_time: body.estimatedWrapTime || '08:00 PM',
        status: 'draft'
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating call sheet:', error);
    return NextResponse.json({ error: error.message || 'Failed to create call sheet' }, { status: 500 });
  }
}
