import { defineTemplate } from '../types';
import { you } from '../shared';

export default defineTemplate({
  id: 'audit',
  name: 'The Keystroke Audit',
  summary: 'A picture of your business, your systems and the work that frustrates you, so the audit starts in the right place.',
  time: 'About 10 minutes.',
  bring: ['A list of the software your business uses', 'The job you would most like looked at'],
  steps: [
    you(),
    {
      id: 'snapshot',
      title: 'Your business',
      fields: [
        { id: 'industry', type: 'choice', label: 'What kind of business?', required: true, other: true, options: ['Trades and construction', 'Professional services', 'Transport and logistics', 'Manufacturing', 'Property', 'Wholesale', 'Health', 'Retail', 'Hospitality'] },
        { id: 'staff', type: 'choice', label: 'How many people work in it?', required: true, options: ['1 to 4', '5 to 10', '11 to 25', '26 to 50', 'More than 50'] },
        { id: 'locations', type: 'text', label: 'Where are you based, and how many locations?', wide: true },
        { id: 'what_you_do', type: 'longtext', label: 'What does the business do, in a sentence or two?', required: true, rows: 3 },
      ],
    },
    {
      id: 'audit_systems',
      title: 'Systems and frustrations',
      fields: [
        { id: 'audit_systems_used', type: 'multi', label: 'Which systems do you use?', other: true, options: ['Microsoft 365', 'Google Workspace', 'Xero', 'MYOB', 'QuickBooks', 'ServiceM8', 'simPRO', 'Tradify', 'AroFlo', 'HubSpot', 'Salesforce', 'Excel or Google Sheets', 'Paper forms'] },
        { id: 'frustrations', type: 'longtext', label: 'What frustrates you most about how work gets done?', required: true },
        { id: 'retyping', type: 'longtext', label: 'Where do the same details get typed more than once?', rows: 3 },
        { id: 'focus_job', type: 'text', label: 'Which job would you most like us to look at?', required: true, help: 'One process: quoting, invoicing, month-end, timesheets.', wide: true },
        { id: 'focus_who', type: 'text', label: 'Who does that job?' },
        { id: 'focus_often', type: 'choice', label: 'How often does it happen?', options: ['Many times a day', 'Daily', 'Weekly', 'Monthly'] },
      ],
    },
    {
      id: 'booking',
      title: 'Booking the audit',
      fields: [
        { id: 'where_audit', type: 'choice', label: 'Where should it happen?', required: true, options: ['At our premises', 'By video call and screen share', 'Either'] },
        { id: 'audit_address', type: 'text', label: 'The address', wide: true, showIf: { field: 'where_audit', is: ['At our premises', 'Either'] } },
        { id: 'audit_days', type: 'multi', label: 'Which days suit?', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
        { id: 'audit_time', type: 'choice', label: 'What time of day?', options: ['Morning', 'Middle of the day', 'Afternoon', 'Any time'] },
        { id: 'audit_people', type: 'group', label: 'Who else should be there?', add: 'Add a person', item: 'Person', max: 5, fields: [
          { id: 'name', type: 'text', label: 'Name' },
          { id: 'role', type: 'text', label: 'Role' },
          { id: 'email', type: 'email', label: 'Email' },
        ] },
        { id: 'audit_notes', type: 'longtext', label: 'Anything else we should know?', rows: 3 },
      ],
    },
  ],
  next: [
    'We read your answers and contact you to confirm a time.',
    'On the day, the person who does the job does it once, the usual way, while we watch.',
  ],
});
