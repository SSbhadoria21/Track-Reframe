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

    const { data: budget, error: budgetError } = await supabaseAdmin
      .from('budgets')
      .select('*')
      .eq('id', id)
      .single();

    if (budgetError) throw budgetError;

    // Check if the user is authorized (owner or public)
    if (budget.user_id !== user?.id && !budget.is_public) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch departments and line items
    const { data: departments, error: depError } = await supabaseAdmin
      .from('budget_departments')
      .select('*, budget_line_items(*)')
      .eq('budget_id', id)
      .order('department_order', { ascending: true });

    if (depError) throw depError;

    // Format response
    const formattedBudget = {
      ...budget,
      departments: departments.map(dep => ({
        id: dep.id,
        name: dep.department_name,
        order: dep.department_order,
        isExpanded: dep.is_expanded,
        subtotal: dep.subtotal,
        items: dep.budget_line_items.sort((a: any, b: any) => a.row_order - b.row_order).map((item: any) => ({
          id: item.id,
          name: item.name,
          roleDescription: item.role_description,
          paymentType: item.payment_type,
          rate: item.rate,
          units: item.units,
          subtotal: item.subtotal,
          notes: item.notes
        }))
      }))
    };

    return NextResponse.json(formattedBudget);
  } catch (error) {
    console.error('Error fetching budget:', error);
    return NextResponse.json({ error: 'Failed to fetch budget' }, { status: 500 });
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
      .from('budgets')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update top-level budget
    const { error: updateError } = await supabaseAdmin
      .from('budgets')
      .update({
        project_title: body.projectData.title,
        project_type: body.projectData.type,
        budget_scope: body.projectData.scope,
        shoot_days: body.projectData.shootDays,
        shoot_start_date: body.projectData.startDate,
        currency: body.projectData.currency,
        production_scale: body.projectData.scale,
        contingency_percent: body.projectData.contingencyPercent,
        notes: body.projectData.notes,
        crew_count: body.crewCount,
        grand_total: body.grandTotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // For simplicity in auto-save: we can delete existing departments/items and recreate them,
    // OR do an upsert. Let's do an upsert for departments and line items.
    
    // Process departments
    for (const dep of body.departments) {
      const { data: depData, error: depError } = await supabaseAdmin
        .from('budget_departments')
        .upsert({
          id: dep.id.includes('-') ? dep.id : undefined, // Check if UUID
          budget_id: id,
          department_name: dep.name,
          department_order: dep.order,
          is_expanded: dep.isExpanded,
          subtotal: dep.subtotal
        }, { onConflict: 'budget_id, department_name' })
        .select()
        .single();
        
      if (depError) throw depError;

      const currentDepId = depData.id;

      // Upsert line items
      if (dep.items && dep.items.length > 0) {
        const itemsToUpsert = dep.items.map((item: any, index: number) => ({
          id: item.id.includes('-') ? item.id : undefined,
          department_id: currentDepId,
          budget_id: id,
          name: item.name,
          role_description: item.roleDescription,
          payment_type: item.paymentType,
          rate: item.rate,
          units: item.units,
          subtotal: item.subtotal,
          notes: item.notes,
          row_order: index
        }));

        const { error: itemsError } = await supabaseAdmin
          .from('budget_line_items')
          .upsert(itemsToUpsert);

        if (itemsError) throw itemsError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving budget:', error);
    return NextResponse.json({ error: 'Failed to save budget' }, { status: 500 });
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
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting budget:', error);
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 });
  }
}
