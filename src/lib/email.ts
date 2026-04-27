import { Resend } from 'resend';

// IMPORTANT: Add RESEND_API_KEY to your .env.local
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export default resend;
