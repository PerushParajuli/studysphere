"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import DashboardLayout from "../components/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useToast } from "../components/ui/toast";
import MonthlyEventsList from "../components/MonthlyEventsList";
import "./calendar.css";

const EventDetailSidebar = ({
  event,
  onSave,
  onDelete,
  onTitleChange,
  onDescChange,
  onTimeChange,
  onColorChange,
  isNew,
  onClose,
}) => {
  if (!event) return null;

  const timeOptions = [
    "All Day",
    ...Array.from({ length: 24 }, (_, i) => {
      const hour = i % 12 === 0 ? 12 : i % 12;
      const ampm = i < 12 ? "AM" : "PM";
      return `${hour}:00 ${ampm}`;
    }),
  ];

  const colorOptions = [
    { name: "Red", value: "#ef4444" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#22c55e" },
    { name: "Black", value: "#000000" },
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <svg
            className="w-5 h-5 text-primary-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
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
            value={event.title || ""}
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
            value={event.description || ""}
            onChange={onDescChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time
          </label>
          <select
            value={event.extendedProps?.start_time || "All Day"}
            onChange={onTimeChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <select
            value={event.backgroundColor}
            onChange={onColorChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {colorOptions.map((color) => (
              <option key={color.value} value={color.value}>
                {color.name}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Date:</span>{" "}
            {new Date(event.start || event.clickedDate).toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            )}
            {isNew && (
              <span className="ml-2 text-primary-600 text-xs">
                (Selected from calendar)
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-4">
          {!isNew && (
            <Button
              variant="destructive"
              onClick={() => onDelete(event)}
              className="flex-1 sm:flex-none min-w-0"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
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
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
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

  // Filter events for current month (only valid dates)
  const currentMonthEvents = events.filter((event) => {
    // Skip events without valid dates
    if (!event.start) {
      console.warn("Event without start date:", event);
      return false;
    }

    const eventDate = new Date(event.start);
    // Check if date is valid
    if (isNaN(eventDate.getTime())) {
      console.warn("Event with invalid date:", event);
      return false;
    }

    const currentDate = new Date();
    return (
      eventDate.getMonth() === currentDate.getMonth() &&
      eventDate.getFullYear() === currentDate.getFullYear()
    );
  });

  // Debug logging
  console.log("Current events state:", events);
  console.log("Current month events:", currentMonthEvents);
  console.log("Selected event:", selectedEvent);
  console.log("Is new event:", isNewEvent);

  useEffect(() => {
    const fetchUserAndEvents = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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

      const { data: eventData, error } = await supabase
        .from("events")
        .select("id, title, description, date, created_by, start_time, color");

      console.log("Supabase query result:", { eventData, error }); // Debug

      if (error) {
        console.error("Error fetching events:", error); // Debug
        toast.error(`Could not fetch events: ${error.message}`);
      } else {
        console.log("Raw events from database:", eventData); // Debug

        // Filter out events with null dates and map them
        const validEvents = eventData.filter((e) => e.date !== null);
        console.log("Events with valid dates:", validEvents); // Debug

        const mappedEvents = validEvents.map((e) => ({
          id: String(e.id), // Ensure ID is string for FullCalendar
          title: e.title,
          description: e.description || "",
          start: e.date,
          allDay: !e.start_time,
          backgroundColor: e.color || "#3b82f6",
          borderColor: e.color || "#2563eb",
          textColor: "#ffffff",
          extendedProps: {
            description: e.description || "",
            created_by: e.created_by,
            originalId: e.id, // Keep original ID for database operations
            start_time: e.start_time,
          },
        }));
        console.log("Mapped events for FullCalendar:", mappedEvents); // Debug
        console.log(
          "Total events in database:",
          eventData.length,
          "Valid events:",
          mappedEvents.length
        ); // Debug
        setEvents(mappedEvents);
      }
      setLoading(false);
    };
    fetchUserAndEvents();
  }, [router, toast]);

  const handleDateSelect = (selectInfo) => {
    if (user?.role !== "admin" && user?.role !== "teacher") {
      toast.info("Only admins and teachers can create events.");
      return;
    }
    console.log("Date selected:", selectInfo.startStr); // Debug
    // Create new event object with the selected date
    const newEventData = {
      start: selectInfo.startStr, // This is the date that was selected
      title: "",
      description: "",
      allDay: true,
      clickedDate: selectInfo.startStr, // Store original clicked date
      backgroundColor: "#3b82f6",
      extendedProps: {
        start_time: "All Day",
      },
    };
    console.log("New event data:", newEventData); // Debug
    setSelectedEvent(newEventData);
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
    console.log("handleSaveEvent called with:", event); // Debug
    console.log("isNewEvent:", isNewEvent); // Debug

    if (!event.title) {
      toast.error("Event title is required");
      return;
    }

    // For new events, use the clicked date; for existing events, use the current start date
    const eventDate = isNewEvent
      ? event.start || event.clickedDate
      : event.start;
    console.log("Event start:", event.start); // Debug
    console.log("Event clickedDate:", event.clickedDate); // Debug
    console.log("Computed eventDate:", eventDate); // Debug

    if (!eventDate) {
      console.error("No event date found!", {
        eventStart: event.start,
        clickedDate: event.clickedDate,
        isNewEvent,
      }); // Debug
      toast.error("Event date is required");
      return;
    }

    console.log("Saving event with date:", eventDate, "isNew:", isNewEvent); // Debug

    const eventToSave = {
      title: event.title,
      description: event.description,
      date: eventDate,
      start_time:
        event.extendedProps.start_time === "All Day"
          ? null
          : event.extendedProps.start_time,
      color: event.backgroundColor,
    };

    if (isNewEvent) {
      const { data, error } = await supabase
        .from("events")
        .insert([{ ...eventToSave, created_by: user.id }])
        .select();

      if (error) {
        toast.error(error.message);
      } else {
        console.log("Event created successfully, data:", data[0]); // Debug
        const newEvent = {
          id: String(data[0].id), // Ensure ID is string for FullCalendar
          title: data[0].title,
          description: data[0].description || "",
          start: data[0].date,
          allDay: !data[0].start_time,
          backgroundColor: data[0].color || "#3b82f6",
          borderColor: data[0].color || "#2563eb",
          textColor: "#ffffff",
          extendedProps: {
            description: data[0].description || "",
            created_by: data[0].created_by,
            originalId: data[0].id, // Keep original ID for database operations
            start_time: data[0].start_time,
          },
        };
        console.log("Adding new event to state:", newEvent); // Debug
        setEvents([...events, newEvent]);
        toast.success("Event created!");
        handleSidebarClose();
      }
    } else {
      // Use original ID for database operations
      const dbId = selectedEvent.extendedProps?.originalId || selectedEvent.id;
      console.log("Updating event with ID:", dbId); // Debug

      const { error } = await supabase
        .from("events")
        .update(eventToSave)
        .eq("id", dbId);

      if (error) {
        console.error("Update error:", error); // Debug
        toast.error(error.message);
      } else {
        console.log("Event updated successfully"); // Debug
        // Update local events state after saving
        const updatedEvents = events.map((evt) =>
          evt.id === selectedEvent.id
            ? {
                ...evt,
                ...eventToSave,
                allDay: !eventToSave.start_time,
                start: eventToSave.date,
              }
            : evt
        );
        setEvents(updatedEvents);

        // Update the calendar event if it has the methods
        if (selectedEvent.setProp) {
          selectedEvent.setProp("title", event.title);
          selectedEvent.setExtendedProp("description", event.description);
          selectedEvent.setProp("backgroundColor", event.backgroundColor);
          selectedEvent.setProp("borderColor", event.backgroundColor);
          selectedEvent.setExtendedProp(
            "start_time",
            event.extendedProps.start_time
          );
        }

        toast.success("Event updated!");
        handleSidebarClose();
      }
    }
  };

  const handleDeleteEvent = async (event) => {
    // Use original ID for database operations
    const dbId = event.extendedProps?.originalId || event.id;
    console.log("Deleting event with ID:", dbId); // Debug

    const { error } = await supabase.from("events").delete().eq("id", dbId);

    if (error) {
      console.error("Delete error:", error); // Debug
      toast.error(error.message);
    } else {
      console.log("Event deleted successfully"); // Debug
      // Update local events state
      const updatedEvents = events.filter((evt) => evt.id !== event.id);
      setEvents(updatedEvents);

      // Remove from calendar if it has the remove method
      if (event.remove) {
        event.remove();
      }

      toast.success("Event deleted!");
      handleSidebarClose();
    }
  };

  const handleDeleteAllEvents = async () => {
    const { error } = await supabase.rpc("delete_all_user_events");

    if (error) {
      console.error("Delete all events error:", error);
      toast.error("Failed to delete all events.");
    } else {
      console.log("All user events deleted successfully");
      setEvents(events.filter((e) => e.extendedProps.created_by !== user.id));
      toast.success("All your events have been deleted.");
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
    <DashboardLayout user={user} isAdmin={user?.role === "admin"}>
      <div className="grid grid-cols-10 gap-8 bg-gray-50 dark:bg-gray-900 min-h-screen p-4 rounded-lg">
        <div
          className={`col-span-10 ${
            selectedEvent ? "lg:col-span-7" : "lg:col-span-10"
          } transition-all duration-300`}
        >
          <Card>
            <CardHeader>
              <CardTitle>Events Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <FullCalendar
                key={events.length} // Force re-render when events change
                plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                events={events}
                editable={user?.role === "admin" || user?.role === "teacher"}
                selectable={true}
                select={handleDateSelect}
                eventClick={handleEventClick}
                height="auto"
                dayMaxEventRows={true}
                views={{
                  dayGridMonth: { dayMaxEventRows: 4 },
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
              onTitleChange={(e) => {
                console.log(
                  "Title changing, preserving event data:",
                  selectedEvent
                ); // Debug
                setSelectedEvent({ ...selectedEvent, title: e.target.value });
              }}
              onDescChange={(e) => {
                console.log(
                  "Description changing, preserving event data:",
                  selectedEvent
                ); // Debug
                setSelectedEvent({
                  ...selectedEvent,
                  description: e.target.value,
                });
              }}
              onTimeChange={(e) => {
                setSelectedEvent({
                  ...selectedEvent,
                  extendedProps: {
                    ...selectedEvent.extendedProps,
                    start_time: e.target.value,
                  },
                });
              }}
              onColorChange={(e) => {
                setSelectedEvent({
                  ...selectedEvent,
                  backgroundColor: e.target.value,
                });
              }}
            />
          </div>
        )}
        <div className="col-span-10">
          <MonthlyEventsList
            events={currentMonthEvents}
            onDeleteAll={handleDeleteAllEvents}
            onEventClick={(event) => {
              // When clicking on the list, find the corresponding calendar event object
              const calendarEvent = events.find(
                (e) => e.id === String(event.id)
              );
              if (calendarEvent) {
                setSelectedEvent(calendarEvent);
                setIsNewEvent(false);
              } else {
                console.error(
                  "Couldn't find matching calendar event for list item:",
                  event
                );
              }
            }}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
