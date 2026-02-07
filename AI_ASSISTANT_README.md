# 🤖 AI Assistant for Orchestrate

## Overview

The Orchestrate platform now includes an AI-powered assistant that helps you manage your events with natural language queries. The assistant uses OpenAI's GPT-4o-mini model with RAG (Retrieval-Augmented Generation) to provide accurate, context-aware answers about your events.

## Features

✅ **Event-Specific Context**: AI has access to all event details including:
- Event information (name, date, location, status, capacity)
- Schedule and speakers
- Todo lists and task status
- Timeline and milestones
- Merchandise orders and supplies
- Tickets issued
- Pricing information

✅ **Natural Language Queries**: Ask questions in plain English like:
- "What tasks are still pending?"
- "Who are the speakers?"
- "How many tickets have been sold?"
- "Give me a summary of this event"
- "What needs immediate attention?"

✅ **Smart Suggestions**: Get relevant question suggestions based on your event data

✅ **Beautiful UI**: Glassmorphic design with smooth animations

## How to Use

### 1. Setup (Already Done ✓)

Your OpenAI API key has been configured in the `.env` file:
```
REACT_APP_OPENAI_API_KEY=sk-proj-...
```

**Important**: Never commit this file to git! It's already in `.gitignore`.

### 2. Accessing the AI Assistant

1. Navigate to **Timeline** page (📅 Event Timeline & Projects)
2. Switch to **Project View** using the toggle at the top
3. Select an event from the dropdown
4. Click the **AI Assistant button** (floating button with robot icon) in the bottom-right corner

### 3. Asking Questions

Once the chat drawer opens:
- Type your question in the text field
- Press **Enter** to send (or **Shift+Enter** for new line)
- Click on **suggested questions** for quick insights
- The AI will respond with information specific to your selected event

### 4. Example Queries

**Task Management:**
- "What tasks are urgent?"
- "Show me all pending tasks"
- "Who is responsible for what?"

**Event Planning:**
- "What's the schedule for this event?"
- "Tell me about the venue details"
- "What's our ticket sales status?"

**Progress Tracking:**
- "What milestones are completed?"
- "Give me a progress update"
- "What's left to do before the event?"

**Logistics:**
- "What merchandise have we ordered?"
- "Show me supplier information"
- "What tickets have been issued?"

## Technical Details

### Architecture

```
┌─────────────────┐
│  EventTimeline  │
│   Component     │
└────────┬────────┘
         │
         ├─ Selects event
         │
┌────────▼─────────────────┐
│  EventChatAssistant      │
│  Component (Drawer UI)   │
└────────┬─────────────────┘
         │
         ├─ Builds context (RAG)
         │
┌────────▼─────────────────┐
│  openaiService.js        │
│  - buildEventContext()   │
│  - chatWithEventAssistant()│
└────────┬─────────────────┘
         │
         ├─ API Call
         │
┌────────▼─────────────────┐
│  OpenAI GPT-4o-mini API  │
│  (with system prompt +   │
│   event context)         │
└──────────────────────────┘
```

### Cost Estimation

Using GPT-4o-mini:
- **Input**: ~$0.15 per 1M tokens
- **Output**: ~$0.60 per 1M tokens
- **Average query**: $0.001 - $0.005 (less than a penny)
- **100 queries**: ~$0.10 - $0.50

Very affordable for typical event management usage!

### Context Builder (RAG)

The `buildEventContext()` function extracts all relevant data:
```javascript
- Event basic info (name, date, location, etc.)
- Schedule items with speakers
- Todo list with status and assignees
- Timeline milestones with completion status
- Related merchandise orders
- Tickets issued
- Pricing tiers
```

This context is passed to OpenAI with every query, ensuring accurate and relevant responses.

## Customization

### Change AI Model

Edit `src/services/openaiService.js`:
```javascript
model: 'gpt-4o-mini', // Change to 'gpt-4o' for more powerful responses
```

### Adjust Response Length

```javascript
max_tokens: 1000, // Increase for longer responses
```

### Modify System Prompt

Customize the AI's behavior by editing the `systemMessage` in `chatWithEventAssistant()`.

### Add More Suggested Questions

Edit `generateSuggestedQuestions()` in `openaiService.js`.

## Troubleshooting

**Error: "OpenAI API key is not configured"**
- Make sure `.env` file exists in the project root
- Verify `REACT_APP_OPENAI_API_KEY` is set
- Restart your development server after adding the key

**Error: "Failed to get response from OpenAI"**
- Check your API key is valid
- Verify you have credits in your OpenAI account
- Check your internet connection
- Look at the browser console for detailed error messages

**Chat button not appearing**
- Make sure you're on the Timeline page
- Switch to "Project View"
- Select an event from the dropdown

**Responses are inaccurate**
- The AI can only access data from the selected event
- Make sure your event data is complete and up-to-date
- Try rephrasing your question

## Future Enhancements

Potential improvements for the AI assistant:

1. **Multi-Event Queries**: Ask questions across multiple events
2. **Action Execution**: AI can create tasks, update statuses, etc.
3. **Voice Input**: Talk to your AI assistant
4. **Proactive Suggestions**: AI alerts you about urgent tasks
5. **Export Conversations**: Save chat history for reference
6. **Advanced RAG**: Use vector databases for semantic search
7. **Custom Training**: Fine-tune on your organization's event data

## API Key Security

⚠️ **Important Security Notes:**

1. **Never commit `.env`** to version control (already in .gitignore)
2. **Use environment variables** in production (not hardcoded keys)
3. **Rotate keys regularly** if exposed
4. **Set usage limits** in OpenAI dashboard
5. **Monitor usage** to detect unusual activity

## Support

For issues or questions:
1. Check browser console for errors
2. Verify API key configuration
3. Test with simple queries first
4. Check OpenAI API status: https://status.openai.com

## License

Part of the Orchestrate event management platform.
