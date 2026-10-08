import { defineTemplate } from '../types';
import { you, timing } from '../shared';

export default defineTemplate({
  id: 'branding',
  name: 'Branding and design',
  summary: 'Your business, your customers and what you need designed, so the brand fits the business you have become.',
  time: 'About 25 minutes.',
  bring: [
    'Your current logo and anything printed with it',
    'A few brands you admire, in any industry',
    'A list of what needs designing: cards, signs, vehicles, documents',
  ],
  steps: [
    you(),
    {
      id: 'story',
      title: 'Your business',
      fields: [
        { id: 'story', type: 'longtext', label: 'How did the business start, and what does it do today?', required: true },
        { id: 'difference', type: 'longtext', label: 'What do customers get from you that they do not get elsewhere?', required: true, rows: 3 },
        { id: 'values', type: 'longtext', label: 'What does the business stand for?', help: 'How you work, what you will not do.', rows: 3 },
        { id: 'next_years', type: 'longtext', label: 'Where is the business heading in the next few years?', rows: 3 },
        { id: 'brand_customers', type: 'longtext', label: 'Who are your customers, and how do they find you?', required: true, rows: 3 },
        { id: 'brand_competitors', type: 'group', label: 'Competitors', add: 'Add a competitor', item: 'Competitor', max: 6, fields: [
          { id: 'name', type: 'text', label: 'Name' },
          { id: 'url', type: 'url', label: 'Website', placeholder: 'https://' },
          { id: 'view', type: 'text', label: 'What you think of their brand' },
        ] },
      ],
    },
    {
      id: 'taste',
      title: 'Look and feel',
      fields: [
        { id: 'words', type: 'multi', label: 'Pick up to three words the brand should feel like', options: ['Plain-spoken', 'Technical', 'Friendly', 'Premium', 'Traditional', 'Modern', 'Bold', 'Calm', 'Local', 'Precise', 'Warm', 'Serious'] },
        { id: 'admired', type: 'group', label: 'Brands you admire', help: 'Any industry. Tell us what you like.', add: 'Add a brand', item: 'Brand', max: 5, fields: [
          { id: 'name', type: 'text', label: 'Name or website' },
          { id: 'why', type: 'text', label: 'What you like' },
        ] },
        { id: 'dislikes', type: 'longtext', label: 'Anything you do not want', help: 'Colours, styles, things competitors do.', rows: 3 },
      ],
    },
    {
      id: 'existing',
      title: 'What you have now',
      fields: [
        { id: 'keep', type: 'multi', label: 'What should stay?', options: ['The business name', 'The logo, tidied up', 'Parts of the logo', 'The colours', 'The fonts', 'Nothing: start fresh'] },
        { id: 'existing_files', type: 'file', label: 'Your current logo and brand material', help: 'Logo files, and photos of signs, vehicles, uniforms or printed pieces. Up to 6 files.', accept: '.svg,.ai,.eps,.pdf,.png,.jpg,.jpeg', maxFiles: 6 },
        { id: 'existing_link', type: 'url', label: 'Or a link to a shared folder', help: 'OneDrive, Google Drive or Dropbox.', wide: true },
        { id: 'trademark', type: 'choice', label: 'Is your name or logo a registered trade mark?', options: ['Yes, registered', 'Applied for', 'No', 'I do not know'] },
        { id: 'trademark_note', type: 'note', text: 'Before a new name or logo is used widely, it is worth searching IP Australia for similar trade marks. We can point you to it.', showIf: { field: 'trademark', is: ['No', 'I do not know'] } },
      ],
    },
    {
      id: 'deliverables',
      title: 'What you need designed',
      fields: [
        { id: 'needs', type: 'multi', label: 'Tick everything you need', required: true, other: true, options: ['Logo', 'Colours and fonts', 'Brand guidelines', 'Business cards', 'Letterhead and documents', 'Email signature', 'Social media templates', 'Presentation template', 'Signage or shopfront', 'Vehicle signage', 'Uniforms', 'Brochures or flyers', 'Capability statement', 'Tender templates', 'Website'] },
        { id: 'needs_detail', type: 'longtext', label: 'Quantities and details', help: 'How many vehicles, sign sizes, how many people need cards.', rows: 4 },
        { id: 'premises', type: 'longtext', label: 'Where the brand will appear in person', help: 'Shopfront, office, site signs, vehicles, uniforms.', rows: 3, showIf: { field: 'needs', has: ['Signage or shopfront', 'Vehicle signage', 'Uniforms'] } },
        { id: 'suppliers', type: 'longtext', label: 'Printers or sign writers you already use', rows: 2 },
      ],
    },
    timing({ dateLabel: 'When do you need the brand ready?' }),
  ],
  next: [
    'We read your answers and contact you about anything missing.',
    'We arrange a conversation about your business before any drawing starts.',
    'We send you a plan with what you will see and when.',
  ],
});
