import { TimeGrid } from '../types/calendar';

// School Schedule Time Grid (8:00 AM - 3:30 PM)
export const schoolTimeGrid: TimeGrid = {
  id: 'school-schedule',
  name: 'School Schedule',
  periods: [
    {
      id: 'period-1',
      name: 'Period 1',
      startTime: '08:00',
      endTime: '08:50',
      color: '#3b82f6',
    },
    {
      id: 'break-1',
      name: 'Break',
      startTime: '08:50',
      endTime: '09:00',
      color: '#f3f4f6',
      isBreak: true,
    },
    {
      id: 'period-2',
      name: 'Period 2',
      startTime: '09:00',
      endTime: '09:50',
      color: '#10b981',
    },
    {
      id: 'break-2',
      name: 'Break',
      startTime: '09:50',
      endTime: '10:00',
      color: '#f3f4f6',
      isBreak: true,
    },
    {
      id: 'period-3',
      name: 'Period 3',
      startTime: '10:00',
      endTime: '10:50',
      color: '#f59e0b',
    },
    {
      id: 'break-3',
      name: 'Break',
      startTime: '10:50',
      endTime: '11:00',
      color: '#f3f4f6',
      isBreak: true,
    },
    {
      id: 'period-4',
      name: 'Period 4',
      startTime: '11:00',
      endTime: '11:50',
      color: '#8b5cf6',
    },
    {
      id: 'lunch',
      name: 'Lunch',
      startTime: '11:50',
      endTime: '12:30',
      color: '#ef4444',
      isBreak: true,
    },
    {
      id: 'period-5',
      name: 'Period 5',
      startTime: '12:30',
      endTime: '13:20',
      color: '#06b6d4',
    },
    {
      id: 'break-4',
      name: 'Break',
      startTime: '13:20',
      endTime: '13:30',
      color: '#f3f4f6',
      isBreak: true,
    },
    {
      id: 'period-6',
      name: 'Period 6',
      startTime: '13:30',
      endTime: '14:20',
      color: '#84cc16',
    },
    {
      id: 'break-5',
      name: 'Break',
      startTime: '14:20',
      endTime: '14:30',
      color: '#f3f4f6',
      isBreak: true,
    },
    {
      id: 'period-7',
      name: 'Period 7',
      startTime: '14:30',
      endTime: '15:20',
      color: '#f97316',
    },
    {
      id: 'break-6',
      name: 'Break',
      startTime: '15:20',
      endTime: '15:30',
      color: '#f3f4f6',
      isBreak: true,
    },
  ],
};

// Standard Business Hours Time Grid (9:00 AM - 5:00 PM)
export const businessTimeGrid: TimeGrid = {
  id: 'business-hours',
  name: 'Business Hours',
  periods: [
    {
      id: 'hour-9',
      name: '9:00 AM',
      startTime: '09:00',
      endTime: '10:00',
      color: '#3b82f6',
    },
    {
      id: 'hour-10',
      name: '10:00 AM',
      startTime: '10:00',
      endTime: '11:00',
      color: '#10b981',
    },
    {
      id: 'hour-11',
      name: '11:00 AM',
      startTime: '11:00',
      endTime: '12:00',
      color: '#f59e0b',
    },
    {
      id: 'lunch',
      name: 'Lunch',
      startTime: '12:00',
      endTime: '13:00',
      color: '#ef4444',
      isBreak: true,
    },
    {
      id: 'hour-13',
      name: '1:00 PM',
      startTime: '13:00',
      endTime: '14:00',
      color: '#8b5cf6',
    },
    {
      id: 'hour-14',
      name: '2:00 PM',
      startTime: '14:00',
      endTime: '15:00',
      color: '#06b6d4',
    },
    {
      id: 'hour-15',
      name: '3:00 PM',
      startTime: '15:00',
      endTime: '16:00',
      color: '#84cc16',
    },
    {
      id: 'hour-16',
      name: '4:00 PM',
      startTime: '16:00',
      endTime: '17:00',
      color: '#f97316',
    },
  ],
};

// Default time grids
export const defaultTimeGrids: TimeGrid[] = [
  schoolTimeGrid,
  businessTimeGrid,
];

export const getDefaultTimeGrid = (): TimeGrid => schoolTimeGrid;

