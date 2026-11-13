import type { ReactNode } from "react";
import { BRAND } from "../brand";

const SUPPORT = (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined) || "support@camponord.eu";
const UPDATED = "12 November 2026";

const Contact = () =>
  SUPPORT ? <a className="underline" href={`mailto:${SUPPORT}`}>{SUPPORT}</a> : <span>the support address on our directory listing</span>;

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-chalk text-ink font-sans flex justify-center">
      <article className="w-full max-w-[640px] flex flex-col gap-4 px-5 pt-10 pb-12 text-[15px] leading-relaxed [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
        <a href="/" className="text-sm text-muted">‹ {BRAND.name}</a>
        <h1 className="m-0 font-display text-[30px] font-semibold tracking-tightish">{title}</h1>
        <span className="text-sm text-muted">Last updated {UPDATED}</span>
        {children}
      </article>
    </div>
  );
}

export function Privacy() {
  return (
    <Page title="Privacy policy">
      <p>{BRAND.title} ("{BRAND.name}") helps you plan and log strength training. This explains what we store, why, and your choices.</p>

      <h2>What we store</h2>
      <ul>
        <li><b>Without an account:</b> everything stays in your browser on this device. We receive nothing.</li>
        <li><b>With an account:</b> your email address, your program and goals, logged sets, check-ins (sleep, energy, soreness), habits, body measurements, and coach memory notes.</li>
        <li><b>If you turn on reminders:</b> a push address for that device (issued by your browser's push service) and your reminder time. Turning reminders off or signing out deletes it.</li>
      </ul>
      <p>Training and body data is health-related information. We process it only to provide the service you asked for, based on your consent when you create an account. You can withdraw it at any time by deleting your account.</p>

      <h2>ChatGPT, Claude and other AI apps</h2>
      <p>If you connect an AI app, it can read and update your {BRAND.name} data through our connector, only after you approve it on our consent screen. What you say in that chat is handled by that provider under their own privacy policy. You can disconnect an app in You › Connected AI apps at any time.</p>

      <h2>What we don't do</h2>
      <ul>
        <li>We don't sell your data or use it for advertising.</li>
        <li>We don't share it, except with the service providers that run {BRAND.name}: Supabase (database and sign-in) and Vercel (hosting). Reminder notifications pass through your browser maker's push service (for example Google, Apple or Mozilla).</li>
        <li>Our logs record which feature was used and how long it took, not your training or health data.</li>
      </ul>

      <h2>Your rights</h2>
      <ul>
        <li><b>Access and export:</b> You › Export my data downloads everything as JSON.</li>
        <li><b>Correction:</b> edit or delete any entry in the app.</li>
        <li><b>Deletion:</b> You › Delete account permanently removes your account and all data from our servers.</li>
        <li>You can also contact us, or your local data protection authority.</li>
      </ul>

      <h2>Contact</h2>
      <p>Questions or requests: <Contact />.</p>
    </Page>
  );
}

export function Terms() {
  return (
    <Page title="Terms of use">
      <p>By using {BRAND.name} you agree to these terms.</p>

      <h2>Not medical advice</h2>
      <p>{BRAND.name} gives general training guidance generated from your inputs. It is not medical advice and does not replace a doctor, physiotherapist or qualified coach. Check with a professional before starting if you have an injury, a medical condition, or are pregnant. Stop and seek help if something hurts.</p>

      <h2>Your responsibility</h2>
      <ul>
        <li>Choose loads you can lift safely, with good technique and a spotter where needed.</li>
        <li>Suggested weights and adjustments are estimates based on what you log; you decide what you lift.</li>
        <li>Keep your sign-in email secure. You're responsible for activity on your account and the AI apps you connect.</li>
      </ul>

      <h2>The service</h2>
      <p>{BRAND.name} is currently free. We may change or discontinue features, and we'll give notice before removing your access to your data. Don't misuse the service (for example, automated scraping or attempts to access other users' data).</p>

      <h2>Liability</h2>
      <p>The service is provided "as is". To the extent the law allows, we aren't liable for injuries or losses from training decisions you make using it.</p>

      <h2>Contact</h2>
      <p><Contact /></p>
    </Page>
  );
}
