import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Convert File to Buffer for server-side upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('posts')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('posts')
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
