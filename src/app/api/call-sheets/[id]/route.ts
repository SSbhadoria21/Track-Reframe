import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    const { id } = await params;

    const { data: callSheet, error: csError } = await supabaseAdmin
      .from('call_sheets')
      .select('*')
      .eq('id', id)
      .single();

    if (csError) throw csError;

    // Check authorization
    if (callSheet.user_id !== user?.id && !callSheet.is_public) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch related tables concurrently
    const [
      { data: locations },
      { data: scenes },
      { data: actors },
      { data: crew },
      { data: sections }
    ] = await Promise.all([
      supabaseAdmin.from('call_sheet_locations').select('*').eq('call_sheet_id', id),
      supabaseAdmin.from('call_sheet_scenes').select('*').eq('call_sheet_id', id).order('scene_order', { ascending: true }),
      supabaseAdmin.from('call_sheet_actors').select('*').eq('call_sheet_id', id),
      supabaseAdmin.from('call_sheet_crew').select('*').eq('call_sheet_id', id),
      supabaseAdmin.from('call_sheet_sections').select('*').eq('call_sheet_id', id)
    ]);

    // Reconstruct sections JSON
    const parsedSections: any = {};
    if (sections) {
      sections.forEach(sec => {
        parsedSections[sec.section_type] = sec.content;
      });
    }

    return NextResponse.json({
      ...callSheet,
      locations: locations || [],
      scenes: scenes || [],
      actors: actors || [],
      crew: crew || [],
      sections: parsedSections
    });
  } catch (error) {
    console.error('Error fetching call sheet:', error);
    return NextResponse.json({ error: 'Failed to fetch call sheet' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('call_sheets')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update main call sheet
    const { error: updateError } = await supabaseAdmin
      .from('call_sheets')
      .update({
        project_title: body.projectInfo.projectTitle,
        project_type: body.projectInfo.projectType,
        director_name: body.projectInfo.directorName,
        producer_name: body.projectInfo.producerName,
        production_company: body.projectInfo.productionCompany,
        logo_url: body.projectInfo.logoUrl,
        shoot_date: body.projectInfo.shootDate,
        shoot_day_number: body.projectInfo.shootDayNumber,
        total_shoot_days: body.projectInfo.totalShootDays,
        call_sheet_number: body.projectInfo.callSheetNumber,
        general_call_time: body.projectInfo.generalCallTime,
        shoot_start_time: body.projectInfo.shootStartTime,
        estimated_wrap_time: body.projectInfo.estimatedWrapTime,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // Helper function to upsert tables
    const upsertTable = async (tableName: string, items: any[], mapFn: (item: any) => any) => {
      if (!items || items.length === 0) return;
      const records = items.map(mapFn);
      const { error } = await supabaseAdmin.from(tableName).upsert(records);
      if (error) throw error;
    };

    // Upsert locations
    await upsertTable('call_sheet_locations', body.locations || [], (loc) => ({
      id: loc.id.includes('-') ? loc.id : undefined,
      call_sheet_id: id,
      location_name: loc.locationName,
      address: loc.address,
      location_type: loc.locationType,
      maps_link: loc.mapsLink,
      landmark: loc.landmark,
      parking_notes: loc.parkingNotes
    }));

    // Upsert scenes
    await upsertTable('call_sheet_scenes', body.scenes || [], (sc) => ({
      id: sc.id.includes('-') ? sc.id : undefined,
      call_sheet_id: id,
      scene_number: sc.sceneNumber,
      description: sc.description,
      location: sc.location,
      int_ext: sc.intExt,
      day_night: sc.dayNight,
      start_time: sc.startTime,
      end_time: sc.endTime,
      pages: sc.pages,
      special_requirements: sc.specialRequirements,
      scene_order: sc.sceneOrder
    }));

    // Upsert actors
    await upsertTable('call_sheet_actors', body.actors || [], (ac) => ({
      id: ac.id.includes('-') ? ac.id : undefined,
      call_sheet_id: id,
      actor_name: ac.actorName,
      character_name: ac.characterName,
      actor_type: ac.actorType,
      reporting_time: ac.reportingTime,
      makeup_call_time: ac.makeupCallTime,
      on_set_time: ac.onSetTime,
      scenes_in: ac.scenesIn,
      contact_number: ac.contactNumber,
      notes: ac.notes
    }));

    // Upsert crew
    await upsertTable('call_sheet_crew', body.crew || [], (cr) => ({
      id: cr.id.includes('-') ? cr.id : undefined,
      call_sheet_id: id,
      department: cr.department,
      name: cr.name,
      role_title: cr.roleTitle,
      contact_number: cr.contactNumber,
      reporting_time: cr.reportingTime,
      notes: cr.notes
    }));

    // Upsert sections
    if (body.sections) {
      const sectionEntries = Object.entries(body.sections).map(([type, content]) => ({
        call_sheet_id: id,
        section_type: type,
        content: content
      }));
      
      const { error: secError } = await supabaseAdmin
        .from('call_sheet_sections')
        .upsert(sectionEntries, { onConflict: 'call_sheet_id, section_type' });
      
      if (secError) throw secError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving call sheet:', error);
    return NextResponse.json({ error: 'Failed to save call sheet' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    const { error } = await supabaseAdmin
      .from('call_sheets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting call sheet:', error);
    return NextResponse.json({ error: 'Failed to delete call sheet' }, { status: 500 });
  }
}
