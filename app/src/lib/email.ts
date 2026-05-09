import { supabase, markWelcomeEmailSent } from './supabase';

/**
 * Senior Dev Note (Microsoft Standards):
 * To bypass Browser CORS restrictions and keep API keys secure,
 * all emails are now routed through a Supabase Edge Function ('resend').
 */

const APP_DASHBOARD_LINK = 'https://internship-0sf2.onrender.com/#dashboard';

export const sendWelcomeEmail = async (
  userId: string,
  userEmail: string,
  userName: string,
  initialPassword?: string
) => {
  try {
    const { error } = await supabase.functions.invoke('resend', {
      body: {
        to: userEmail,
        reply_to: 'supportinternship@gmail.com',
        subject: 'Welcome to the InternTrack Platform',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff;">
            <div style="margin-bottom: 40px;">
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding-right: 20px; border-right: 2px solid #e5e5e7; vertical-align: middle;">
                    <div style="text-align: left; line-height: 1.1;">
                      <span style="color: #141413; font-size: 24px; font-weight: 900; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: block; text-transform: uppercase;">INTERN</span>
                      <span style="color: #0071E3; font-size: 24px; font-weight: 900; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: block; text-transform: uppercase;">TRACK</span>
                    </div>
                  </td>
                  <td style="padding-left: 20px; vertical-align: middle;">
                    <div style="text-align: left; line-height: 1.1;">
                      <span style="color: #86868b; font-size: 10px; font-weight: 800; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 2px;">The Professional</span>
                      <span style="color: #141413; font-size: 32px; font-weight: 900; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: block; letter-spacing: -1px;">Platform</span>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
            
            <h2 style="color: #1a1a1a; font-size: 24px; font-weight: 700; margin-bottom: 20px;">Welcome to the Network, ${userName}!</h2>
            
            <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Your account has been successfully initialized. You now have access to the most exclusive internship opportunities in the industry.
            </p>

            ${initialPassword ? `
            <div style="background-color: #f5f5f7; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
              <p style="margin: 0; font-size: 14px; color: #86868b; margin-bottom: 5px;">Your Initial Password</p>
              <code style="font-size: 18px; font-weight: 700; color: #007AFF;">${initialPassword}</code>
            </div>
            ` : ''}

            <div style="text-align: center; margin-bottom: 40px;">
              <a href="${APP_DASHBOARD_LINK}" style="display: inline-block; padding: 16px 32px; background-color: #007AFF; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px;">
                Access Your Dashboard
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #f2f2f2; margin-bottom: 30px;" />
            
            <p style="color: #86868b; font-size: 12px; text-align: center; line-height: 1.5;">
              This is an official communication from the InternTrack Platform.<br />
              (this is a test email, dont worry)
            </p>
          </div>
        `,
      },
    });

    if (!error) {
      console.log(`[🚀] Welcome email successfully dispatched via Edge Function to ${userEmail}`);
      await markWelcomeEmailSent(userId);
      return true;
    }
    console.error('Edge Function Dispatch Error:', error);
    return false;
  } catch (error) {
    console.error('Failure during email dispatch:', error);
    return false;
  }
};

export const sendCustomEmail = async (
  userEmail: string,
  userName: string,
  subject: string,
  message: string
) => {
  try {
    const { error } = await supabase.functions.invoke('resend', {
      body: {
        to: userEmail,
        reply_to: 'supportinternship@gmail.com',
        subject: subject,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff;">
            <div style="margin-bottom: 40px;">
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding-right: 20px; border-right: 2px solid #e5e5e7; vertical-align: middle;">
                    <div style="text-align: left; line-height: 1.1;">
                      <span style="color: #141413; font-size: 24px; font-weight: 900; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: block; text-transform: uppercase;">INTERN</span>
                      <span style="color: #0071E3; font-size: 24px; font-weight: 900; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: block; text-transform: uppercase;">TRACK</span>
                    </div>
                  </td>
                  <td style="padding-left: 20px; vertical-align: middle;">
                    <div style="text-align: left; line-height: 1.1;">
                      <span style="color: #86868b; font-size: 10px; font-weight: 800; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 2px;">The Professional</span>
                      <span style="color: #141413; font-size: 32px; font-weight: 900; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: block; letter-spacing: -1px;">Platform</span>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
            
            <h2 style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin-bottom: 20px;">Hello ${userName},</h2>
            
            <div style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 30px; white-space: pre-wrap;">
              ${message}
            </div>

            <div style="text-align: center; margin-bottom: 40px;">
              <a href="${APP_DASHBOARD_LINK}" style="display: inline-block; padding: 16px 32px; background-color: #007AFF; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px;">
                Open Dashboard
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #f2f2f2; margin-bottom: 30px;" />
            
            <p style="color: #86868b; font-size: 12px; text-align: center;">
              This is a custom broadcast from the InternTrack Platform Administrative Team.<br />
              (this is a test email, dont worry)
            </p>
          </div>
        `,
      },
    });

    return !error;
  } catch (err) {
    console.error('Broadcast failure:', err);
    return false;
  }
};
