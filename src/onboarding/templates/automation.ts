import { defineTemplate } from '../types';
import { you, samples, timing } from '../shared';

export default defineTemplate({
  id: 'automation',
  name: 'Automation and AI agents',
  summary: 'How the work is done today, by whom and in which systems, so we can rebuild it to run itself.',
  time: 'About 20 minutes.',
  bring: [
    'A rough idea of how often the work happens and how long it takes',
    'A few examples of the documents or emails involved',
    'The name of whoever manages your Microsoft 365 or Google account',
  ],
  steps: [
    you(),
    {
      id: 'process',
      title: 'The work today',
      intro: 'Walk us through the job as it happens now, step by step. Plain words are best.',
      fields: [
        { id: 'process_name', type: 'text', label: 'What do you call this job?', required: true, help: 'For example, "turning job sheets into invoices".', wide: true },
        { id: 'process_trigger', type: 'longtext', label: 'What starts it?', help: 'An email arriving, a form, a phone call, the end of the month.', rows: 2, required: true },
        { id: 'process_steps', type: 'longtext', label: 'What happens, step by step?', required: true, rows: 8, help: 'Who does what, in which system, and where things get copied or retyped.' },
        { id: 'process_result', type: 'longtext', label: 'Where does the result end up?', rows: 2 },
        { id: 'process_often', type: 'choice', label: 'How often does it happen?', required: true, other: true, options: ['Many times a day', 'Daily', 'Weekly', 'Monthly'] },
        { id: 'process_volume', type: 'text', label: 'How many each time, or each week?', help: 'Invoices, emails, forms, jobs.' },
        { id: 'process_time', type: 'text', label: 'Roughly how long does it take?' },
        { id: 'process_exceptions', type: 'longtext', label: 'What goes differently from time to time?', help: 'Exceptions, special customers, things only one person knows.', rows: 3 },
      ],
    },
    {
      id: 'systems',
      title: 'Systems',
      fields: [
        { id: 'systems_used', type: 'multi', label: 'Which systems are involved?', required: true, other: true, options: ['Microsoft 365 (Outlook, Excel, SharePoint, Teams)', 'Google Workspace', 'Xero', 'MYOB', 'QuickBooks', 'ServiceM8', 'simPRO', 'Tradify', 'AroFlo', 'HubSpot', 'Salesforce', 'Monday.com, Asana or Trello', 'Paper forms', 'Spreadsheets'] },
        { id: 'systems_detail', type: 'longtext', label: 'Anything about those systems we should know?', help: 'Versions, add-ons, which ones talk to each other already.', rows: 3 },
        { id: 'm365_plan', type: 'choice', label: 'Which Microsoft 365 plan do you have?', options: ['Business Basic', 'Business Standard', 'Business Premium', 'An Enterprise plan', 'I do not know'], showIf: { field: 'systems_used', has: 'Microsoft 365 (Outlook, Excel, SharePoint, Teams)' } },
        { id: 'it_admin', type: 'text', label: 'Who administers your systems?', help: 'A person, or the IT company you use.', required: true, wide: true },
        { id: 'it_rules', type: 'longtext', label: 'Security or IT rules we should follow', help: 'Approval before new apps, where data may be stored, multi-factor sign-in.', rows: 3 },
        { id: 'access_systems', type: 'access', label: 'Give us access to the systems involved', required: true, steps: [
          'Where a system lets you add users or accountants, invite {access}. Most accounting and job software has this.',
          'For Microsoft 365 or Google Workspace, your administrator adds {access} as a guest, or creates an account for us. We tell them which permissions we need.',
          'Do not send passwords, API keys or codes here. Where a system needs one, we set it up with you on a short call.',
        ] },
        { id: 'data_kinds', type: 'multi', label: 'Which kinds of information pass through this work?', options: ['Customers\' personal details', 'Health information', 'Financial records', 'Card or bank details', 'Staff records', 'None of these'] },
      ],
    },
    {
      id: 'people',
      title: 'People and problems',
      fields: [
        { id: 'people_involved', type: 'group', label: 'Who is involved?', add: 'Add a person', item: 'Person', max: 8, fields: [
          { id: 'name', type: 'text', label: 'Name' },
          { id: 'role', type: 'text', label: 'Role' },
          { id: 'email', type: 'email', label: 'Email' },
          { id: 'part', type: 'text', label: 'Their part in the job' },
        ] },
        { id: 'pain', type: 'longtext', label: 'What goes wrong, or takes too long?', required: true },
        { id: 'mistakes', type: 'longtext', label: 'What happens when a mistake gets through?', rows: 3 },
        { id: 'tried', type: 'longtext', label: 'What have you tried already?', rows: 3 },
        ...samples('process_samples', 'Examples of the documents, forms or emails involved', 'Up to 5 files.'),
        { id: 'samples_link', type: 'url', label: 'Or a link to a shared folder', help: 'OneDrive, Google Drive or Dropbox. Use this for larger files.', wide: true },
      ],
    },
    {
      id: 'success',
      title: 'What success looks like',
      fields: [
        { id: 'success', type: 'longtext', label: 'How will you know this worked?', required: true, help: 'Fewer hours, no retyping, faster invoices, fewer errors.' },
        { id: 'must_not_change', type: 'longtext', label: 'Anything that must not change?', help: 'Steps a person must still approve, documents customers expect to see.', rows: 3 },
      ],
    },
    timing({ dateLabel: 'When would you like it running?' }),
  ],
  next: [
    'We read your answers and contact you about anything missing.',
    'We arrange a time to watch the job being done, in person or on a screen share.',
    'We send you a plan and a quote for the build.',
  ],
});
