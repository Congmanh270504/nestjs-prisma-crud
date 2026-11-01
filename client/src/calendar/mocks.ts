import type { TEventColor } from "@/calendar/types";
import type { IEvent, IUser } from "@/calendar/interfaces";

// ================================== //

export const USERS_MOCK: IUser[] = [
  {
    id: "dd503cf9-6c38-43cf-94cc-0d4032e2f77a",
    name: "Leonardo Ramos",
    picturePath: null,
  },
  {
    id: "f3b035ac-49f7-4e92-a715-35680bf63175",
    name: "Michael Doe",
    picturePath: null,
  },
  {
    id: "3e36ea6e-78f3-40dd-ab8c-a6c737c3c422",
    name: "Alice Johnson",
    picturePath: null,
  },
  {
    id: "a7aff6bd-a50a-4d6a-ab57-76f76bb27cf5",
    name: "Robert Smith",
    picturePath: null,
  },
];

const COLORS: TEventColor[] = ["blue", "green", "red", "yellow", "purple", "orange", "gray"];

const EVENTS = [
  "Doctor's appointment",
  "Dental cleaning",
  "Eye exam",
  "Therapy session",
  "Business meeting",
  "Team stand-up",
  "Project deadline",
  "Weekly report submission",
  "Client presentation",
  "Marketing strategy review",
  "Networking event",
  "Sales call",
  "Investor pitch",
  "Board meeting",
  "Employee training",
  "Performance review",
  "One-on-one meeting",
  "Lunch with a colleague",
  "HR interview",
  "Conference call",
  "Web development sprint planning",
  "Software deployment",
  "Code review",
  "QA testing session",
  "Cybersecurity audit",
  "Server maintenance",
  "API integration update",
  "Data backup",
  "Cloud migration",
  "System upgrade",
  "Content planning session",
  "Product launch",
  "Customer support review",
  "Team building activity",
  "Legal consultation",
  "Budget review",
  "Financial planning session",
  "Tax filing deadline",
  "Investor relations update",
  "Partnership negotiation",
  "Medical check-up",
  "Vaccination appointment",
  "Blood donation",
  "Gym workout",
  "Yoga class",
  "Physical therapy session",
  "Nutrition consultation",
  "Personal trainer session",
  "Parent-teacher meeting",
  "School open house",
  "College application deadline",
  "Final exam",
  "Graduation ceremony",
  "Job interview",
  "Internship orientation",
  "Office relocation",
  "Business trip",
  "Flight departure",
  "Hotel check-in",
  "Vacation planning",
  "Birthday party",
  "Wedding anniversary",
  "Family reunion",
  "Housewarming party",
  "Community volunteer work",
  "Charity fundraiser",
  "Religious service",
  "Concert attendance",
  "Theater play",
  "Movie night",
  "Sporting event",
  "Football match",
  "Basketball game",
  "Tennis practice",
  "Marathon training",
  "Cycling event",
  "Fishing trip",
  "Camping weekend",
  "Hiking expedition",
  "Photography session",
  "Art workshop",
  "Cooking class",
  "Book club meeting",
  "Grocery shopping",
  "Car maintenance",
  "Home renovation meeting",
];

// Deterministic pseudo-random number generator (Mulberry32)
function createPrng(seed = 123456789) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic mock generator to prevent React Hydration mismatch
const mockGenerator = (numberOfEvents: number): IEvent[] => {
  const random = createPrng(42);

  const result: IEvent[] = [
    {
      id: 1204,
      startDate: new Date("2025-09-20T00:00:00-03:00").toISOString(),
      endDate: new Date("2025-09-20T23:59:00-03:00").toISOString(),
      title: "My wedding :)",
      color: "red",
      description: "Can't wait to see the most beautiful woman in that dress!",
      user: USERS_MOCK[0],
    },
  ];

  let currentId = 1;

  const randomUser = USERS_MOCK[Math.floor(random() * USERS_MOCK.length)];

  // Date range: 30 days before and after now (anchored to noon today UTC for consistency)
  const today = new Date();
  const baseNow = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0));
  const startRange = new Date(baseNow);
  startRange.setUTCDate(baseNow.getUTCDate() - 30);
  const endRange = new Date(baseNow);
  endRange.setUTCDate(baseNow.getUTCDate() + 30);

  // Create an event happening today
  const currentEvent = {
    id: currentId++,
    startDate: new Date(baseNow.getTime() - 30 * 60000).toISOString(),
    endDate: new Date(baseNow.getTime() + 30 * 60000).toISOString(),
    title: EVENTS[Math.floor(random() * EVENTS.length)],
    color: COLORS[Math.floor(random() * COLORS.length)],
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    user: randomUser,
  };

  if (baseNow.getUTCMonth() !== 8 || baseNow.getUTCDate() !== 20) {
    result.push(currentEvent);
  }

  // Generate the remaining events deterministically
  let i = 0;
  let attempts = 0;
  const maxAttempts = numberOfEvents * 3;

  while (i < numberOfEvents - 1 && attempts < maxAttempts) {
    attempts++;

    const isMultiDay = random() < 0.1;

    const startDate = new Date(startRange.getTime() + random() * (endRange.getTime() - startRange.getTime()));

    if (startDate.getUTCMonth() === 8 && startDate.getUTCDate() === 20) {
      continue;
    }

    startDate.setUTCHours(8 + Math.floor(random() * 8), Math.floor(random() * 4) * 15, 0, 0);

    const endDate = new Date(startDate);

    if (isMultiDay) {
      const additionalDays = Math.floor(random() * 4) + 1;
      endDate.setUTCDate(startDate.getUTCDate() + additionalDays);

      const endMonth = endDate.getUTCMonth();
      const endDay = endDate.getUTCDate();
      const startMonth = startDate.getUTCMonth();
      const startDay = startDate.getUTCDate();

      if (
        (startMonth === 8 && startDay < 20 && (endMonth > 8 || (endMonth === 8 && endDay >= 20))) ||
        (endMonth === 8 && endDay >= 20 && (startMonth < 8 || (startMonth === 8 && startDay < 20)))
      ) {
        continue;
      }

      endDate.setUTCHours(8 + Math.floor(random() * 12), Math.floor(random() * 4) * 15, 0, 0);
    } else {
      const durationMinutes = (Math.floor(random() * 11) + 2) * 15;
      endDate.setTime(endDate.getTime() + durationMinutes * 60 * 1000);
    }

    result.push({
      id: currentId++,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      title: EVENTS[Math.floor(random() * EVENTS.length)],
      color: COLORS[Math.floor(random() * COLORS.length)],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      user: USERS_MOCK[Math.floor(random() * USERS_MOCK.length)],
    });

    i++;
  }

  return result;
};

export const CALENDAR_ITEMS_MOCK: IEvent[] = mockGenerator(80);
