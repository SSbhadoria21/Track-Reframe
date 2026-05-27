-- Migration: Create Budget Estimator Tables
-- Description: Adds tables for the professional Film Budget Estimator tool.

CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    project_title TEXT NOT NULL,
    project_type TEXT NOT NULL,
    budget_scope TEXT NOT NULL,
    shoot_days INTEGER DEFAULT 0,
    shoot_start_date DATE,
    currency TEXT DEFAULT 'USD',
    production_scale TEXT,
    script_url TEXT,
    script_page_count INTEGER,
    crew_count INTEGER DEFAULT 0,
    grand_total DECIMAL(12, 2) DEFAULT 0.00,
    contingency_percent DECIMAL(5, 2) DEFAULT 10.00,
    notes TEXT,
    share_token TEXT UNIQUE,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.budget_departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    department_name TEXT NOT NULL,
    department_order INTEGER NOT NULL,
    is_expanded BOOLEAN DEFAULT true,
    subtotal DECIMAL(12, 2) DEFAULT 0.00,
    UNIQUE(budget_id, department_name)
);

CREATE TABLE IF NOT EXISTS public.budget_line_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID NOT NULL REFERENCES public.budget_departments(id) ON DELETE CASCADE,
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role_description TEXT,
    payment_type TEXT,
    rate DECIMAL(12, 2) DEFAULT 0.00,
    units DECIMAL(10, 2) DEFAULT 1.00,
    subtotal DECIMAL(12, 2) DEFAULT 0.00,
    notes TEXT,
    row_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.budget_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(budget_id, version_number)
);

-- Enable RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_versions ENABLE ROW LEVEL SECURITY;

-- Policies for budgets
CREATE POLICY "Users can view their own budgets"
    ON public.budgets FOR SELECT
    USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own budgets"
    ON public.budgets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
    ON public.budgets FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
    ON public.budgets FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for budget_departments
CREATE POLICY "Users can view departments of accessible budgets"
    ON public.budget_departments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.budgets
            WHERE budgets.id = budget_departments.budget_id
            AND (budgets.user_id = auth.uid() OR budgets.is_public = true)
        )
    );

CREATE POLICY "Users can manage departments of their own budgets"
    ON public.budget_departments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.budgets
            WHERE budgets.id = budget_departments.budget_id
            AND budgets.user_id = auth.uid()
        )
    );

-- Policies for budget_line_items
CREATE POLICY "Users can view line items of accessible budgets"
    ON public.budget_line_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.budgets
            WHERE budgets.id = budget_line_items.budget_id
            AND (budgets.user_id = auth.uid() OR budgets.is_public = true)
        )
    );

CREATE POLICY "Users can manage line items of their own budgets"
    ON public.budget_line_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.budgets
            WHERE budgets.id = budget_line_items.budget_id
            AND budgets.user_id = auth.uid()
        )
    );

-- Policies for budget_versions
CREATE POLICY "Users can view versions of accessible budgets"
    ON public.budget_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.budgets
            WHERE budgets.id = budget_versions.budget_id
            AND (budgets.user_id = auth.uid() OR budgets.is_public = true)
        )
    );

CREATE POLICY "Users can manage versions of their own budgets"
    ON public.budget_versions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.budgets
            WHERE budgets.id = budget_versions.budget_id
            AND budgets.user_id = auth.uid()
        )
    );
