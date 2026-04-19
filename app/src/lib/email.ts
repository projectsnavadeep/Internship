import emailjs from '@emailjs/browser';
import { markWelcomeEmailSent } from './supabase';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

export const sendWelcomeEmail = async (userId: string, userEmail: string, userName: string) => {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('EmailJS keys missing. Skipping email.');
    return;
  }

  try {
    const templateParams = {
      to_email: userEmail,
      user_name: userName,
    };

    // Add a 10-second timeout to prevent UI hanging
    const emailPromise = emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email sending timed out')), 10000)
    );

    const response = await Promise.race([emailPromise, timeoutPromise]) as any;

    if (response.status === 200) {
      console.log('Welcome email sent successfully to:', userEmail);
      // Mark as sent in database
      await markWelcomeEmailSent(userId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('EmailJS Error:', error);
    return false;
  }
};
