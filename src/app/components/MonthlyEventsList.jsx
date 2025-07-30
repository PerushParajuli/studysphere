"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const MonthlyEventsList = ({ events, onEventClick }) => {
  if (events.length === 0) {
    return (
      <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            This Month's Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">No events scheduled for this month.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          This Month's Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {events.map((event) => (
            <li 
              key={event.id}
              onClick={() => onEventClick(event)}
              className="p-4 rounded-lg cursor-pointer transition-colors duration-200 bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 border border-gray-200 dark:border-gray-600"
            >
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{event.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(event.start).toLocaleDateString()}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{event.description}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default MonthlyEventsList;
