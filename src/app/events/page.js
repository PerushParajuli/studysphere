"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useToast } from "../components/ui/toast";
import MonthlyEventsList from "../components/MonthlyEventsList";
import "./calendar.css";

const EventDetailSidebar = ({ event, onSave, onDelete, onTitleChange, onDescChange, isNew, onClose }) => {
  if (!event) return null;

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {isNew ? "Create New Event" : "Event Details"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Event Title
          </label>
          <Input
            type="text"
            placeholder="Enter event title"
            value={event.title || ''}
            onChange={onTitleChange}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            placeholder="Add event description (optional)"
            value={event.description || ''}
            onChange={onDescChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        </div>
        
        {!isNew && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Date:</span> {new Date(event.start).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 pt-4">
          {!isNew && (
            <Button 
              variant="destructive" 
              onClick={() => onDelete(event)}
              className="flex-1 sm:flex-none min-w-0"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => onSave(event)}
            className="flex-1 sm:flex-none bg-primary-600 hover:bg-primary-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {isNew ? "Create Event" : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function EventsPage() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isNewEvent, setIsNewEvent] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Filter events for current month
  const currentMonthEvents = events.filter(event => {
    const eventDate = new Date(event.start);
    const currentDate = new Date();
    return eventDate.getMonth() === currentDate.getMonth() && 
           eventDate.getFullYear() === currentDate.getFullYear();
  });

  useEffect(() => {
    const fetchUserAndEvents = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", user.id)
        .single();

      setUser({ ...user, ...profile });

      const { data: eventData, error } = await supabase.from("events").select("id, title, description, date, created_by");
      
      if (error) {
        toast.error(`Could not fetch events: ${error.message}`);
      } else {
        const mappedEvents = eventData.map(e => ({ 
          id: e.id, 
          title: e.title, 
          description: e.description, 
          start: e.date, 
          allDay: true,
          extendedProps: {
            description: e.description,
            created_by: e.created_by
          }
        }));
        setEvents(mappedEvents);
      }
      setLoading(false);
    };
    fetchUserAndEvents();
  }, [router, toast]);

  const handleDateClick = (arg) => {
    if (user?.role !== 'admin' && user?.role !== 'teacher') {
      toast.info("Only admins and teachers can create events.");
      return;
    }
    setSelectedEvent({ start: arg.dateStr, title: '', description: '' });
    setIsNewEvent(true);
  };

  const handleEventClick = (arg) => {
    setSelectedEvent(arg.event);
    setIsNewEvent(false);
  };

  const handleSidebarClose = () => {
    setSelectedEvent(null);
    setIsNewEvent(false);
  };

  const handleSaveEvent = async (event) => {
    if (!event.title) {
      toast.error("Event title is required");
      return;
    }

    if (isNewEvent) {
      const { data, error } = await supabase
        .from("events")
        .insert([{ title: event.title, description: event.description, date: event.start, created_by: user.id }])
        .select();

      if (error) {
        toast.error(error.message);
      } else {
        const newEvent = {
          id: data[0].id,
          title: data[0].title,
          description: data[0].description,
          start: data[0].date,
          allDay: true,
          extendedProps: {
            description: data[0].description,
            created_by: data[0].created_by
          }
        };
        setEvents([...events, newEvent]);
        toast.success("Event created!");
        handleSidebarClose();
      }
    } else {
      const { error } = await supabase
        .from("events")
        .update({ title: event.title, description: event.description })
        .eq("id", event.id);

      if (error) {
        toast.error(error.message);
      } else {
        // Update local events state after saving
        const updatedEvents = events.map(evt => 
          evt.id === selectedEvent.id ? { ...evt, title: event.title, description: event.description } : evt
        );
        setEvents(updatedEvents);

        const calendarApi = selectedEvent.view.calendar;
        const evt = calendarApi.getEventById(selectedEvent.id);
        evt.setProp('title', event.title);
        evt.setExtendedProp('description', event.description);

        toast.success("Event updated!");
        handleSidebarClose();
      }
    }
  };

  const handleDeleteEvent = async (event) => {
    const { error } = await supabase.from("events").delete().eq("id", event.id);

    if (error) {
      toast.error(error.message);
    } else {
      // Update local events state
      const updatedEvents = events.filter(evt => evt.id !== event.id);
      setEvents(updatedEvents);

      // Remove from calendar if it has the remove method
      if (event.remove) {
        event.remove();
      }
      
      toast.success("Event deleted!");
      handleSidebarClose();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <DashboardLayout user={user} isAdmin={user?.role === 'admin'}>
      <div className="grid grid-cols-10 gap-8">
        <div className={`col-span-10 ${selectedEvent ? 'lg:col-span-7' : 'lg:col-span-10'} transition-all duration-300`}>
          <Card>
            <CardHeader>
              <CardTitle>Events Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={events}
                editable={user?.role === 'admin' || user?.role === 'teacher'}
                selectable={true}
                select={handleDateClick}
                eventClick={handleEventClick}
                height="auto"
                dayMaxEventRows={true}
                views={{
                  dayGridMonth: { dayMaxEventRows: 4 }
                }}
              />
            </CardContent>
          </Card>
        </div>
        {selectedEvent && (
          <div className="col-span-10 lg:col-span-3 transition-all duration-300">
            <EventDetailSidebar
              event={selectedEvent}
              onSave={handleSaveEvent}
              onDelete={handleDeleteEvent}
              isNew={isNewEvent}
              onClose={handleSidebarClose}
              onTitleChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
              onDescChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
            />
          </div>
        )}
        <div className="col-span-10">
          <MonthlyEventsList 
            events={currentMonthEvents} 
              onEventClick={(event) => {
                // When clicking on the list, find the corresponding event object from the main `events` state
                const calendarEvent = events.find(e => e.id === event.id)
                setSelectedEvent(calendarEvent)
                setIsNewEvent(false)
              }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
