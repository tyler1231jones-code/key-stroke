// Steps more than one form uses. A template takes them as they are, or
// passes options to adjust them. Field ids here must not be reused in a
// template.
import type { Field, Step } from './types';

/* ---------- You and your business ---------- */
export const you = (): Step => ({
  id: 'you',
  title: 'You and your business',
  intro: 'Who we are working with, and who to send things to.',
  fields: [
    { id: 'business_name', type: 'text', label: 'Business name', required: true, autocomplete: 'organization' },
    { id: 'legal_name', type: 'text', label: 'Legal name of the business, if different', help: 'As it appears on your ABN record.' },
    { id: 'abn', type: 'text', label: 'ABN', help: 'For our invoices, and because an .au domain is licensed to an ABN.' },
    { id: 'business_address', type: 'text', label: 'Business address', autocomplete: 'street-address', wide: true },
    { id: 'contact_name', type: 'text', label: 'Your name', required: true, autocomplete: 'name' },
    { id: 'contact_role', type: 'text', label: 'Your role', autocomplete: 'organization-title' },
    { id: 'contact_email', type: 'email', label: 'Your email', required: true, autocomplete: 'email' },
    { id: 'contact_phone', type: 'tel', label: 'Your phone', autocomplete: 'tel' },
    { id: 'contact_how', type: 'choice', label: 'How should we contact you?', options: ['Email', 'Phone', 'Either'] },
    { id: 'approver', type: 'choice', label: 'Who signs off decisions on this work?', options: ['Me', 'Someone else'], required: true },
    { id: 'approver_name', type: 'text', label: 'Their name and role', required: true, showIf: { field: 'approver', is: 'Someone else' } },
    { id: 'approver_email', type: 'email', label: 'Their email', required: true, showIf: { field: 'approver', is: 'Someone else' } },
    { id: 'billing', type: 'choice', label: 'Who should invoices go to?', options: ['Me', 'Someone else'], required: true },
    { id: 'billing_name', type: 'text', label: 'Their name', required: true, showIf: { field: 'billing', is: 'Someone else' } },
    { id: 'billing_email', type: 'email', label: 'Their email', required: true, showIf: { field: 'billing', is: 'Someone else' } },
    { id: 'billing_ref', type: 'text', label: 'Purchase order or reference for invoices', help: 'Only if your accounts team needs one.' },
  ],
});

/* ---------- The current website ---------- */
const PLATFORMS = ['WordPress', 'Wix', 'Squarespace', 'Shopify', 'Webflow', 'GoDaddy Website Builder', 'Joomla or Drupal', 'Built from scratch by a developer', 'I do not know'];
/** Platforms where the site sits on hosting someone pays for separately. */
const SELF_HOSTED = ['WordPress', 'Joomla or Drupal', 'Built from scratch by a developer', 'I do not know', 'Other'];

export const currentSite = (opts: { required?: boolean } = {}): Step => ({
  id: 'site',
  title: 'Your current website',
  intro: 'How your site is built, where it lives and who looks after it, so we can get into it and move it without losing anything.',
  fields: [
    ...(opts.required
      ? []
      : ([{ id: 'has_site', type: 'choice', label: 'Do you have a website now?', options: ['Yes', 'No, this will be our first'], required: true }] as Field[])),
    ...(
      [
        { id: 'site_url', type: 'url', label: 'Its address', placeholder: 'https://', required: true },
        { id: 'platform', type: 'choice', label: 'What is it built on?', options: PLATFORMS, other: true, required: true, help: 'If you are not sure, say so: we can usually tell from the address.' },
        { id: 'site_built_by', type: 'text', label: 'Who built it?' },
        { id: 'site_looked_after', type: 'choice', label: 'Who looks after it now?', options: ['Nobody at the moment', 'We do it ourselves', 'A developer or agency'], required: true },
        { id: 'developer', type: 'text', label: 'The developer or agency, and how to reach them', wide: true, showIf: { field: 'site_looked_after', is: 'A developer or agency' } },
        { id: 'developer_contract', type: 'choice', label: 'Is there a contract or notice period with them?', options: ['Yes', 'No', 'Not sure'], showIf: { field: 'site_looked_after', is: 'A developer or agency' } },
        { id: 'developer_contract_detail', type: 'longtext', label: 'What does it say about ending it?', showIf: { field: 'developer_contract', is: 'Yes' } },
        { id: 'developer_ok', type: 'tick', label: 'You may contact our current developer for files and access.', showIf: { field: 'site_looked_after', is: 'A developer or agency' } },

        { id: 'host', type: 'choice', label: 'Who hosts it?', help: 'The company you pay to keep the site online.', options: ['VentraIP', 'Crazy Domains', 'GoDaddy', 'SiteGround', 'Hostinger', 'Netregistry', 'WP Engine', 'Our developer hosts it', 'I do not know'], other: true, showIf: { field: 'platform', is: SELF_HOSTED } },
        { id: 'host_payer', type: 'choice', label: 'Who pays for the hosting?', options: ['We pay the host directly', 'Our developer bills us', 'I do not know'], showIf: { field: 'platform', is: SELF_HOSTED } },
        { id: 'host_renews', type: 'date', label: 'When does the hosting next renew?', help: 'Leave blank if you do not know.', showIf: { field: 'platform', is: SELF_HOSTED } },
        { id: 'host_keep', type: 'note', tone: 'warn', text: 'Please do not cancel your current hosting or website plan yet. We tell you when it is safe, after the new site is live and your email has been checked.' },

        { id: 'access_site', type: 'access', label: 'Give us access to the website editor', required: true, steps: [
          'WordPress: in the dashboard, go to Users, then Add New User. Enter {access}, choose the role Administrator, and leave "Send the new user an email" ticked. We set our own password from that email.',
          'Wix: Settings, then Roles and Permissions, then Invite People. Enter {access} and choose Admin (Co-owner).',
          'Squarespace: Settings, then Permissions and Ownership, then Invite Contributor. Enter {access} and choose Administrator.',
          'Shopify: we send a collaborator request from our Shopify partner account. Approve it under Settings, then Users. If your store asks for a collaborator request code, we ask for it by phone.',
          'Webflow: in the site settings, invite {access} as a site manager.',
          'Anything else: tell us below who can let us in, and we arrange it with them or on a short call.',
        ] },
        { id: 'access_host', type: 'access', label: 'Give us access to the hosting account', required: true, showIf: { field: 'platform', is: SELF_HOSTED }, steps: [
          'Log in to your hosting account.',
          'Look for Users, Team, Account access, Delegate access or Contacts.',
          'Add {access} with permission to manage the website, its files, databases and backups.',
          'If your host only lets the account owner in, choose "I cannot do this" and we arrange a short call.',
        ] },

        { id: 'site_does', type: 'multi', label: 'What does your current site do? Tick everything that applies.', other: true, options: ['Contact or quote forms', 'Online bookings', 'Online shop or payments', 'Customer logins or a members area', 'Blog or news', 'Newsletter sign-up', 'Live chat', 'Job applications', 'Downloads, such as price lists or brochures', 'Event listings', 'More than one language', 'Connects to other software, such as a CRM or accounting'] },
        { id: 'forms_go_to', type: 'longtext', label: 'Where do enquiries from its forms go now?', help: 'Email addresses, and any software they land in.', showIf: { field: 'site_does', has: 'Contact or quote forms' } },
        { id: 'bookings_system', type: 'text', label: 'Which booking system?', showIf: { field: 'site_does', has: 'Online bookings' } },
        { id: 'shop_detail', type: 'longtext', label: 'What do you sell online, and how are you paid?', help: 'Roughly how many products, the payment provider (Stripe, PayPal, Square, Shopify Payments), and how you ship.', showIf: { field: 'site_does', has: 'Online shop or payments' } },
        { id: 'logins_detail', type: 'longtext', label: 'Who logs in, and what do they see?', showIf: { field: 'site_does', has: 'Customer logins or a members area' } },
        { id: 'connected_software', type: 'longtext', label: 'Which software does it connect to?', showIf: { field: 'site_does', has: 'Connects to other software, such as a CRM or accounting' } },
        { id: 'keep_addresses', type: 'longtext', label: 'Pages whose address must keep working', help: 'Pages people reach from Google, ads, QR codes, printed material or other websites. We redirect old addresses to the new pages either way.' },
        { id: 'images_owned', type: 'choice', label: 'Do you own the photos on your current site?', help: 'Stock photos are licensed to whoever bought them. If a past developer bought them, the licence may not move with the site.', options: ['Yes, they are ours', 'Some are stock photos', 'Not sure'] },
        { id: 'site_copy', type: 'note', text: 'Before we change anything, we take a full copy of your current site and keep it.' },
      ] as Field[]
    ).map((f) => (opts.required ? f : { ...f, showIf: [{ field: 'has_site', is: 'Yes' }, ...toList(f.showIf)] })),
  ],
});

/* ---------- The domain ---------- */
export const domain = (opts: { mustHave?: boolean } = {}): Step => ({
  id: 'domain',
  title: 'Your domain',
  intro: 'Your domain is your web address, such as yourbusiness.com.au. We need to know where it is registered and how to reach its settings, so we can point it at the new site without interrupting your email.',
  fields: [
    { id: 'has_domain', type: 'choice', label: 'Do you have a domain?', required: true, options: opts.mustHave ? ['Yes', 'Not sure'] : ['Yes', 'No, we need one', 'Not sure'] },
    ...(opts.mustHave
      ? []
      : ([
          { id: 'domain_wanted', type: 'text', label: 'The domain you would like', placeholder: 'yourbusiness.com.au', showIf: { field: 'has_domain', is: 'No, we need one' } },
          { id: 'domain_new_note', type: 'note', text: 'We check it is available and register it in your business name, against your ABN.', showIf: { field: 'has_domain', is: 'No, we need one' } },
        ] as Field[])),
    { id: 'domain_main', type: 'text', label: 'Your main domain', placeholder: 'yourbusiness.com.au', required: true, showIf: { field: 'has_domain', is: ['Yes', 'Not sure'] } },
    { id: 'domain_others', type: 'longtext', label: 'Any other domains you own', help: 'Other spellings, .com versions, old business names. One on each line.', rows: 3, showIf: { field: 'has_domain', is: ['Yes', 'Not sure'] } },
    { id: 'registrar', type: 'choice', label: 'Where is it registered?', help: 'The company you pay each year or two for the domain.', other: true, options: ['VentraIP', 'Crazy Domains', 'GoDaddy', 'Netregistry', 'Namecheap', 'Squarespace (formerly Google Domains)', 'Wix', 'Cloudflare', 'Our web host', 'I do not know'], showIf: { field: 'has_domain', is: ['Yes', 'Not sure'] } },
    { id: 'registrant', type: 'choice', label: 'Whose name is it registered in?', help: 'An .au domain is licensed to the business that holds the ABN. If it is in someone else\'s name, getting it back is the first job.', options: ['Our business', 'Me personally', 'A past developer or agency', 'Someone else', 'I do not know'], showIf: { field: 'has_domain', is: ['Yes', 'Not sure'] } },
    { id: 'registrar_login', type: 'choice', label: 'Who has the login to that account?', options: ['We do', 'Someone else does', 'Nobody knows'], showIf: { field: 'has_domain', is: ['Yes', 'Not sure'] } },
    { id: 'registrar_login_who', type: 'text', label: 'Who has it?', showIf: { field: 'registrar_login', is: 'Someone else does' } },
    { id: 'domain_renews', type: 'date', label: 'When does it next renew?', help: 'On the renewal invoice. Leave blank if you do not know.', showIf: { field: 'has_domain', is: ['Yes', 'Not sure'] } },
    { id: 'dns_where', type: 'choice', label: 'Where are its DNS settings managed?', help: 'If you are not sure, leave this: we can look it up from the domain.', other: true, options: ['The same company it is registered with', 'Our web host', 'Cloudflare', 'I do not know'], showIf: { field: 'has_domain', is: ['Yes', 'Not sure'] } },
    { id: 'dnssec', type: 'choice', label: 'Is DNSSEC turned on?', help: 'A security setting at the registrar. It has to be turned off before the domain moves to new nameservers, or the site and email can stop working. Most people do not know, which is fine.', options: ['Yes', 'No', 'I do not know'], showIf: { field: 'has_domain', is: ['Yes', 'Not sure'] } },
    { id: 'domain_how', type: 'choice', label: 'How would you like to give us control of the domain?', required: true, options: [
      'Add us as a user on the domain account (recommended)',
      'Change the nameservers to ones we send you',
      'Move the domain to an account in your name that we manage',
      'You make the changes yourselves when we send instructions',
      'Not sure: talk me through it',
    ], showIf: { field: 'has_domain', is: ['Yes', 'Not sure'] } },
    { id: 'access_domain', type: 'access', label: 'Add us to the domain account', required: true, showIf: { field: 'domain_how', is: 'Add us as a user on the domain account (recommended)' }, steps: [
      'Log in to the account your domain is registered with.',
      'Look for Users, Team, Account access, Delegate access or Contacts.',
      'Add {access} with permission to manage domains and DNS.',
      'If you cannot find it, choose "I cannot do this" and we arrange a short call.',
    ] },
    { id: 'ns_note', type: 'note', text: 'We email you two nameserver addresses. You replace the current ones at your registrar. The domain stays in your name and your account.', showIf: { field: 'domain_how', is: 'Change the nameservers to ones we send you' } },
    { id: 'transfer_note', type: 'note', tone: 'warn', text: 'We send you the steps. A transfer needs an authorisation code from your current registrar (also called an EPP code or domain password). Do not type it here: we ask for it by phone or a secure link.', showIf: { field: 'domain_how', is: 'Move the domain to an account in your name that we manage' } },
  ],
});

/* ---------- Email on the domain ---------- */
export const email = (): Step => ({
  id: 'mail',
  title: 'Email at your domain',
  intro: 'Moving a website can break the email at the same domain if it is done carelessly. These answers let us keep your email running through the change.',
  fields: [
    { id: 'uses_mail', type: 'choice', label: 'Do you use email addresses at your domain, such as you@yourbusiness.com.au?', options: ['Yes', 'No', 'Not sure'], required: true },
    { id: 'mail_provider', type: 'choice', label: 'Who provides it?', help: 'Where you log in to read it on the web.', other: true, required: true, options: ['Microsoft 365 (Outlook)', 'Google Workspace (Gmail)', 'Our web host (webmail or cPanel email)', 'Zoho Mail', 'The domain company forwards it on', 'I do not know'], showIf: { field: 'uses_mail', is: ['Yes', 'Not sure'] } },
    { id: 'mail_host_warning', type: 'note', tone: 'warn', text: 'Your email lives with your web host, so if that hosting ends, the mailboxes end with it. We plan where your email goes before anything changes, and nothing is cancelled until it has moved.', showIf: { field: 'mail_provider', is: 'Our web host (webmail or cPanel email)' } },
    { id: 'mailboxes', type: 'text', label: 'About how many addresses or mailboxes?', showIf: { field: 'uses_mail', is: ['Yes', 'Not sure'] } },
    { id: 'mail_admin', type: 'text', label: 'Who manages your email accounts?', help: 'A person, or the IT company you use.', showIf: { field: 'uses_mail', is: ['Yes', 'Not sure'] } },
    { id: 'mail_senders', type: 'multi', label: 'Which other systems send email as your domain?', help: 'Each one depends on records in your DNS. We copy them across so these emails keep arriving.', other: true, options: ['Xero', 'MYOB', 'QuickBooks', 'Mailchimp or another newsletter tool', 'A CRM, such as HubSpot or Salesforce', 'A booking system', 'Job software, such as ServiceM8, simPRO or Tradify', 'Our website forms', 'None', 'I do not know'] },
    { id: 'domain_extras', type: 'longtext', label: 'Anything else connected to your domain?', help: 'Addresses like shop.yourbusiness.com.au or book.yourbusiness.com.au, a phone system, a client portal, Microsoft Teams. If you are not sure, we find it in the DNS.' },
  ],
});

/* ---------- Google, analytics and listings ---------- */
export const google = (): Step => ({
  id: 'google',
  title: 'Google, analytics and listings',
  intro: 'So the new site keeps its search history, its measurements and its listings.',
  fields: [
    { id: 'google_tools', type: 'multi', label: 'Which of these do you have?', options: ['Google Analytics', 'Google Tag Manager', 'Google Search Console', 'Google Business Profile', 'Google Ads', 'Meta (Facebook) Pixel', 'Microsoft Clarity or Hotjar', 'None', 'I do not know'] },
    { id: 'access_google', type: 'access', label: 'Add us to your Google accounts', required: true, showIf: { field: 'google_tools', has: ['Google Analytics', 'Google Tag Manager', 'Google Search Console', 'Google Business Profile', 'Google Ads'] }, steps: [
      'Google Analytics: Admin, then Property access management. Add {access} as an Administrator.',
      'Google Tag Manager: Admin, then User Management. Add {access} with Publish permission.',
      'Google Search Console: Settings, then Users and permissions. Add {access} with Full permission.',
      'Google Business Profile: in your profile, Menu, then Business Profile settings, then People and access. Add {access} as a Manager.',
      'Google Ads: Admin, then Access and security. Add {access} with Standard access.',
    ] },
    { id: 'meta_access', type: 'text', label: 'Who manages your Meta (Facebook) business account?', showIf: { field: 'google_tools', has: 'Meta (Facebook) Pixel' } },
    { id: 'social', type: 'longtext', label: 'Your social media pages', help: 'One link on each line, so the new site can link to them.', rows: 3 },
    { id: 'reviews_where', type: 'text', label: 'Where do customers leave reviews?', help: 'Google, Facebook, an industry site.' },
  ],
});

/* ---------- Timing ---------- */
export const timing = (opts: { title?: string; dateLabel?: string } = {}): Step => ({
  id: 'timing',
  title: opts.title ?? 'Timing',
  fields: [
    { id: 'wanted_by', type: 'date', label: opts.dateLabel ?? 'When would you like this done?' },
    { id: 'wanted_why', type: 'text', label: 'Is there a reason for that date?', help: 'An event, a launch, a lease, a renewal.', wide: true },
    { id: 'away', type: 'longtext', label: 'Dates you or the person who signs off are away', rows: 3 },
    { id: 'anything_else', type: 'longtext', label: 'Anything else we should know?' },
  ],
});

/* ---------- Sample files ---------- */
export const samples = (id: string, label: string, help: string, maxFiles = 5): Field[] => [
  { id, type: 'file', label, help, accept: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.txt,.msg,.eml', maxFiles },
  { id: `${id}_note`, type: 'note', text: 'Blank or edited examples are fine. Please do not send bank account details, card numbers or anyone\'s tax file number.' },
];

function toList<T>(value: T | T[] | undefined): T[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}
