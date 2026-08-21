export type GhlCustomField = { id: string; value: unknown };

export type GhlContact = {
  id: string;
  locationId: string;
  contactName?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  assignedTo?: string | null;
  tags?: string[];
  dateAdded?: string;
  dateUpdated?: string;
  customFields?: GhlCustomField[];
  companyName?: string | null;
  source?: string | null;
};

export type GhlNote = {
  id: string;
  body: string;
  bodyText?: string;
  userId?: string | null;
  dateAdded: string;
  contactId: string;
};

export type GhlAppointment = {
  id: string;
  title: string;
  calendarId: string;
  contactId: string;
  assignedUserId?: string | null;
  startTime: string;
  endTime: string;
  appointmentStatus: string;
  dateAdded: string;
};

export type GhlTask = {
  id: string;
  title: string;
  body?: string;
  dueDate?: string | null;
  completed: boolean;
  assignedTo?: string | null;
};

export type GhlOpportunity = {
  id: string;
  name: string;
  monetaryValue: number;
  pipelineId: string;
  pipelineStageId: string;
  assignedTo?: string | null;
  status: string;
  contactId: string;
  locationId: string;
  createdAt: string;
  updatedAt: string;
  contact?: {
    id: string;
    name?: string;
    email?: string | null;
    phone?: string | null;
  };
};
