import { OpenAIAgentsProvider } from '@corsair-dev/mcp';
import { Agent, run, tool, setOpenAIAPI, setTracingDisabled } from '@openai/agents';
import { corsair } from './corsair';
import { GoogleGenAI } from "@google/genai";


setOpenAIAPI('chat_completions');


const embeddingModel = new GoogleGenAI({
  apiKey: process.env.OPENAI_API_KEY!,

});

export async function generateEmbedding(text: string[]) {

 const embed= await embeddingModel.models.embedContent({
  model: "gemini-embedding-2",
  contents:text,
});
  return embed?.embeddings?.[0].values;
}
setTracingDisabled(true);
export async function ai(userMssg: string, tenantId?: string) {
  // Fetch contacts if tenantId is provided
  let contactsText = "";
  if (tenantId) {
    try {
      const { db } = await import("@/db/db");
      const { contactAlias } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");
      const rows = await db
        .select({ name: contactAlias.name, emailid: contactAlias.emailid })
        .from(contactAlias)
        .where(eq(contactAlias.tenantid, tenantId));
      if (rows.length > 0) {
        contactsText = `\n\nCONTACTS LIST (use these to resolve recipient names to email addresses):\n${rows.map((r) => `- ${r.name} <${r.emailid}>`).join("\n")}`;
      }
    } catch {
      // ignore contacts fetch errors
    }
  }

  // Use tenant-scoped corsair instance for multi-tenancy
  const scopedCorsair = tenantId ? corsair.withTenant(tenantId) : corsair;
  const provider = new OpenAIAgentsProvider();
  const allTools = provider.build({ corsair: scopedCorsair, tool });
  // Only keep corsair_setup and run_script — gemma struggles with too many tools
  const tools = (allTools as any[]).filter(
    (t) => t.name === "corsair_setup" || t.name === "run_script"
  );
  for (const t of tools as any[]) {
    if (t.name === "run_script") {
      t.parameters = {
        type: "object",
        properties: {
          code: {
            type: "string",
          },
        },
        required: ["code"],
        additionalProperties: false,
      };
    }

    if (t.name === "corsair_setup") {
      t.parameters = {
        type: "object",
        properties: {},
        additionalProperties: false,
      };
    }
  }
  const agent = new Agent({
    name: 'corsair-agent',
    model: 'gemma-4-31b-it',
    modelSettings:{
      reasoning:{
        effort:"high"
      }
    },
    instructions: `
You are a Corsair-powered assistant with access to Gmail and Google Calendar.

RULES:
1. For EVERY request, FIRST call corsair_setup with empty parameters {}.
2. Then call run_script with the code to execute.
3. Always provide a final answer to the user after tool calls.

ONLY TWO TOOLS EXIST — call exactly one tool at a time:
- corsair_setup: call with {} to initialize
- run_script: call with {"code": "return ..."} to run Gmail or Calendar operations

GMAIL EXAMPLES:
Send email:
  Tool: run_script
  Parameters: {"code": "return await corsair.gmail.api.messages.send({ to: 'user@example.com', subject: 'Hello', body: 'Message here' });"}

List emails:
  Tool: run_script
  Parameters: {"code": "return await corsair.gmail.api.messages.list({ maxResults: 10 });"}

Get email:
  Tool: run_script
  Parameters: {"code": "return await corsair.gmail.api.messages.get({ id: 'message_id' });"}

CALENDAR EXAMPLES:
List events:
  Tool: run_script
  Parameters: {"code": "return await corsair.googlecalendar.api.events.list({ calendarId: 'primary', maxResults: 10 });"}

Create event:
  Tool: run_script
  Parameters: {"code": "return await corsair.googlecalendar.api.events.create({ calendarId: 'primary', summary: 'Meeting', start: { dateTime: '2026-06-19T10:00:00' }, end: { dateTime: '2026-06-19T11:00:00' } });"}

CONTACTS:
${contactsText}

Be concise. Return results directly. Do not explain tool calls.
`,
    tools,
  });

  const stream = await run(agent,userMssg, {stream:true});

  return stream
}

