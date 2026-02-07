/**
 * OpenAI API Service
 * Handles communication with OpenAI API for event-specific chat assistance
 */

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Build context from event data for RAG
 */
export const buildEventContext = (event, relatedOrders = [], relatedTickets = []) => {
  if (!event) return '';

  const context = `
EVENT INFORMATION:
Name: ${event.name}
Description: ${event.description || 'No description'}
Date: ${event.date ? new Date(event.date).toLocaleString() : 'Not set'}
${event.endDate ? `End Date: ${new Date(event.endDate).toLocaleString()}` : ''}
Location: ${event.location || 'Not set'}
Venue: ${event.venue?.name || 'Not set'}
Capacity: ${event.capacity || 'Not set'}
Status: ${event.status || 'Unknown'}
Category: ${event.category || 'Not set'}
Organizer: ${event.organizer || 'Not set'}

${event.attendees !== undefined ? `Attendees: ${event.attendees}` : ''}
${event.tickets ? `Tickets - Total: ${event.tickets.total}, Sold: ${event.tickets.sold}, Available: ${event.tickets.available}` : ''}

${event.schedule && event.schedule.length > 0 ? `
SCHEDULE:
${event.schedule.map(item => `- ${item.time}: ${item.activity}${item.speaker ? ` (${item.speaker})` : ''}`).join('\n')}
` : ''}

${event.speakers && event.speakers.length > 0 ? `
SPEAKERS:
${event.speakers.map(s => `- ${s.name} (${s.title}): ${s.topic}`).join('\n')}
` : ''}

${event.todos && event.todos.length > 0 ? `
TODO LIST:
${event.todos.map(todo => `- [${todo.status}] ${todo.task} (Due: ${new Date(todo.dueDate).toLocaleDateString()}, Assigned: ${todo.assignedTo}, Priority: ${todo.priority})`).join('\n')}
` : ''}

${event.timeline && event.timeline.length > 0 ? `
TIMELINE/MILESTONES:
${event.timeline.map(item => `- [${item.status}] ${item.step}: ${item.description} (${new Date(item.timestamp).toLocaleDateString()})`).join('\n')}
` : ''}

${relatedOrders.length > 0 ? `
MERCHANDISE & SUPPLIES:
${relatedOrders.map(order => `- ${order.orderNumber}: ${order.itemType || 'Items'} - Status: ${order.status}, Amount: $${order.totalAmount}, Supplier: ${order.supplier || 'N/A'}`).join('\n')}
` : ''}

${relatedTickets.length > 0 ? `
TICKETS ISSUED:
${relatedTickets.length} tickets sold
${relatedTickets.slice(0, 5).map(ticket => `- ${ticket.ticketNumber}: ${ticket.holderName} (${ticket.ticketType}) - $${ticket.price}`).join('\n')}
${relatedTickets.length > 5 ? `... and ${relatedTickets.length - 5} more tickets` : ''}
` : ''}

${event.pricing ? `
PRICING:
${Object.entries(event.pricing).map(([type, price]) => `- ${type}: $${price}`).join('\n')}
` : ''}

${event.tags && event.tags.length > 0 ? `Tags: ${event.tags.join(', ')}` : ''}
`.trim();

  return context;
};

/**
 * Call OpenAI API with event context
 */
export const chatWithEventAssistant = async (messages, eventContext) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please add REACT_APP_OPENAI_API_KEY to your .env file.');
  }

  const systemMessage = {
    role: 'system',
    content: `You are a helpful AI assistant for the Orchestrate event management platform. You help users understand and manage their events by answering questions about event details, schedules, todos, tickets, merchandise, and timelines.

You have access to the following event information:

${eventContext}

When answering questions:
- Be concise and helpful
- Reference specific data from the event information above
- If asked about tasks or todos, mention their status, priority, and assignee
- If asked about timeline or milestones, provide dates and completion status
- If asked about tickets or attendance, provide accurate numbers
- If information is not available in the context, politely say so
- Use emojis sparingly to make responses friendly
- Format lists and data clearly

Your goal is to help event organizers quickly access information and insights about their events.`
  };

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective and fast
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get response from OpenAI');
    }

    const data = await response.json();
    return {
      message: data.choices[0].message.content,
      usage: data.usage
    };
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
};

/**
 * Generate suggested questions based on event data
 */
export const generateSuggestedQuestions = (event) => {
  const questions = [];

  if (event?.todos && event.todos.length > 0) {
    questions.push("What tasks are still pending?");
    questions.push("Which tasks are marked as urgent?");
  }

  if (event?.schedule && event.schedule.length > 0) {
    questions.push("What's on the schedule?");
    questions.push("Who are the speakers?");
  }

  if (event?.tickets) {
    questions.push("How many tickets have been sold?");
  }

  if (event?.timeline && event.timeline.length > 0) {
    questions.push("What milestones are completed?");
    questions.push("What's the progress status?");
  }

  questions.push("Give me a summary of this event");
  questions.push("What needs immediate attention?");

  return questions;
};
