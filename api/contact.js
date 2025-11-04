
// /api/contact — envoi d'e-mail via Resend (recommandé) ou SMTP (Nodemailer)
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({ok:false});
  const { name, email, phone, message } = req.body || {};
  const subject = `Demande de contact – ${name||'visiteur'}`;
  const html = `<p><strong>Nom:</strong> ${name||''}</p>
                <p><strong>Email:</strong> ${email||''}</p>
                <p><strong>Téléphone:</strong> ${phone||''}</p>
                <p><strong>Message:</strong><br>${(message||'').replace(/\n/g,'<br>')}</p>`;

  try{
    if(process.env.RESEND_API_KEY && process.env.CONTACT_TO){
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({ from: process.env.CONTACT_FROM || 'site@yourdomain.com', to: process.env.CONTACT_TO, subject, html });
      return res.status(200).json({ok:true, via:'resend'});
    }
    if(process.env.SMTP_HOST && process.env.CONTACT_TO){
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT||587), secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({ from: process.env.CONTACT_FROM || process.env.SMTP_USER, to: process.env.CONTACT_TO, subject, html });
      return res.status(200).json({ok:true, via:'smtp'});
    }
    return res.status(500).json({ok:false, error:'missing_env'});
  }catch(e){
    console.error(e);
    return res.status(500).json({ok:false});
  }
}
