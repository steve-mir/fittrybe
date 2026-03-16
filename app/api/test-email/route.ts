// app/api/test-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Helper to check environment
function checkEnvironment() {
  const envCheck = {
    RESEND_API_KEY: {
      exists: !!process.env.RESEND_API_KEY,
      prefix: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 8) + "..." : null,
      length: process.env.RESEND_API_KEY?.length || 0,
    },
    RESEND_FROM_EMAIL: {
      exists: !!process.env.RESEND_FROM_EMAIL,
      value: process.env.RESEND_FROM_EMAIL || null,
    },
    NODE_ENV: process.env.NODE_ENV,
  };
  
  return envCheck;
}

export async function POST(req: NextRequest) {
  console.log("🔧 [TEST-EMAIL] Route called");
  console.log("📋 Environment check:", JSON.stringify(checkEnvironment(), null, 2));

  try {
    const body = await req.json();
    const { email } = body;

    console.log("📧 Email to test:", email);

    if (!email || !email.includes("@")) {
      console.log("❌ Invalid email:", email);
      return NextResponse.json(
        { 
          error: "Valid email required",
          received: email 
        },
        { status: 400 }
      );
    }

    // Initialize Resend
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("❌ RESEND_API_KEY not found");
      return NextResponse.json(
        { 
          error: "RESEND_API_KEY is not set",
          env: checkEnvironment()
        },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Fittrybe <onboarding@resend.dev>";

    console.log("📨 Attempting to send via Resend");
    console.log("  From:", fromEmail);
    console.log("  To:", email);

    // Simple test email
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: "Test Email from Fittrybe",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Test Email</title>
          </head>
          <body style="background: #0D0D0D; color: #fff; font-family: sans-serif; padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto; background: #0a0a0a; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 40px;">
              <h1 style="color: #B6FF00; margin-bottom: 20px;">✅ Test Email Successful!</h1>
              <p style="color: #fff; line-height: 1.6;">If you're reading this, email sending is working correctly.</p>
              <p style="color: #6B7280; margin-top: 30px; font-size: 14px;">
                Sent at: ${new Date().toLocaleString()}
              </p>
            </div>
          </body>
        </html>
      `,
      text: "Test Email from Fittrybe - If you're reading this, email sending is working correctly.",
    });

    if (error) {
      console.error("❌ Resend error:", error);
      return NextResponse.json(
        { 
          error: "Resend API error",
          details: error,
          env: checkEnvironment()
        },
        { status: 500 }
      );
    }

    console.log("✅ Email sent successfully:", data);
    return NextResponse.json({ 
      success: true, 
      message: "Test email sent successfully!",
      data,
      env: checkEnvironment()
    });

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return NextResponse.json(
      { 
        error: "Server error",
        details: error instanceof Error ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : String(error),
        env: checkEnvironment()
      },
      { status: 500 }
    );
  }
}