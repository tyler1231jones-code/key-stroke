import { defineTemplate } from '../types';
import { you, currentSite, domain, email, google } from '../shared';

const NOT_OURS = { field: 'built_by_us', is: ['No', 'Not sure'] };

export default defineTemplate({
  id: 'website-care',
  name: 'Website care',
  summary: 'What we need to look after your website: where it lives, how to reach it, and who asks us for changes.',
  time: 'About 15 minutes for a site we built, 25 for one we did not.',
  bring: [
    'The login to the account your domain is registered with',
    'The login to your website and hosting',
    'The names of the people who will ask us for changes',
  ],
  steps: [
    you(),
    {
      id: 'plan',
      title: 'Your care plan',
      fields: [
        { id: 'care_plan', type: 'choice', label: 'Which plan did you choose?', required: true, options: ['Hosting and maintenance', 'Plus 2 hours', 'Plus 10 hours', 'Not decided yet'] },
        { id: 'built_by_us', type: 'choice', label: 'Did KEYSTROKE build the site?', required: true, options: ['Yes', 'No', 'Not sure'] },
        { id: 'care_site_url', type: 'url', label: 'Its address', placeholder: 'https://', required: true, showIf: { field: 'built_by_us', is: 'Yes' } },
        { id: 'care_scope', type: 'note', text: 'Care plans cover sites we built. For a site someone else built, we look it over first and tell you what it needs before the plan starts.', showIf: NOT_OURS },
      ],
    },
    { ...currentSite({ required: true }), showIf: NOT_OURS },
    { ...domain({ mustHave: true }), showIf: NOT_OURS },
    { ...email(), showIf: NOT_OURS },
    { ...google(), showIf: NOT_OURS },
    {
      id: 'changes',
      title: 'Asking for changes',
      intro: 'Who can ask us for work on the site, and how.',
      fields: [
        { id: 'requesters', type: 'group', label: 'People who can ask us for changes', add: 'Add a person', item: 'Person', max: 6, required: true, fields: [
          { id: 'name', type: 'text', label: 'Name' },
          { id: 'email', type: 'email', label: 'Email' },
          { id: 'phone', type: 'tel', label: 'Phone' },
        ] },
        { id: 'request_how', type: 'choice', label: 'How will you send requests?', options: ['Email', 'Phone', 'Either'], required: true },
        { id: 'approve_spend', type: 'text', label: 'Who approves work beyond the plan\'s hours?', wide: true },
        { id: 'urgent_means', type: 'longtext', label: 'What counts as urgent for your business?', help: 'For example, the shop is down, or the booking form stops working.', rows: 3 },
        { id: 'down_contact', type: 'text', label: 'Who should we call if the site goes down?', wide: true },
        { id: 'update_window', type: 'choice', label: 'When should updates happen?', options: ['Any time', 'Outside business hours', 'Weekends only'] },
        { id: 'care_start', type: 'date', label: 'When should the plan start?' },
        { id: 'care_notes', type: 'longtext', label: 'Anything else we should know?' },
      ],
    },
  ],
  next: [
    'We read your answers and contact you about anything missing.',
    'For a site we did not build, we check the access you have given us and take a full copy of the site before we touch it.',
    'We confirm the start date and how to reach us.',
  ],
});
