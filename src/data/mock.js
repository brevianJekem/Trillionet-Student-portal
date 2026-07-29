export const student = {
  name: 'Faith Mwangi',
  initials: 'FM',
  regNo: 'TCT/2024/0142',
  feeBalance: 8500,
  attendance: 92,
  onTimeSubmissionRate: 85,
  notificationsCount: 3,
};

// Every package/course the center offers. New packages just get added here.
export const packages = [
  { id: 'coreldraw', name: 'CorelDraw Essentials', category: 'Graphic Design', instructor: 'Ms. Wanjiru', totalLessons: 20, completedLessons: 14, nextClass: 'Wed · 10:00', color: 'var(--navy)' },
  { id: 'photoshop', name: 'Adobe Photoshop', category: 'Graphic Design', instructor: 'Mr. Otieno', totalLessons: 24, completedLessons: 9, nextClass: 'Mon · 08:00', color: 'var(--blue)' },
  { id: 'illustrator', name: 'Adobe Illustrator', category: 'Graphic Design', instructor: 'Ms. Chebet', totalLessons: 18, completedLessons: 0, nextClass: null, color: 'var(--ice)' },
  { id: 'indesign', name: 'Adobe InDesign', category: 'Publishing', instructor: 'Mr. Kiplagat', totalLessons: 16, completedLessons: 0, nextClass: null, color: 'var(--amber)' },
  { id: 'webdev', name: 'Website Development', category: 'Programming', instructor: 'Dr. Barasa', totalLessons: 30, completedLessons: 22, nextClass: 'Thu · 14:00', color: 'var(--green)' },
  { id: 'appdev', name: 'App Development', category: 'Programming', instructor: 'Mr. Simiyu', totalLessons: 28, completedLessons: 0, nextClass: null, color: 'var(--red)' },
  { id: 'database', name: 'Database Management', category: 'Programming', instructor: 'Ms. Wanjiru', totalLessons: 20, completedLessons: 5, nextClass: 'Fri · 11:00', color: 'var(--blue-light)' },
];

export const enrolledPackageIds = ['coreldraw', 'photoshop', 'webdev', 'database'];

export const materials = {
  coreldraw: [
    { name: 'Vector basics — shapes and paths', type: 'pdf' },
    { name: 'Working with the Bezier tool', type: 'video' },
  ],
  photoshop: [
    { name: 'Layers and masking', type: 'pdf' },
    { name: 'Retouching workflow demo', type: 'video' },
  ],
  webdev: [
    { name: 'HTML & CSS foundations', type: 'pdf' },
    { name: 'Responsive layout walkthrough', type: 'video' },
    { name: 'Week 6 practical brief', type: 'pdf' },
  ],
  database: [
    { name: 'Introduction to ER modeling', type: 'pdf' },
  ],
};

export const announcements = [
  { title: 'CorelDraw practical assessment moved', body: 'Now holding on Thursday at 10am instead of Wednesday.', date: '2 days ago' },
  { title: 'New intake for App Development opens', body: 'Registration opens next Monday — limited seats.', date: '4 days ago' },
  { title: 'Lab 2 closed for maintenance', body: 'Photoshop and InDesign classes moved to Lab 1 this week.', date: '1 week ago' },
];

export const assignments = [
  { package: 'Website Development', title: 'Build a responsive portfolio page', due: 'Fri, 31 Jul', status: 'pending', grade: null },
  { package: 'CorelDraw Essentials', title: 'Vector logo design brief', due: 'Mon, 3 Aug', status: 'pending', grade: null },
  { package: 'Database Management', title: 'ER diagram — bookstore system', due: 'Submitted', status: 'graded', grade: '88%' },
  { package: 'Photoshop', title: 'Photo manipulation exercise', due: 'Submitted', status: 'graded', grade: '76%' },
];

export const feeHistory = [
  { date: '2 Jul 2026', ref: 'MPESA-QK7X2Y1', desc: 'Website Development — part payment', amount: 8000, status: 'paid' },
  { date: '10 May 2026', ref: 'MPESA-QA4T9L3', desc: 'CorelDraw Essentials — full payment', amount: 6000, status: 'paid' },
  { date: '3 Feb 2026', ref: 'BANK-88213', desc: 'Registration fee', amount: 1500, status: 'paid' },
];

export const conversations = [
  { id: 1, with: 'Dr. Barasa', role: 'Website Development instructor', lastMessage: 'Sure, bring your laptop with Node installed for the next class.', time: '10:42 AM', unread: true },
  { id: 2, with: 'Ms. Wanjiru', role: 'CorelDraw / Database instructor', lastMessage: 'Great work on the vector brief — small note on stroke widths.', time: 'Yesterday', unread: false },
  { id: 3, with: 'Front Office', role: 'Administration', lastMessage: 'Your receipt for the last payment has been generated.', time: 'Mon', unread: false },
];

export const complaints = [
  { id: 1, subject: 'Projector not working in Lab 2', category: 'Facilities', status: 'in-progress', date: '3 days ago' },
  { id: 2, subject: 'Requesting a makeup class for missed session', category: 'Academic', status: 'resolved', date: '1 week ago' },
];
