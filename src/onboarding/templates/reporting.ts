import { defineTemplate } from '../types';
import { you, samples, timing } from '../shared';

export default defineTemplate({
  id: 'reporting',
  name: 'Reporting and dashboards',
  summary: 'Who reads your reports, what they need to see, and where the figures come from.',
  time: 'About 20 minutes.',
  bring: [
    'A copy of the reports you use now',
    'The list of figures you watch most closely',
    'The name of whoever manages your accounting and job systems',
  ],
  steps: [
    you(),
    {
      id: 'readers',
      title: 'Who it is for',
      fields: [
        { id: 'report_purpose', type: 'longtext', label: 'What decisions should the report help you make?', required: true },
        { id: 'report_readers', type: 'group', label: 'Who reads it?', add: 'Add a reader', item: 'Reader', max: 8, required: true, fields: [
          { id: 'role', type: 'text', label: 'Role or name' },
          { id: 'needs', type: 'text', label: 'What they need from it' },
        ] },
        { id: 'report_often', type: 'choice', label: 'How often should it update?', required: true, other: true, options: ['Live, or several times a day', 'Daily', 'Weekly', 'Monthly'] },
        { id: 'report_where', type: 'multi', label: 'How should people see it?', other: true, options: ['A Power BI dashboard', 'An Excel workbook', 'A PDF by email', 'In Microsoft Teams', 'On a screen in the office', 'Printed'] },
        { id: 'report_private', type: 'longtext', label: 'Who must not see what?', help: 'For example, managers see their own branch only, or wages stay with the owners.', rows: 3 },
      ],
    },
    {
      id: 'figures',
      title: 'The figures',
      fields: [
        { id: 'kpis', type: 'group', label: 'The figures that matter most', add: 'Add a figure', item: 'Figure', max: 12, required: true, fields: [
          { id: 'name', type: 'text', label: 'Name', help: 'Such as "gross margin by job".' },
          { id: 'meaning', type: 'text', label: 'How you work it out now' },
          { id: 'target', type: 'text', label: 'Target, if you have one' },
        ] },
        ...samples('report_samples', 'Reports you use now', 'Up to 5 files. Blank or edited copies are fine.'),
        { id: 'report_link', type: 'url', label: 'Or a link to a shared folder', help: 'OneDrive, Google Drive or Dropbox.', wide: true },
      ],
    },
    {
      id: 'sources',
      title: 'Where the data lives',
      fields: [
        { id: 'data_sources', type: 'multi', label: 'Where do the figures come from?', required: true, other: true, options: ['Xero', 'MYOB', 'QuickBooks', 'simPRO', 'ServiceM8', 'Tradify', 'AroFlo', 'A CRM, such as HubSpot or Salesforce', 'Timesheet software', 'Excel or Google Sheets', 'SharePoint lists', 'A database our developer built'] },
        { id: 'data_detail', type: 'longtext', label: 'Anything about those sources we should know?', help: 'Which files or systems hold the truth, and which figures are typed in by hand.', rows: 4 },
        { id: 'licences', type: 'choice', label: 'Do you have Power BI?', options: ['Yes, Power BI Pro or Premium', 'We have Microsoft 365 but not Power BI', 'No Microsoft 365', 'I do not know'] },
        { id: 'data_admin', type: 'text', label: 'Who administers these systems?', help: 'A person, or the IT company you use.', required: true, wide: true },
        { id: 'access_data', type: 'access', label: 'Give us access to the data', required: true, steps: [
          'Where a system lets you add users, accountants or advisers, invite {access} with read access to the data the report needs.',
          'For Microsoft 365, your administrator adds {access} as a guest and shares the files or SharePoint sites involved.',
          'Do not send passwords, API keys or connection details here. Where a system needs one, we set it up with you on a short call.',
        ] },
      ],
    },
    timing({ dateLabel: 'When would you like the first report?' }),
  ],
  next: [
    'We read your answers and contact you about anything missing.',
    'We check we can reach each data source, and agree how every figure is worked out.',
    'We send you a plan and a quote for the build.',
  ],
});
