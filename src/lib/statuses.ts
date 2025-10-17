export type StatusData = {
  name: string;
};

export const statuses: StatusData[] = [
  { name: 'Open' },
  { name: 'In Progress' },
  { name: 'Mitigated' },
  { name: 'Closed' },
  { name: 'Awaiting Response' },
];
