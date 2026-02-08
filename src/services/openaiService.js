import OpenAI from 'openai';
import { getEvent } from './firebaseDbService';

// Initialize OpenAI client safely
let openai;
try {
  if (process.env.REACT_APP_OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.REACT_APP_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }
} catch (error) {
  console.warn("Failed to initialize OpenAI client:", error);
}

const getMockPrediction = () => ({
  summary: "Based on the event size (500 attendees) and duration (8 hours), we recommend a team of 12 volunteers focused on turning the chaos into coordination.",
  totalVolunteers: 12,
  roles: [
    {
      role: "Registration Specialist",
      count: 4,
      responsibilities: ["Check-in attendees", "Distribute badges", "Answer FAQs"],
      reasoning: "High traffic expected at 9:00 AM."
    },
    {
      role: "Wayfinding Guide",
      count: 4,
      responsibilities: ["Direct attendees", "Manage queues", "Monitor capacity"],
      reasoning: "Complex venue layout requires guidance."
    },
    {
      role: "Content Support",
      count: 2,
      responsibilities: ["Assist speakers", "Manage mics", "Timekeeping"],
      reasoning: "Multiple simultaneous sessions."
    },
    {
      role: "Logistics Runner",
      count: 2,
      responsibilities: ["Restock supplies", "Coordinate shifts", "Emergency contact"],
      reasoning: "Ensures smooth operations."
    }
  ],
  shifts: [
    { name: "Morning Peak", time: "08:00 - 12:00", volunteersNeeded: 12 },
    { name: "Afternoon Session", time: "12:00 - 16:00", volunteersNeeded: 8 },
    { name: "Pack Down", time: "16:00 - 18:00", volunteersNeeded: 4 }
  ]
});

export const buildEventContext = (event, relatedOrders = [], relatedTickets = []) => {
  return `
    Event Name: ${event.title || event.name}
    Date: ${event.date}
    Location: ${event.location}
    Description: ${event.description}
    Attendees (Projected/Sold): ${event.attendees?.length || relatedTickets.length || 0}
    
    Orders Count: ${relatedOrders.length}
    Tickets Sold: ${relatedTickets.length}
    
    Schedule: ${event.schedule ? JSON.stringify(event.schedule) : 'Standard day schedule'}
  `;
};

export const generateSuggestedQuestions = (event) => {
  if (!event) return [];
  return [
    `What is the schedule for ${event.name || 'this event'}?`,
    "How many tickets have been sold?",
    "Draft an announcement for volunteers.",
    "What tasks are currently pending?"
  ];
};

export const predictVolunteerNeeds = async (event) => {
  if (!openai) {
    console.warn("OpenAI API Key missing, returning mock prediction.");
    return getMockPrediction();
  }

  const context = buildEventContext(event);

  const systemMessage = {
    role: 'system',
    content: `You are an expert event planner and volunteer coordinator. 
    Analyze the provided event details and predict the volunteer requirements.
    
    Return a JSON object with the following structure:
    {
      "summary": "Brief explanation of the overall staffing strategy",
      "totalVolunteers": Number,
      "roles": [
        {
          "role": "Role Name",
          "count": Number,
          "responsibilities": ["List of specific responsibilities"],
          "reasoning": "Why this role is needed"
        }
      ],
      "shifts": [
        {
          "name": "Shift Name",
          "time": "HH:MM",
          "volunteersNeeded": Number
        }
      ]
    }
    
    Current Event Details:
    ${context}
    
    CRITICAL INSTRUCTIONS:
    1. GENERATE DIVERSE AND UNIQUE TASKS. Do not just suggest generic roles like "General Volunteer". 
    2. Be specific to the event type (e.g., if it's a concert, suggest "Stagehand", "Usher", "Merch Seller").
    3. Ensure roles are distinct and do not overlap significantly in responsibilities.
    4. Provide a varied set of shifts if applicable.
    
    Consider:
    - Event capacity and attendees
    - Schedule complexity
    - Venue logistics`
  };

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.REACT_APP_OPENAI_MODEL || "gpt-3.5-turbo",
      messages: [
        systemMessage,
        { role: "user", content: "Generate volunteer plan." }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const prediction = JSON.parse(completion.choices[0].message.content);
    return prediction;

  } catch (error) {
    console.error("OpenAI Error:", error);
    return getMockPrediction(); // Fallback
  }
};

export const chatWithEventAssistant = async (messages, eventContext) => {
  if (!openai) {
    return { message: "I'm in demo mode. Please add an API key for live chat." };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: `You are a helpful assistant for event planning. Context: ${eventContext}` },
        ...messages
      ],
    });
    return { message: completion.choices[0].message.content };
  } catch (error) {
    console.error("Chat Error:", error);
    throw new Error("Sorry, I'm having trouble connecting right now.");
  }
};
