import express from "express";
import helmet from "helmet";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import twilio from "twilio";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  app.disable("x-powered-by");
  const PORT = 3000;

  // Implement Content Security Policy (CSP) using Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for Vite dev server / React
            "'unsafe-eval'",   // Required for some DevTools and Vite
            "https://apis.google.com",
            "https://www.gstatic.com",
            "https://*.firebaseapp.com",
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'", // Required for Tailwind/Vite injected styles
            "https://fonts.googleapis.com",
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "data:",
          ],
          imgSrc: [
            "'self'",
            "data:",
            "https://*",
            "blob:",
          ],
          connectSrc: [
            "'self'",
            "ws:",
            "wss:", // For Vite HMR
            "https://firestore.googleapis.com",
            "https://identitytoolkit.googleapis.com",
            "https://securetoken.googleapis.com",
            "https://*.firebaseio.com",
          ],
          frameSrc: [
            "'self'",
            "https://*.firebaseapp.com",
          ],
          frameAncestors: [
            "'self'",
            "https://ai.studio",
            "https://*.ai.studio",
            "https://aistudio.google.com",
            "https://*.aistudio.google.com",
            "*"
          ],
        },
      },
      // Disable X-Frame-Options in favor of CSP frame-ancestors
      frameguard: false,
    })
  );

  app.use(express.json({ limit: "50mb" }));

  // API routes FIRST
  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, html } = req.body;
      
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        console.warn("RESEND_API_KEY is not set. Mocking email send.");
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return res.json({ success: true, mocked: true, message: "Email mocked successfully (API key missing)" });
      }

      const resend = new Resend(apiKey);
      const data = await resend.emails.send({
        from: "ConstituencyOS <onboarding@resend.dev>",
        to: to, // array of emails or single string
        subject: subject,
        html: html,
      });

      res.json({ success: true, data });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.post("/api/send-whatsapp", async (req, res) => {
    try {
      const { to, content } = req.body;
      
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      let fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";
      
      if (fromNumber && !fromNumber.startsWith("whatsapp:")) {
        // Just in case the user specified the number without the whatsapp: prefix
        fromNumber = `whatsapp:${fromNumber.startsWith('+') ? '' : '+'}${fromNumber.replace(/[^\d+]/g, '')}`;
      }
      
      if (!accountSid || !authToken) {
        console.warn("TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is not set. Mocking WhatsApp send.");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return res.json({ success: true, mocked: true, message: "WhatsApp message mocked successfully (API key missing)" });
      }

      const client = twilio(accountSid, authToken);
      const results = [];

      // Ensure 'to' is an array, map over and send each
      // Twilio API accepts one message per request
      const recipients = Array.isArray(to) ? to : [to];
      
      for (let recipient of recipients) {
        // Ensure recipient is a string and clean it up
        recipient = String(recipient).trim();
        // format phone number if needed, ensuring it's prefixed with whatsapp:
        // if it doesn't start with '+', it might be missing a country code.
        const cleanedPhoneNumber = recipient.replace(/[^\d+]/g, '');
        let formattedNumber = cleanedPhoneNumber;
        if (!formattedNumber.startsWith('+')) {
          formattedNumber = '+' + formattedNumber;
        }
        
        const toPhone = recipient.startsWith('whatsapp:') ? recipient : `whatsapp:${formattedNumber}`;
        
        try {
          const message = await client.messages.create({
            body: content,
            from: fromNumber,
            to: toPhone
          });
          results.push(message.sid);
        } catch (msgError: any) {
          console.error(`Failed to send to ${toPhone}:`, msgError);
          throw msgError; // Rethrow to be caught by the outer block
        }
      }

      res.json({ success: true, data: results });
    } catch (error: any) {
      console.error("Error sending WhatsApp:", error);
      res.status(500).json({ success: false, error: error.message || String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
