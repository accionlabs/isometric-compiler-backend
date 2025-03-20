// import { z } from 'zod'
// import {
//   __LLM_PLATFORM,
//   generateJsonWithConversation,
// } from '../../services/llm'
// import { fetchChatHistory, saveChatContext } from '../../services/chat_service'
// import fs from 'fs'

// const __CLASSIFIER_PROMPT__ = fs.readFileSync(
//   './agents/classifier_agent/CLASSIFIER_AGENT_PROMPT.md',
//   'utf8',
// )

// const fetchOldConversationContext = async (uuid?: string): Promise<any[]> => {
//   if (!uuid) {
//     return []
//   }
//   const oldHistory = await fetchChatHistory('chat-' + uuid)
//   const conversations = oldHistory?.conversations
//   return conversations && conversations.length > 0
//     ? JSON.parse(conversations)
//     : []
// }

// interface ClassifierResult {
//   // Define the structure of the result returned by generateJsonWithConversation
//   [key: string]: any
// }

// const processClassifierAgent = async (
//   question: string,
//   availableDocuments: string[] = [],
//   newDocument: string,
//   uuid?: string,
// ): Promise<ClassifierResult> => {
//   const conversations = await fetchOldConversationContext(uuid)
//   const placeholders = {
//     conversations,
//     uploadedDocuments: availableDocuments.map((x) => `"${x}"`).join(','),
//     uploadedFile: newDocument,
//     question,
//   }

//   const result = await generateJsonWithConversation(
//     __CLASSIFIER_PROMPT__,
//     placeholders,
//     __LLM_PLATFORM.OPENAI,
//   )

//   if (uuid) {
//     conversations.push(question)
//     conversations.push(JSON.stringify(result))
//     await saveChatContext('chat-' + uuid, {
//       context: '',
//       metadata: '',
//       conversations: JSON.stringify(conversations),
//     })
//   }

//   return result
// }

// export { processClassifierAgent }
